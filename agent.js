const sdk = VoxImplant.getInstance();
const ACCOUNT_NODE = VoxImplant.ConnectionNode.NODE_9;
let newCall = null;

async function login() {
    
    const initParameters = {
        node:ACCOUNT_NODE,
        micRequired: true,
        videoSupport: true,
        queueType: VoxImplant.QueueTypes.SmartQueue,
        showDebugInfo: true,
        showWarnings: true
    }

    try {
        await sdk.init(initParameters);
        console.log("sdk inicializado");
    } catch (e) {
        console.error("Falha: ", e);
    }

    await sdk.connect();

    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    sdk.on(VoxImplant.Events.AuthResult , async function (e) {
        if (e.result === true) {
            console.log("Login com sucesso")

            try {
                const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio:true})
                document.getElementById("localVideo").srcObject = localStream;
            } catch (error) {
                console.error("Erro ao acessar câmera: ", error);
            };
        } else {
            console.log("Erro no login", e.code, e.message);
        }
    });

    await sdk.login(`${login}@videocontactcenter.vlima.voximplant.com`, password)
}

async function statusChange() {
    const newStatus = document.getElementById("statusSelect").value;
    try {
        await sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses[newStatus], newStatus);
        console.log("Status atualizado para:", newStatus);
    } catch (e) {
        console.error("Erro ao atualizar o status: ", e);
    }
}

sdk.on(VoxImplant.Events.IncomingCall, function (e) {
    newCall = e.call;
    console.log("Chamada recebida de:", newCall.from);

    newCall.addEventListener(VoxImplant.CallEvents.Connected, () => {
        newCall.getEndpoints().forEach((endpoint) => {
            endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (event) => {
                const remoteVideo = document.getElementById("remoteVideo");
                event.mediaRenderer.render(remoteVideo);
                console.log("📺 Vídeo remoto renderizado no agente");
            });
        });

        newCall.on(VoxImplant.CallEvents.EndpointAdded, (e) => {
            e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (event) => {
                const remoteVideo = document.getElementById("remoteVideo");
                event.mediaRenderer.render(remoteVideo);
                console.log("Vídeo remoto renderizado após endpoint adicionado");
            });
        });
    });

    newCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
        console.log("Chamada encerrada");
        newCall = null;
    });

    newCall.addEventListener(VoxImplant.CallEvents.Failed, () => {
        console.log("Chamada falhou");
    });
});

async function acceptCall() {
    
    newCall.answer(
        undefined,
        undefined,
        { sendVideo: true, receiveVideo: true },
        false
    );

    sdk.showLocalVideo(true);

    const streamManager = VoxImplant.Hardware.StreamManager.get();
    streamManager.on(VoxImplant.Hardware.HardwareEvents.MediaRendererAdded, (e) => {
        const localNode = document.getElementById("localVideo");
        e.renderer.render(localNode);
        console.log("📷 Vídeo local renderizado");
    });

    const localStream = streamManager.getLocalStream();
    const videoTracks = localStream ? localStream.getVideoTracks() : [];

    if (videoTracks.length > 0 && videoTracks[0].enabled) {
        console.log("✅ Agente está enviando vídeo:", videoTracks[0]);
    } else {
        console.warn("⚠️ Nenhum vídeo sendo enviado pelo agente.");
    }
}

function declineCall () {
    if (newCall) {
        newCall.decline();
        newCall = null;
    }
};

function endCall() {
    if (newCall) {
        newCall.hangup();
        console.log("Chamada finalizada pelo agente");
    }
}
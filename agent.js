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
        await sdk.setOperatorACDStatus(newStatus);
        console.log("Status atualizado para:", newStatus);
    } catch (e) {
        console.error("Erro ao atualizar o status: ", e);
    }
}

sdk.on(VoxImplant.Events.IncomingCall, function (e) {
    newCall = e.call;
    console.log("Incoming call from: ", newCall.from);
    
    e.call.addEventListener(VoxImplant.CallEvents.Connected, (e) => {
        e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (e) => {
            const remoteVideo = document.getElementById("remoteVideo");
            e.mediaRenderer.render(remoteVideo)
        });
    });

    newCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
        newCall = null;
    });
    
    newCall.addEventListener(VoxImplant.CallEvents.Failed, () => {
        console.log("Chamada falha")
    });
})

async function acceptCall () {
    newCall.answer (
        undefined,
        undefined,
        {useVideo:{sendVideo:true,receiveVideo:true}},
        false,
    )
    sdk.showLocalVideo(true);
    const streamManager = VoxImplant.Hardware.StreamManager.get();
    streamManager.on(VoxImplant.HardwareEvents.MediaRendererUpdate, (e) => {
        let localNode = document.getElementById("localVideo");
        e.renderer.render(localNode)
    })
      
};
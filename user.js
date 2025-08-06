const sdk = VoxImplant.getInstance();
const ACCOUNT_NODE = VoxImplant.ConnectionNode.NODE_9;
let call, localStream;
let newCall = null;

async function initPreview() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;
    } catch (e) {
        console.error("Erro ao acessar câmera/mic:", e);
        alert("Não foi possível acessar sua câmera/microfone. Verifique as permissões.");
    }
}

async function login() {

    const initParameters = {
        node: ACCOUNT_NODE,
        queueType:VoxImplant.QueueTypes.SmartQueue,
        micRequired: true,
        videoSupport: true,
        //remoteVideoContainerId: "remoteVideo",
		//localVideoContainerId: "localVideo",
        showDebugInfo: true,
        showWarnings: true
    };
      
    try {
        await sdk.init(initParameters);
        console.log("SDK inicializado");
    } catch (e) {
        console.log("Falha ao inicializar SDK ", e.code,e.message);
    };
      
    await sdk.connect();

    sdk.on(VoxImplant.Events.AuthResult, function (e) {
        if (e.result === true){
          console.log("Login com sucesso")
        } else {
          console.log(e.code, e.message);
        }
    });

    await sdk.login(`user@videocontactcenter.vlima.voximplant.com`, "12345678");
}

async function startCall() {
    await login();
    //await initPreview();

    const callParameters = {
        number: "client",
        video: {
            sendVideo: true,
            receiveVideo: true
        }
    };

    call = sdk.call(callParameters);

    call.on(VoxImplant.CallEvents.EndpointAdded, (e) => {
        console.log("Novo endpoint adicionado ", e.endpoint.id);
        setupEndpointEvents(e.endpoint);
    })

    call.on(VoxImplant.CallEvents.Connected, () => {
        console.log("Chamada conectada");

        const streamManager = VoxImplant.Hardware.StreamManager.get();
        streamManager.on(VoxImplant.HardwareEvents.MediaRendererUpdate, (e) => {
            const localVideo = document.getElementById("localVideo");
            e.renderer.render(localVideo);
        });

        // Garantir que endpoints já conectados sejam tratados
        call.getEndpoints().forEach(endpoint => {
            console.log("Endpoint existente:", endpoint.id);
            setupEndpointEvents(endpoint);
        });
    });

    // Quando um novo endpoint (agente) entra na chamada
    call.on(VoxImplant.CallEvents.EndpointAdded, (e) => {
        console.log("Novo endpoint adicionado:", e.endpoint.id);
        setupEndpointEvents(e.endpoint);
    });

    call.on(VoxImplant.CallEvents.Failed, (e) => {
        console.error("Falha na chamada:", e);
    });

    call.on(VoxImplant.CallEvents.Disconnected, () => {
        console.log("Chamada encerrada");
    });
}

function setupEndpointEvents(endpoint) {
    endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (event) => {
        console.log("Vídeo remoto recebido do endpoint:", endpoint.id);
        const remoteVideo = document.getElementById("remoteVideo");
        event.mediaRenderer.render(remoteVideo);
        
        /*remoteVideo.play().catch(err => {
            console.warn("Erro ao tentar dar play no vídeo remoto ", err);
        });*/
        const playPromise = remoteVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Reprodução do vídeo remoto iniciada");
            }).catch((error) => {
                console.error("Erro ao tentar dar play no vídeo remoto ", error);
            });
        }
    });
}

function endCall() {
      if (call) {
        call.hangup();
        console.log("Chamada finalizada pelo cliente");
      }
    }
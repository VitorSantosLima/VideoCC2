const sdk = VoxImplant.getInstance();
const ACCOUNT_NODE = VoxImplant.ConnectionNode.NODE_9;
let call, localStream;

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
        remoteVideoContainerId: "remoteVideo",
		localVideoContainerId: "localVideo",
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
    
    await initPreview();
    
    const callParameters = {
        number: "client",
        video: {
            sendVideo: true,
            receiveVideo: true
        }
    }

    call = sdk.call(callParameters);

    call.on(VoxImplant.CallEvents.Connected, () => {
        console.log("Chamada conectada");
    });

    call.on(VoxImplant.CallEvents.Failed, (e) => {
        console.error("Falha na chamada:", e);
    });

    call.on(VoxImplant.CallEvents.Disconnected, () => {
        console.log("Chamada encerrada");
    });
}
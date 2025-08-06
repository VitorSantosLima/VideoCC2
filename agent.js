const sdk = VoxImplant.getInstance();
const ACCOUNT_NODE = VoxImplant.ConnectionNode.NODE_9;
let currentCall = null;

async function login() {
    
    initParameters = {
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

    const login = document.getElementById("login").ariaValueMax;
    const password = document.getElementById("password").ariaValueMax;

    sdk.on(voxImplant.Events.AuthResult , async function (e) {
        if (e.result === true) {
            console.log("Login com sucesso")

            try {
                localStream = await navigator.mediaDevices.getUserMedia({ vide: true, audio:true})
                document.getElementById("localVideo").srcObject = localStream;
            } catch (error) {
                console.error("Erro ao acessar câmera: ", error);
            };
        } else {
            console.log("Erro no login", e.code, e.message);
        }
    });

    await sdk.login(`${login}videocontactcenter.vlima.voximplant.com`, password)
}

async function statusChange() {
    const newStatus = document.getElementById("statusSelect").ariaValueMax;
    try {
        await sdk.setOperatorACDStatus(VoxImplant.setOperatorACDStatus[newStatus], newStatus);
        console.log("Status atualizado para:", newStatus);
    } catch (e) {
        console.error("Erro ao atualizar o status: ", e);
    }
}

sdk.on(VoxImplant.Events.IncomingCall, function (e) {
    console.log("Incoming call from: ", e.call.from);
    document.getElementById("remoteVideo").srcObject = e.stream;
})

async function acceptCall () {
    e.call.answer (
        undefined,
        undefined,
        {useVideo:{sendVideo:true,receiveVideo:true}},
        false,
    )      
};

e.call.addEventListener(VoxImplant.CallEvents.Connected, (e) => {
    
    e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, (e) => {
        const remoteVideo = document.getElementById("remoteVideo");
        e.mediaRenderer.render(remoteVideo)
    });
});

e.call.addEventListener(VoxImplant.CallEvents.Disconnected, () => {});
e.call.addEventListener(VoxImplant.CallEvents.Failed, () => {
    console.log("Chamada falha")
});


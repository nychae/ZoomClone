const socket = io();

const call = document.getElementById('call');
const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

call.hidden = true;

const getCameras = async() => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })

    } catch (e) {
        console.log(e);
    }
}

const getMedia = async (deviceId) => {
    try {
        const initialConstraints = {
            audio: true,
            video: { facingMode: 'user'},
        }

        const cameraConstraints = {
            audio: true,
            video: { deviceId: {exact: deviceId}}
        }

        myStream = await navigator.mediaDevices.getUserMedia(deviceId? cameraConstraints: initialConstraints);
        myFace.srcObject = myStream;

        if(!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}


const handleMuteClick = () => {
    myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);

    if(!muted) {
        muteBtn.innerText = 'Unmute';
        muted = true;
    } else {
        muteBtn.innerText = 'Mute';
        muted = false;
    }
}

const handleCameraClick = () => {
    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);

    if(cameraOff) {
        cameraBtn.innerText = 'Turn Camera Off';
        cameraOff = false;
    } else {
        cameraBtn.innerText = 'Turn Camera On';
        cameraOff = true;
    }
}

const handleCameraChange = async () => {
    await getMedia(camerasSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video');
        await videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);
camerasSelect.addEventListener('change', handleCameraChange);


// Welcome Form (choose a room)

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

const initCall = async () => {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}
const handleWelcomeSubmit = async (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector('input');
    await initCall();
    socket.emit('join_room', input.value);
    roomName = input.value;
    input.value = '';
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);


// Socket Code

socket.on('welcome_video', async () => {
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    console.log('sent the offer');
    socket.emit('offer', offer, roomName)
})

socket.on('offer', async (offer) => {
    console.log('received the offer');
    await myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);
    console.log('sent the answer');
    socket.emit('answer', answer, roomName);
})

socket.on('answer', async (answer) => {
    console.log('received the answer');
    await myPeerConnection.setRemoteDescription(answer);
})

socket.on('ice', async (ice) => {
    console.log('received candidate');
    await myPeerConnection.addIceCandidate(ice);
})

// RTC Code
const makeConnection = () => {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302',
                ]
            }
        ]
    });
    myPeerConnection.addEventListener('icecandidate', handleIce);
    myPeerConnection.addEventListener('track', handleTrack);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));

}

const handleIce = (data) => {
    console.log('sent candidate');
    socket.emit('ice', data.candidate, roomName);
}

const handleTrack = (data) => {
    const peerFace = document.getElementById('peerFace');
    peerFace.srcObject = data.streams[0];
}
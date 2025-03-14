const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

let myStream;
let muted = false;
let cameraOff = false;

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

getMedia();

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

const handleCameraChange = () => {
    getMedia(camerasSelect.value);
}

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);
camerasSelect.addEventListener('change', handleCameraChange);
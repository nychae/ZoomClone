const socket = io();
let userName;
let myStream;
let myPeerConnection;
let isMuted = false;
let isCameraOn = true;
let currentRoomName;

const roomList = document.getElementById('roomList');
const videoCall = document.getElementById('videoCall');

const muteIcon = {
    on: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L472.1 344.7c15.2-26 23.9-56.3 23.9-88.7l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 21.2-5.1 41.1-14.2 58.7L416 300.8 416 96c0-53-43-96-96-96s-96 43-96 96l0 54.3L38.8 5.1zM344 430.4c20.4-2.8 39.7-9.1 57.3-18.2l-43.1-33.9C346.1 382 333.3 384 320 384c-70.7 0-128-57.3-128-128l0-8.7L144.7 210c-.5 1.9-.7 3.9-.7 6l0 40c0 89.1 66.2 162.7 152 174.4l0 33.6-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l72 0 72 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-33.6z"/></svg>`,
    off: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M192 0C139 0 96 43 96 96l0 160c0 53 43 96 96 96s96-43 96-96l0-160c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 89.1 66.2 162.7 152 174.4l0 33.6-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l72 0 72 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-33.6c85.8-11.7 152-85.3 152-174.4l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 70.7-57.3 128-128 128s-128-57.3-128-128l0-40z"/></svg>`
}

const cameraOffIcon = {
    on: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1l0-17.1 0-128 0-17.1 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"/></svg>`,
    off: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-86.4-67.7 13.8 9.2c9.8 6.5 22.4 7.2 32.9 1.6s16.9-16.4 16.9-28.2l0-256c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.9 1.6l-96 64L448 174.9l0 17.1 0 128 0 5.8-32-25.1L416 128c0-35.3-28.7-64-64-64L113.9 64 38.8 5.1zM407 416.7L32.3 121.5c-.2 2.1-.3 4.3-.3 6.5l0 256c0 35.3 28.7 64 64 64l256 0c23.4 0 43.9-12.6 55-31.3z"/></svg>`
}

roomList.querySelector('.header > .icon').addEventListener('click', () => {
    document.querySelector('#addRoomPopup input').value = '';
    document.querySelector('.dim').classList.remove('hidden');
})

document.querySelector('.dim').addEventListener('click', (event) => {
    if(event.target.closest('div').classList.contains('dim')) {
        document.querySelector('#addRoomPopup input').value = '';
        document.querySelector('.dim').classList.add('hidden');
    }
})

document.querySelector('#addRoomPopup button').addEventListener('click', async () => {
    const roomName = document.getElementById('roomName');

    if(roomName.value === '') {
        alert('값을 입력해 주세요.');
        return;
    }

    document.querySelector('.dim').classList.add('hidden');
    await initCall();
    socket.emit('add_video_room', roomName.value, userName, showVideoRoom);
    document.querySelector('#addRoomPopup input').value = '';
})

videoCall.querySelector('.footer > .mute').addEventListener('click', (event) => {
    if(isMuted) {
        event.currentTarget.innerHTML = muteIcon.off;
    } else {
        event.currentTarget.innerHTML = muteIcon.on;
    }

    myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
    isMuted = !isMuted;
})

videoCall.querySelector('.footer > .cameraOn').addEventListener('click', (event) => {
    if(isCameraOn) {
        event.currentTarget.innerHTML = cameraOffIcon.off;
    } else {
        event.currentTarget.innerHTML = cameraOffIcon.on;
    }

    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
    isCameraOn = !isCameraOn;
})

videoCall.querySelector('.footer > .end').addEventListener('click', () => {
    const {roomName} = videoCall.dataset;
    socket.emit('leave_video_room', roomName, initRoomList);
    myStream.getTracks().forEach(track => track.stop());

    myPeerConnection.getSenders().forEach(sender => {
        myPeerConnection.removeTrack(sender);
    });

    myPeerConnection.close();

    const myVideo = videoCall.querySelector('.myVideo video');
    myVideo.srcObject = null;
    myVideo.remove();
})

videoCall.querySelector('.cameraSelect').addEventListener('change', async (event) => {
    await getMedia(event.currentTarget.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video');
        await videoSender.replaceTrack(videoTrack);
    }
})

const init = async() => {
    await api.getUserName().then((res) => {
        if(!res.data.userName) location.href = '/';
        userName = res.data.userName;
    })

    initRoomList();
}

const getCameras = async() => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        const currentCamera = myStream.getVideoTracks()[0];
        const cameraSelect = videoCall.querySelector('.cameraSelect');

        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
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

        const myVideo = videoCall.querySelector('.myVideo');
        const video = document.createElement('video');
        video.setAttribute('autoplay', true);
        video.setAttribute('playsinline', true);
        video.srcObject = myStream;

        myVideo.innerHTML = '';
        myVideo.append(video);

        if(!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

const candidates = new Set();
const handleIce = (data) => {
    console.log('sent candidate');
    if (data.candidate) {
        const {roomName} = videoCall.dataset;
        const candidateStr = data.candidate.candidate;
        if (!candidates.has(candidateStr)) {
            candidates.add(candidateStr);
            socket.emit("ice", data.candidate, roomName);
        }
    }
}

const handleTrack = (data) => {
    const peerVideo = videoCall.querySelector('.peerVideo');
    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('playsinline', true);
    video.srcObject = data.streams[0];

    peerVideo.innerHTML = '';
    peerVideo.append(video);
}

const makeConnection = () => {
    if(!myPeerConnection) {

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
                }]
        });
        myPeerConnection.addEventListener('icecandidate', handleIce, {once: true});
        myPeerConnection.addEventListener('track', handleTrack);
        myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    }
}

const initCall = async() => {
    await getMedia();
    makeConnection();
}

const showWaitMsg = () => {
    document.querySelector('.peerVideo').innerHTML = `<div class="waitMsg">⏳ Waiting for the other person to join…</div>`;
}

const showVideoRoom = async (roomName) => {
    roomList.classList.add('hidden');
    videoCall.classList.remove('hidden');
    videoCall.dataset.roomName = roomName;
}

const initRoomList = () => {
    videoCall.classList.add('hidden');
    roomList.classList.remove('hidden');

    api.getRooms().then((res) => {
        drawRooms(res.data);
    })
}

const drawRooms = (rooms) => {
    const listWrapper = roomList.querySelector('.listWrapper');
    if(rooms.length === 0) {
        listWrapper.innerHTML = '<div class="empty">No video call rooms available.</div>';
        return;
    }

    listWrapper.innerHTML = '';
    rooms?.forEach((room) => {
        addRoom(room);
    })
}

const addRoom = (room) => {
    const roomDiv = document.createElement('div');
    roomDiv.innerHTML = `<div class="header">
                    <div class="line"></div>
                    <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1l0-17.1 0-128 0-17.1 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"/></svg></div></div>
                    <div class="title">${room.roomName}</div>
                    <div class="count">
                        <span class="current">${room.pCount}</span>
                        <span>/</span>
                        <span class="total">2</span>
                    </div>`;
    roomDiv.classList.add('room');
    roomDiv.dataset.roomName = room.roomName;

    roomDiv.addEventListener('click', async (event) => {
        const {roomName} = event.currentTarget.dataset;
        const current = event.currentTarget.querySelector('.current').innerText;

        if(current === 2) {
            alert('현재 채팅방 정원이 가득 찼습니다. 😢 다른 방을 이용해주세요!');
            return;
        }

        await initCall();
        socket.emit('join_video_room', roomName, userName, showVideoRoom);
        showWaitMsg();
    })

    document.querySelector('#roomList > .listWrapper').appendChild(roomDiv);
}

const api = {
    getRooms: () => {
        return axios.get('/video-call/rooms');
    },
    getUserName: async () => {
        return await axios.get('/get-name');
    }
}

socket.on('welcome_video', async (roomName) => {
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    console.log('sent the offer');
    socket.emit('offer', offer, roomName);
})

socket.on('offer', async (offer) => {
    const {roomName} = videoCall.dataset;
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

socket.on('video_room_change', (rooms) => {
    if(roomList.classList.contains('hidden')) return;

    drawRooms(rooms);
});

socket.on('bye_video', () => {
    const peerVideo = videoCall.querySelector('.peerVideo video');
    peerVideo.srcObject = null;
    peerVideo.remove();
    showWaitMsg();
})

init();
const socket = io();
let userName = '';

const roomList = document.getElementById('roomList');
const messaging = document.getElementById('messaging');

const init = async() => {
    await api.getUserName().then((res) => {
        if(!res.data.userName) location.href = '/';
        userName = res.data.userName;
    })

    initRoomList();
}

const initAddPopup = () => {
    document.querySelector('#addRoomPopup input[type=text]').value = '';
    document.querySelector('#addRoomPopup input[type=number]').value = 2;
}

const noticeMsg = (type, userName) => {
    const noticeMsg = document.createElement('div');
    noticeMsg.classList.add('noticeMsg');
    noticeMsg.innerText = type === 'welcome'? `🎉 ${userName} joined!`: `${userName} left 🥲`;
    messaging.querySelector('.conversation').appendChild(noticeMsg);
}

const showChatRoom = (roomName) => {
    roomList.classList.add('hidden');
    messaging.classList.remove('hidden');

    messaging.querySelector('.roomName').innerText = roomName;
}


document.querySelector('#roomList > .header> .icon').addEventListener('click', (event) => {
    initAddPopup();
    document.querySelector('.dim').classList.remove('hidden');

})

document.querySelector('.dim').addEventListener('click', (event) => {
    if(event.target.closest('div').classList.contains('dim')) {
        initAddPopup();
        document.querySelector('.dim').classList.add('hidden');
    }
})

document.querySelector('#addRoomPopup > .footer > button').addEventListener('click', () => {
    const roomName = document.getElementById('roomName');
    const capacity = document.getElementById('capacity');

    if(roomName.value === '' || capacity.value === '') {
        alert('값을 입력해 주세요.');
        return;
    }

    if(capacity < 2) {
        alert('최소 2인 이상 이어야 합니다.');
        return;
    }


    document.querySelector('.dim').classList.add('hidden');
    socket.emit('add_room', roomName.value, capacity.value, userName, showChatRoom);
    initAddPopup();
})

messaging.querySelector('.header > .icon').addEventListener('click', (event) => {
    socket.emit('leave_room', messaging.querySelector('.header > .roomName').innerText, initRoomList);
})

messaging.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    const msg = input.value;
    const roomName = messaging.querySelector('.roomName').innerText;

    addMsg('my', msg);
    socket.emit('new_message', roomName, userName, msg);
    input.value = '';
})

const initRoomList = () => {
    messaging.classList.add('hidden');
    roomList.classList.remove('hidden');

    api.getRooms().then((res) => {
        drawRooms(res.data);
    })
}

const drawRooms = (rooms) => {
    const listWrapper = document.querySelector('.listWrapper');
    if(rooms.length === 0) {
        listWrapper.innerHTML = '<div class="empty">No chat rooms available.</div>';
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
                            <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentColor" d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z"/></svg></div>
                        </div>
                        <div class="title">${room.roomName}</div>
                        <div class="count">
                            <span class="current">${room.pCount}</span>
                            <span>/</span>
                            <span class="total">${room.capacity}</span>
                        </div>
                    </div>`;
    roomDiv.classList.add('room');
    roomDiv.dataset.roomName = room.roomName;

    roomDiv.addEventListener('click', (event) => {
        const {roomName} = event.currentTarget.dataset;
        const current = event.currentTarget.querySelector('.current').innerText;
        const total = event.currentTarget.querySelector('.total').innerText;

        if(current === total) {
            alert('현재 채팅방 정원이 가득 찼습니다. 😢 다른 방을 이용해주세요!');
            return;
        }

        socket.emit('enter_room', roomName, userName, showChatRoom);
    })

    document.querySelector('#roomList > .listWrapper').appendChild(roomDiv);
}

const addMsg = (type, msg, userName = null) => {
    const div = document.createElement('div');
    div.classList.add(type === 'my'? 'myMessage': 'other');

    if(type === 'my') {
        div.classList.add('myMessage');
    } else {
        div.classList.add('other');
        const userNameSpan = document.createElement('span');
        userNameSpan.classList.add('userName');
        userNameSpan.innerText = userName;
        div.appendChild(userNameSpan);
    }

    const msgSpan = document.createElement('span');
    msgSpan.classList.add('msg');
    msgSpan.innerText = msg;

    div.appendChild(msgSpan);

    document.querySelector('.conversation').appendChild(div);

    const messagesContainer = document.querySelector('.conversation'); // 메시지 컨테이너 선택
    const lastMessage = messagesContainer.lastElementChild; // 마지막 메시지 선택
    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' }); // 스크롤을 마지막 메시지로 부드럽게 이동
}

const api = {
    getRooms: () => {
        return axios.get('/chatting/rooms');
    },
    getUserName: async () => {
        return await axios.get('/get-name');
    }
}


socket.on('room_change', (rooms) => {
    if(roomList.classList.contains('hidden')) return;

    drawRooms(rooms);
});

socket.on('welcome', (userName) => {
    noticeMsg('welcome', userName);
})

socket.on('new_message', (userName, msg) => {
    addMsg('other', msg, userName);
})

socket.on('bye', (userName) => {
    noticeMsg('bye', userName)
});

init();
const socket = io();

const welcome = document.getElementById('welcome');
const form = welcome.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;
let roomName;

const addMessage = (msg) => {
    const ul = room.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = msg;
    ul.appendChild(li);
}

const handleMessageSubmit = (event) => {
    event.preventDefault();
    const input = room.querySelector('#msg input');
    const value = input.value;
    socket.emit('new_message', input.value, roomName, () => addMessage(`You: ${value}`));
    input.value = '';
}

const setRoomName = (roomName, userCount) => {
    const h3 = room.querySelector('h3');
    h3.innerText = `Room ${roomName} (${userCount})`;
}

const showRoom = (userCount) => {
    welcome.hidden = true;
    room.hidden = false;
    setRoomName(roomName, userCount);
    const msgForm = room.querySelector('form#msg');
    msgForm.addEventListener('submit', handleMessageSubmit);
}

const handleRoomSubmit = (event) => {
    event.preventDefault();
    const roomNameInput = form.querySelector('input#roomName');
    const nickNameInput = form.querySelector('input#nickName');
    socket.emit('enter_room', roomNameInput.value, nickNameInput.value, showRoom);
    roomName = roomNameInput.value;
    roomNameInput.value = '';
    nickNameInput.value = '';
}

form.addEventListener('submit', handleRoomSubmit);

socket.on('welcome', (user, userCount) => {
    setRoomName(roomName, userCount);
    addMessage(`${user} joined!`);
});

socket.on('bye', (left, userCount) => {
    setRoomName(roomName, userCount);
    addMessage(`${left} left 🥲`);
});

socket.on('new_message', (msg) => addMessage(msg));

socket.on('room_change', (rooms) => {
    const roomList = welcome.querySelector('ul');
    roomList.innerHTML = '';

    rooms.forEach((room) => {
        const li = document.createElement('li');
        li.innerText = room;
        roomList.appendChild(li);
    })
});

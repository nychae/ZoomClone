const messageForm = document.querySelector('#message');
const nicknameForm = document.querySelector('#nickname');
const messageList = document.querySelector('ul');
// socket - 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);

const makeMessage = (type, payload) => {
    const msg = {type, payload};
    return JSON.stringify(msg);
}

socket.addEventListener('open', () => {
    console.log("Connected to Server ✅");
});

socket.addEventListener('message', (message) => {
    const li = document.createElement('li');
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener('close', () => {
    console.log("Disconnected from Server ❌");
});

const handleSubmit = (event) => {
    event.preventDefault();
    const input = messageForm.querySelector('input');
    socket.send(makeMessage('new_message', input.value));

    const li = document.createElement('li');
    li.innerText = `You: ${input.value}`;
    messageList.append(li);

    input.value = '';
}
messageForm.addEventListener('submit', handleSubmit);

const handleNickSubmit = (event) => {
    event.preventDefault();
    const input = nicknameForm.querySelector('input');
    socket.send(makeMessage('nickname', input.value));
}
nicknameForm.addEventListener('submit', handleNickSubmit);
const ul = document.querySelector('ul');
const messageForm = document.querySelector('form');
// socket - 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener('open', () => {
    console.log("Connected to Server ✅");
});

socket.addEventListener('message', (message) => {
    console.log(`New message: ${message.data} from the Server`);
});

socket.addEventListener('close', () => {
    console.log("Disconnected from Server ❌");
});

const handleSubmit = (event) => {
    event.preventDefault();
    const input = messageForm.querySelector('input');
    socket.send(input.value);
    input.value = '';
}
messageForm.addEventListener('submit', handleSubmit)
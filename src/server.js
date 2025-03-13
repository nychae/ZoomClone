import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + "/views");
app.use('/public', express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"))
app.get("/*", (req, res) => res.redirect("/"))
const handleListen = () => console.log(`Listening on http://localhost:3000`);

// http서버와 websocket서버 같이 작동하게 함
// http 서버 위에 websocket 서버를 만들어 같은 포트를 공유함
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const sockets = [];
wss.on('connection', (socket) => {
    // socket - 연결된 브라우저
    console.log('Connected to Browser ✅');
    socket['nickname'] = 'Anonymous';
    sockets.push(socket);

    socket.on('close', () => console.log('Disconnected from the Browser ❌'));
    socket.on('message', (msg) => {
        const message = JSON.parse(msg);

        switch (message.type) {
            case 'new_message': {
                sockets.forEach((aSocket) => {
                    aSocket.send(`${socket.nickname}: ${message.payload}`);
                })
                break;
            }
            case 'nickname': {
                socket['nickname'] = message.payload;
                break;
            }
        }
    })
});

server.listen(3000, handleListen);

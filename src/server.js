import http from "http";
import {Server} from "socket.io";
import express from "express";
import {instrument} from "@socket.io/admin-ui";

const {chatHandler, chatRouter}  = require('./chat');  // 🔹 채팅 이벤트 핸들러
const {videoHandler, videoRouter} = require('./video');

const path = require('path');
const app = express();
const userList = {};
let socketId;

app.set('views', __dirname + "/views");
app.use('/public', express.static(__dirname + "/public"));
app.use('/chatting', chatRouter);
app.use('/video-call', videoRouter);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
})
app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'chat.html'));
})
app.get("/video", (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'video.html'));
})

app.get('/get-user', (req, res) => {
    console.log(userList[socketId]);
    return res.json({ name: userList[socketId]});
})
app.get("/*", (req, res) => res.redirect("/"))




const handleListen = () => console.log(`Listening on http://localhost:3000`);

// http서버와 websocket서버 같이 작동하게 함
// http 서버 위에 websocket 서버를 만들어 같은 포트를 공유함
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ['http://admin.socket.io'],
        credentials: true,
    }
});
instrument(wsServer, {
    auth: false,
});


wsServer.on('connection', socket => {
    socketId = socket.id;
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    })

    chatHandler(wsServer, socket);
    videoHandler(wsServer, socket);

    socket.on('save_user', (nickName, done) => {
       userList[socket.id] = nickName;
       done();
    })

    socket.on('check_user', () => {
        console.log(`userName: ${userList[socket.id]}`);
        socket.emit('get_user', userList[socket.id]);
    })
})


httpServer.listen(3000, handleListen);

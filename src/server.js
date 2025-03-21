require('dotenv').config();
import http from "http";
import {Server} from "socket.io";
import express from "express";
import {instrument} from "@socket.io/admin-ui";

const session = require('express-session');
const {chatHandler, chatRouter}  = require('./chat');  // 🔹 채팅 이벤트 핸들러
const {videoHandler, videoRouter} = require('./video');

const path = require('path');
const app = express();
let socketId;

app.set('views', __dirname + "/views");
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 60 * 1000 }
}));

app.use(express.json());  // JSON 요청 바디를 파싱
app.use(express.urlencoded({ extended: true }));
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

app.post('/register-name', (req, res) => {
    const {userName} = req.body;
    if (!userName) {
        return res.status(400);
    }
    req.session.username = userName;

    res.send('Name registered');
})

app.get('/get-name', (req, res) => {
    console.log('/get-name');
    console.log(req.session.username);

    if (!req.session.username) {
        return res.json({userName: null});
    }

    res.json({ userName: req.session.username});
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
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    })

    chatHandler(wsServer, socket);
    videoHandler(wsServer, socket);


    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
    //
    // socket.on('save_user', (nickName, done) => {
    //    userList[socket.id] = nickName;
    //    done();
    // })

    // socket.on('check_user', () => {
    //     console.log(`userName: ${userList[socket.id]}`);
    //     socket.emit('get_user', userList[socket.id]);
    // })
})


httpServer.listen(3000, handleListen);

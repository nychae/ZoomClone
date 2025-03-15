import http from "http";
import {Server} from "socket.io";
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
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

const publicRooms = () => {
    const {
        sockets: {
            adapter: {sids, rooms}
        }
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    })

    return publicRooms;
}

wsServer.on('connection', socket => {

    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    })

    socket.on('enter_room', (roomName, nickName, done) => {
        socket['nickname'] = nickName;
        socket.join(roomName);
        done();
        socket.to(roomName).emit('welcome', nickName);
        wsServer.sockets.emit('room_change', publicRooms());
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname));
    })

    socket.on('disconnect', () => {
        wsServer.sockets.emit('room_change', publicRooms());
    })

    socket.on('new_message', (message, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${message}`);
        done();
    })

})
// const sockets = [];
// wss.on('connection', (socket) => {
//     // socket - 연결된 브라우저
//     console.log('Connected to Browser ✅');
//     socket['nickname'] = 'Anonymous';
//     sockets.push(socket);
//
//     socket.on('close', () => console.log('Disconnected from the Browser ❌'));
//     socket.on('message', (msg) => {
//         const message = JSON.parse(msg);
//
//         switch (message.type) {
//             case 'new_message': {
//                 sockets.forEach((aSocket) => {
//                     aSocket.send(`${socket.nickname}: ${message.payload}`);
//                 })
//                 break;
//             }
//             case 'nickname': {
//                 socket['nickname'] = message.payload;
//                 break;
//             }
//         }
//     })
// });

httpServer.listen(3000, handleListen);

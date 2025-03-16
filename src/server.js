import http from "http";
import {Server} from "socket.io";
import express from "express";
import {instrument} from "@socket.io/admin-ui";

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + "/views");
app.use('/public', express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"))
app.get("/chat", (req, res) => res.render("chat"))
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

const countRoom = (roomName) => {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on('connection', socket => {

    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    })

    /*
    * Chat
    * */
    socket.on('enter_room', (roomName, nickName, done) => {
        socket['nickname'] = nickName;
        socket.join(roomName);
        const userCount = countRoom(roomName);
        done(userCount);
        socket.to(roomName).emit('welcome', nickName, userCount);
        wsServer.sockets.emit('room_change', publicRooms());
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1));
    })

    socket.on('disconnect', () => {
        wsServer.sockets.emit('room_change', publicRooms());

    })

    socket.on('new_message', (message, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${message}`);
        done();
    })

    /********************************************************************************************/


    /*
    * Video
    * */
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit('welcome_video');
    })

    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer);
    })

    socket.on('ice', (ice, roomName) => {
        socket.to(roomName).emit('ice', ice);
    })
})


httpServer.listen(3000, handleListen);

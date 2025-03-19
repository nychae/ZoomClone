const express = require('express');
const chatRouter = express.Router();


const chatRooms = new Map();

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

const chatHandler = (wsServer, socket) => {
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
}


chatRouter.get('/rooms', (req, res) => {
    res.json(Array.from(chatRooms.values()));
})


module.exports = {
    chatHandler,
    chatRouter
};
const express = require('express');
const chatRouter = express.Router();

const chatRooms = new Map();

const publicRooms = (wsServer) => {
    const {
        sockets: {
            adapter: {sids, rooms}
        }
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            const room = chatRooms.get(key);
            room.pCount = countRoom(wsServer, room.roomName);
            publicRooms.push(room);
        }
    })

    return publicRooms;
}

const countRoom = (wsServer, roomName) => {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

const chatHandler = (wsServer, socket) => {
    socket.on('add_room', (roomName, capacity, userName, done) => {
        chatRooms.set(roomName, {
            roomName,
            pCount: 1,
            capacity
        });

        socket.join(roomName);
        done(roomName);

        socket.broadcast.emit('room_change', publicRooms(wsServer));
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname, countRoom(wsServer, room) - 1));
    })

    socket.on('disconnect', () => {
        wsServer.sockets.emit('room_change', publicRooms(wsServer));

    })

    socket.on('leave_room', (roomName, callback) => {
        socket.leave(roomName);

        const userCount = countRoom(wsServer, roomName);

        if(!userCount) {
            chatRooms.delete(roomName);
        }

        callback();
        socket.broadcast.emit('room_change', publicRooms(wsServer));
    })

    socket.on('enter_room', (roomName, userName) => {
        socket.join(roomName);
        socket.to(roomName).emit('welcome', userName);
        socket.broadcast.emit('room_change', publicRooms(wsServer));
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
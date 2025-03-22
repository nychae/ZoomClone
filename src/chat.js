const express = require('express');
const chatRouter = express.Router();

const chatRooms = new Map();
const userList = new Map();

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
            publicRooms.push(room);
        }
    })

    return publicRooms;
}

const updatePCount = (wsServer) => {
    const socketRooms = wsServer.sockets.adapter.rooms;

    chatRooms.forEach((room) => {
        const count = socketRooms.get(room.roomName)?.size;

        if(!count || count === 0) {
            chatRooms.delete(room.roomName);
        } else {
            chatRooms.get(room.roomName).pCount = count;
        }

    })
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

        userList.set(socket.id, userName);
        socket.join(roomName);

        done(roomName);

        updatePCount(wsServer);
        socket.broadcast.emit('room_change', publicRooms(wsServer));
    })

    socket.on('disconnecting', () => {
        console.log('disconnecting_user');
        socket.rooms.forEach((room) => socket.to(room).emit('bye', userList.get(socket.id)));
        userList.delete(socket.id);
    })

    socket.on('disconnect', () => {
        updatePCount(wsServer);
        wsServer.sockets.emit('room_change', publicRooms(wsServer));

    })

    socket.on('leave_room', (roomName, callback) => {
        socket.leave(roomName);
        updatePCount(wsServer);

        callback();
        socket.to(roomName).emit('bye', userList.get(socket.id));
        userList.delete(socket.id);
        socket.broadcast.emit('room_change', publicRooms(wsServer));
    })

    socket.on('enter_room', (roomName, userName, callback) => {
        socket.join(roomName);
        updatePCount(wsServer);
        userList.set(socket.id, userName);
        socket.to(roomName).emit('welcome', userName);
        socket.broadcast.emit('room_change', publicRooms(wsServer));
        callback(roomName);
    })

    socket.on('new_message', (roomName, userName, msg) => {
        socket.to(roomName).emit("new_message", userName, msg);
    })
}


chatRouter.get('/rooms', (req, res) => {
    res.json(Array.from(chatRooms.values()));
})


module.exports = {
    chatHandler,
    chatRouter
};
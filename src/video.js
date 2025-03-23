const express = require('express');
const videoRouter = express.Router();

const videoRooms = new Map();

const publicRooms = (wsServer) => {
    const {
        sockets: {
            adapter: {sids, rooms}
        }
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            const room = videoRooms.get(key);
            if(room) {
                publicRooms.push(room);
            }
        }
    })

    return publicRooms;
}

const updatePCount = (wsServer) => {
    const socketRooms = wsServer.sockets.adapter.rooms;

    videoRooms.forEach((room) => {
        const count = socketRooms.get(room.roomName)?.size;

        if(!count || count === 0) {
            videoRooms.delete(room.roomName);
        } else {
            videoRooms.get(room.roomName).pCount = count;
        }

    })
}

const videoHandler = (wsServer, socket) => {

    socket.on('add_video_room', (roomName, userName, callback) => {
        videoRooms.set(roomName, {
            roomName,
            pCount: 1,
        })

        socket.join(roomName);
        updatePCount(wsServer);
        callback(roomName);
        socket.broadcast.emit('video_room_change', publicRooms(wsServer));
    })

    socket.on('join_video_room', (roomName, userName, callback) => {
        console.log('join_video_room: ' + roomName)
        socket.join(roomName);
        updatePCount(wsServer);
        callback(roomName);
        socket.to(roomName).emit('welcome_video', roomName);
        socket.broadcast.emit('video_room_change', publicRooms(wsServer));
    })

    socket.on('disconnecting', () => {
        console.log('disconnecting_user');
        socket.rooms.forEach((room) => socket.to(room).emit('bye_video'));
    })

    socket.on('disconnect', () => {
        updatePCount(wsServer);
        wsServer.sockets.emit('video_room_change', publicRooms(wsServer));

    })

    socket.on('leave_video_room', (roomName, callback) => {
        console.log('leave_room: ' + roomName);
        socket.leave(roomName);
        updatePCount(wsServer);

        socket.to(roomName).emit('bye_video');
        socket.broadcast.emit('video_room_change', publicRooms(wsServer));
        callback()
    })

    socket.on('offer', (offer, roomName) => {
        console.log('offer: ' + roomName)
        socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        console.log('answer:' + roomName);
        socket.to(roomName).emit('answer', answer);
    })

    socket.on('ice', (ice, roomName) => {
        console.log('ice: ' + roomName);
        socket.to(roomName).emit('ice', ice);
    })
}

videoRouter.get('/rooms', (req, res) => {
    res.json(Array.from(videoRooms.values()));
})

module.exports = {
    videoHandler,
    videoRouter
}
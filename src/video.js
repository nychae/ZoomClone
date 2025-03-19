const express = require('express');
const videoRouter = express.Router;

const videoHandler = (wsServer, socket) => {

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
}

module.exports = {
    videoHandler,
    videoRouter
}
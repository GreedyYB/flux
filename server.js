const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Serve all static files from the root directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for any unknown routes (for SPA support, optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Socket.IO logic for multiplayer ---
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    // Notify the client of their player number (1 or 2)
    const playerNum = rooms[roomId].length;
    socket.emit('playerNumber', playerNum);
    // Notify others in the room
    socket.to(roomId).emit('playerJoined', playerNum);
  });

  socket.on('move', ({ roomId, move }) => {
    // Relay the move to the other player in the room
    socket.to(roomId).emit('opponentMove', move);
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        // Notify others in the room
        socket.to(roomId).emit('playerLeft');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
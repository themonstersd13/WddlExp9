require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle chat room route
app.get('/chat/:roomCode', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join room', async (roomCode) => {
    socket.join(roomCode);
    console.log(`User joined room: ${roomCode}`);

    // Fetch and send previous messages
    const previousMessages = await Message.find({ roomCode }).sort({ timestamp: 1 });
    socket.emit('previous messages', previousMessages);
  });

  socket.on('chat message', async (msg, roomCode) => {
    io.to(roomCode).emit('chat message', msg);

    // Save message to MongoDB
    try {
      const message = new Message({ roomCode, message: msg });
      await message.save();
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Schema definition (used for all collections)
const messageSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now }
}, { strict: false });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Chat room route
app.get('/chat/:roomCode', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to get a model for a specific room
function getRoomModel(roomCode) {
  return mongoose.model(roomCode, messageSchema, roomCode);
}

io.on('connection', (socket) => {
  console.log('⚡ A user connected');

  socket.on('join room', async (roomCode) => {
    socket.join(roomCode);
    console.log(`🚪 User joined room: ${roomCode}`);
  
    try {
      const RoomModel = getRoomModel(roomCode);
      const previousMessages = await RoomModel.find().sort({ timestamp: 1 }).lean();
      socket.emit('previous messages', previousMessages);
    } catch (err) {
      console.error('❌ Error loading previous messages:', err);
    }
  });
  

  socket.on('chat message', async (msg, roomCode) => {
    io.to(roomCode).emit('chat message', msg);

    // Save to MongoDB dynamically
    try {
      const RoomModel = getRoomModel(roomCode);
      const newMessage = new RoomModel({ message: msg });
      await newMessage.save();
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 A user disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

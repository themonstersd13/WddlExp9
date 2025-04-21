const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const roomForm = document.getElementById('roomForm');
const roomCodeInput = document.getElementById('roomCodeInput');

// Check if the user has already joined a room (using localStorage)
const savedRoomCode = localStorage.getItem('roomCode');
if (savedRoomCode) {
  roomCodeInput.value = savedRoomCode;
  socket.emit('join room', savedRoomCode);
  document.title = `Chat Room: ${savedRoomCode}`;
  roomForm.classList.add('hidden');
  form.classList.remove('hidden');
}

// Fetch previous messages for the room when the user joins
roomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const roomCode = roomCodeInput.value.trim();
  if (roomCode) {
    socket.emit('join room', roomCode);

    // Save the room code to localStorage so user stays in the room after refresh
    localStorage.setItem('roomCode', roomCode);

    // Hide the room code form and show the chat form
    roomForm.classList.add('hidden');
    form.classList.remove('hidden');

    // Update the page title to include the room code
    document.title = `Chat Room: ${roomCode}`;
  }
});

// Send a new message when the form is submitted
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const roomCode = localStorage.getItem('roomCode');
  if (input.value.trim()) {
    socket.emit('chat message', input.value.trim(), roomCode);
    input.value = '';  // Clear the input field
  }
});

// Listen for previous messages to be displayed when the user joins the room
socket.on('previous messages', (messagesArray) => {
  messages.innerHTML = ''; // Clear existing messages
  messagesArray.forEach((msgObj) => {
    const item = document.createElement('li');
    item.textContent = msgObj.message;
    item.className = 'bg-gray-200 px-3 py-2 rounded-md w-fit max-w-full';
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight; // Scroll to the latest message
});

// Display new messages in real-time
socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  item.className = 'bg-gray-200 px-3 py-2 rounded-md w-fit max-w-full';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight; // Scroll to the latest message
});
const Message = require('./models/Message'); // Import your Message model

io.on('connection', (socket) => {
  console.log('⚡ A user connected');

  socket.on('join room', async (roomCode) => {
    socket.join(roomCode);
    console.log(`🚪 User joined room: ${roomCode}`);

    // Fetch previous messages for the room
    try {
      const messages = await Message.find({ roomCode }).sort({ timestamp: 1 });
      socket.emit('previous messages', messages); // Send previous messages to the client
    } catch (err) {
      console.error('❌ Error fetching previous messages:', err);
    }
  });

  socket.on('chat message', async (msg, roomCode) => {
    io.to(roomCode).emit('chat message', msg); // Broadcast the new message to the room

    // Save the new message to MongoDB
    try {
      const newMessage = new Message({
        roomCode: roomCode,
        message: msg,
      });
      await newMessage.save();
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 A user disconnected');
  });
});

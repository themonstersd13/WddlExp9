const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const roomForm = document.getElementById('roomForm');
const roomCodeInput = document.getElementById('roomCodeInput');
const changeRoomBtn = document.getElementById('changeRoomBtn');
const changeRoomContainer = document.getElementById('changeRoomContainer');

function joinRoom(roomCode) {
  socket.emit('join room', roomCode);
  document.title = `Chat Room: ${roomCode}`;
  roomForm.classList.add('hidden');
  form.classList.remove('hidden');
  changeRoomContainer.classList.remove('hidden');
  localStorage.setItem('roomCode', roomCode);
}

function leaveRoom() {
  localStorage.removeItem('roomCode');
  document.title = 'Chat Room';
  form.classList.add('hidden');
  roomForm.classList.remove('hidden');
  changeRoomContainer.classList.add('hidden');
  messages.innerHTML = '';
  roomCodeInput.value = '';
}

// Auto join saved room
const savedRoomCode = localStorage.getItem('roomCode');
if (savedRoomCode) {
  roomCodeInput.value = savedRoomCode;
  joinRoom(savedRoomCode);
}

// Join room on form submit
roomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const roomCode = roomCodeInput.value.trim();
  if (roomCode) joinRoom(roomCode);
});

// Change room button handler
changeRoomBtn.addEventListener('click', () => {
  leaveRoom();
});

// Send message
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const roomCode = localStorage.getItem('roomCode');
  if (input.value.trim()) {
    socket.emit('chat message', input.value.trim(), roomCode);
    input.value = '';
  }
});

// Load previous messages
socket.on('previous messages', (messagesArray) => {
  messages.innerHTML = '';
  messagesArray.forEach((msgObj) => {
    const item = document.createElement('li');
    item.textContent = msgObj.message;
    item.className = 'bg-gray-200 px-3 py-2 rounded-md w-fit max-w-full';
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
});

// Show new message
socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  item.className = 'bg-gray-200 px-3 py-2 rounded-md w-fit max-w-full';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

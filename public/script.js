const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const roomForm = document.getElementById('roomForm');
const roomCodeInput = document.getElementById('roomCodeInput');

roomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const roomCode = roomCodeInput.value.trim();
  if (roomCode) {
    socket.emit('join room', roomCode);
    // Hide the room code form and show the chat form
    roomForm.classList.add('hidden');
    form.classList.remove('hidden');
    
    // Update the page title to include the room code
    document.title = `Chat Room: ${roomCode}`;
  }
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const roomCode = roomCodeInput.value.trim();
  if (input.value.trim()) {
    socket.emit('chat message', input.value.trim(), roomCode);
    input.value = '';
  }
});

socket.on('chat message', function (msg) {
  const item = document.createElement('li');
  item.textContent = msg;
  item.className = 'bg-indigo-100 px-3 py-2 rounded-md w-fit max-w-full';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

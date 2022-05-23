var connected = false;

var socket = io('http://localhost:3000');
socket.emit('setup', userLoggedIn);

socket.on('connected', () => (connected = true));
socket.on('Message Received', (newMessage) => messageReceived(newMessage));

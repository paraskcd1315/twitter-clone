var connected = false;

var socket = io('http://localhost:3000');
socket.emit('setup', userLoggedIn);

socket.on('connected', () => (connected = true));
socket.on('Message Received', (newMessage) => messageReceived(newMessage));

socket.on('Notification Received', () => {
	$.get('/api/notifications/latest', (notificationData) => {
		showNotificationPopup(notificationData);
		refreshNotificationsBadge();
	});
});

const emitNotification = (userId) => {
	if (userId == userLoggedIn._id) return;

	socket.emit('Notification Received', userId);
};

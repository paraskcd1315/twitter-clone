const express = require('express');
const app = express();
const port = 3000;
const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database');
const session = require('express-session');

const server = app.listen(port, () =>
	console.log(`Server listening on Port - ${port}`)
);
const io = require('socket.io')(server, {
	pingTimeout: 60000
});

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
	session({
		secret: 'kcdsecret',
		resave: true,
		saveUninitialized: false
	})
);

// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const hashtagRoute = require('./routes/hashtagRoutes');
const notificationRoute = require('./routes/notificationRoutes');

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/logout', logoutRoute);
app.use('/post', middleware.requireLogin, postRoute);
app.use('/profile', middleware.requireLogin, profileRoute);
app.use('/uploads', middleware.requireLogin, uploadRoute);
app.use('/search', middleware.requireLogin, searchRoute);
app.use('/messages', middleware.requireLogin, messagesRoute);
app.use('/hashtags', middleware.requireLogin, hashtagRoute);
app.use('/notifications', middleware.requireLogin, notificationRoute);

// API Routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const hashtagsApiRoute = require('./routes/api/hashtags');
const chatsApiRoute = require('./routes/api/chats');
const messagesApiRoute = require('./routes/api/messages');
const notificationsApiRoute = require('./routes/api/notifications');

app.use('/api/posts', postsApiRoute);
app.use('/api/users', usersApiRoute);
app.use('/api/hashtags', hashtagsApiRoute);
app.use('/api/chats', chatsApiRoute);
app.use('/api/messages', messagesApiRoute);
app.use('/api/notifications', notificationsApiRoute);

app.get('/', middleware.requireLogin, (req, res, next) => {
	let payload = {
		pageTitle: 'Home',
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user)
	};
	res.status(200).render('home', payload);
});

io.on('connection', (socket) => {
	socket.on('setup', (userData) => {
		socket.join(userData._id);
		socket.emit('connected');
	});

	socket.on('Join room', (room) => socket.join(room));
	socket.on('Typing', (room) => socket.in(room).emit('Typing'));
	socket.on('Stop Typing', (room) => socket.in(room).emit('Stop Typing'));
	socket.on('Notification Received', (room) =>
		socket.in(room).emit('Notification Received')
	);

	socket.on('New Message', (newMessage) => {
		const chat = newMessage.chat;

		if (!chat.users) return console.error('Chat.users not defined');

		chat.users.forEach((user) => {
			if (user._id == newMessage.sender._id) return;

			socket.in(user._id).emit('Message Received', newMessage);
		});
	});
});

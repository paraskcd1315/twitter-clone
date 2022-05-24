const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');
const Chat = require('../../schemas/Chat');
const Message = require('../../schemas/Message');
const Notification = require('../../schemas/Notification');

app.use(bodyParser.urlencoded({ extended: false }));

//Get all Posts

router.post('/', async (req, res, next) => {
	if (!req.body.content || !req.body.chatId) {
		console.error('Invalid data passed into request');
		return res.sendStatus(400);
	}

	let newMessage = {
		sender: req.session.user._id,
		content: req.body.content,
		chat: req.body.chatId,
		readBy: [req.session.user._id]
	};

	Message.create(newMessage)
		.then(async (message) => {
			message = await message.populate(['sender']);
			message = await message.populate(['chat']);
			message = await User.populate(message, { path: 'chat.users' });

			const chat = await Chat.findByIdAndUpdate(req.body.chatId, {
				latestMessage: message
			}).catch((err) => console.error(err));

			insertNotifications(chat, message);

			return res.status(201).send(message);
		})
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

const insertNotifications = (chat, message) => {
	chat.users.forEach((userId) => {
		if (userId == message.sender._id.toString()) return;

		Notification.insertNotification(
			userId,
			message.sender._id,
			'newMessage',
			message.chat._id
		);
	});
};

module.exports = router;

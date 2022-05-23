const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');
const Chat = require('../../schemas/Chat');
const Message = require('../../schemas/Message');

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
		chat: req.body.chatId
	};

	Message.create(newMessage)
		.then(async (message) => {
			message = await message.populate(['sender']);
			message = await message.populate(['chat']);
			message = await User.populate(message, { path: 'chat.users' });

			Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message }).catch(
				(err) => console.error(err)
			);

			return res.status(201).send(message);
		})
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

module.exports = router;

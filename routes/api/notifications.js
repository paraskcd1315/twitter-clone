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

router.get('/', async (req, res, next) => {
	let searchObj = {
		userTo: req.session.user._id,
		notificationType: { $ne: 'newMessage' }
	};

	if (req.query.unreadOnly !== undefined && req.query.unreadOnly == 'true') {
		searchObj.opened = false;
	}

	Notification.find(searchObj)
		.populate('userTo')
		.populate('userFrom')
		.sort({ createdAt: -1 })
		.then((results) => res.status(200).send(results))
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

router.get('/latest', async (req, res, next) => {
	Notification.findOne({
		userTo: req.session.user._id
	})
		.populate('userTo')
		.populate('userFrom')
		.sort({ createdAt: -1 })
		.then((results) => res.status(200).send(results))
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

router.put('/:id/markAsOpened', async (req, res, next) => {
	Notification.findByIdAndUpdate(req.params.id, { opened: true })
		.then(() => res.sendStatus(204))
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

router.put('/markAsOpened', async (req, res, next) => {
	Notification.updateMany({ userTo: req.session.user._id }, { opened: true })
		.then(() => res.sendStatus(204))
		.catch((err) => {
			console.error(err);
			return res.sendStatus(500);
		});
});

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', async (req, res, next) => {
	let searchObj = req.query;

	if (req.query.search !== undefined) {
		searchObj = {
			$or: [
				{ firstName: { $regex: req.query.search, $options: 'i' } },
				{ lastName: { $regex: req.query.search, $options: 'i' } },
				{ username: { $regex: req.query.search, $options: 'i' } }
			]
		};
	}

	User.find(searchObj)
		.then((results) => res.status(200).send(results))
		.catch((err) => {
			console.error(err);
			return res.sendStatus(400);
		});
});

//Follow and Unfollow user API

router.put('/:userId/follow', async (req, res, next) => {
	const userId = req.params.userId;

	const user = await User.findById(userId);

	if (user === null) return res.sendStatus(404);

	//Check if already Following Flag
	const isFollowing =
		user.followers && user.followers.includes(req.session.user._id);

	const option = isFollowing ? '$pull' : '$addToSet';

	req.session.user = await User.findByIdAndUpdate(
		req.session.user._id,
		{
			[option]: { following: userId }
		},
		{ new: true }
	).catch((err) => {
		console.error(err);
		return res.sendStatus(400);
	});

	await User.findByIdAndUpdate(userId, {
		[option]: { followers: req.session.user._id }
	}).catch((err) => {
		console.error(err);
		return res.sendStatus(400);
	});

	res.status(200).send(req.session.user);
});

router.get('/:userId/following', async (req, res, next) => {
	const results = await User.findById(req.params.userId)
		.populate('following')
		.catch((err) => {
			console.error(err);
			return res.sendStatus(400);
		});

	return res.status(200).send(results);
});

router.get('/:userId/followers', async (req, res, next) => {
	const results = await User.findById(req.params.userId)
		.populate('followers')
		.catch((err) => {
			console.error(err);
			return res.sendStatus(400);
		});

	return res.status(200).send(results);
});

router.post(
	'/profilePicture',
	upload.single('croppedImage'),
	async (req, res, next) => {
		if (!req.file) {
			console.log('No file Uploaded with Ajax Request');
			return res.sendStatus(400);
		}

		const filePath = `/uploads/images/${req.file.filename}.png`;
		const tempPath = req.file.path;
		const targetPath = path.join(__dirname, `../../${filePath}`);

		fs.rename(tempPath, targetPath, async (error) => {
			if (error != null) {
				console.log(error);
				return res.sendStatus(400);
			}

			req.session.user = await User.findByIdAndUpdate(
				req.session.user._id,
				{ profilePic: filePath },
				{ new: true }
			);

			res.sendStatus(204);
		});
	}
);

router.post(
	'/coverPhoto',
	upload.single('croppedImage'),
	async (req, res, next) => {
		if (!req.file) {
			console.log('No file Uploaded with Ajax Request');
			return res.sendStatus(400);
		}

		const filePath = `/uploads/images/${req.file.filename}.png`;
		const tempPath = req.file.path;
		const targetPath = path.join(__dirname, `../../${filePath}`);

		fs.rename(tempPath, targetPath, async (error) => {
			if (error != null) {
				console.log(error);
				return res.sendStatus(400);
			}

			req.session.user = await User.findByIdAndUpdate(
				req.session.user._id,
				{ coverPhotoPath: filePath },
				{ new: true }
			);

			res.sendStatus(204);
		});
	}
);

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res, next) => {
	Post.find()
		.populate('postedBy', '-password')
		.populate('retweetData')
		.sort({ createdAt: -1 })
		.then(async (results) => {
			results = await User.populate(results, { path: 'retweetData.postedBy' });
			return res.status(200).send(results);
		})
		.catch((err) => {
			console.log(err);
			return res.sendStatus(400);
		});
});

router.post('/', async (req, res, next) => {
	if (!req.body.content) {
		console.log('Content param not sent with request');
		return res.sendStatus(400);
	}

	let postData = {
		content: req.body.content,
		postedBy: req.session.user
	};

	Post.create(postData)
		.then(async (newPost) => {
			newPost = await User.populate(newPost, {
				path: 'postedBy',
				select: '-password'
			});

			return res.status(201).send(newPost);
		})
		.catch((e) => {
			console.log(e);
			return res.sendStatus(400);
		});
});

router.put('/:id/like', async (req, res, next) => {
	const postId = req.params.id;
	const userId = req.session.user._id;

	const isLiked =
		req.session.user.likes && req.session.user.likes.includes(postId);

	const option = isLiked ? '$pull' : '$addToSet';

	//Insert user like
	req.session.user = await User.findByIdAndUpdate(
		userId,
		{
			[option]: { likes: postId }
		},
		{ new: true }
	).catch((err) => {
		console.error(err);
		res.sendStatus(400);
	});

	//Insert post like
	const post = await Post.findByIdAndUpdate(
		postId,
		{
			[option]: { likes: userId }
		},
		{ new: true }
	).catch((err) => {
		console.error(err);
		res.sendStatus(400);
	});

	res.status(200).send(post);
});

router.post('/:id/retweet', async (req, res, next) => {
	const postId = req.params.id;
	const userId = req.session.user._id;

	//Try and delete retweet
	const deletedPost = await Post.findOneAndDelete({
		postedBy: userId,
		retweetData: postId
	}).catch((err) => {
		console.error(err);
		res.sendStatus(400);
	});

	const option = deletedPost != null ? '$pull' : '$addToSet';

	let retweet = deletedPost;

	if (retweet == null) {
		retweet = await Post.create({
			postedBy: userId,
			retweetData: postId
		}).catch((err) => {
			console.error(err);
			res.sendStatus(400);
		});
	}

	//Insert user retweet
	req.session.user = await User.findByIdAndUpdate(
		userId,
		{
			[option]: { retweets: retweet._id }
		},
		{ new: true }
	).catch((err) => {
		console.error(err);
		res.sendStatus(400);
	});

	//Insert post retweet
	var post = await Post.findByIdAndUpdate(
		postId,
		{
			[option]: { retweetUsers: userId }
		},
		{ new: true }
	).catch((err) => {
		console.error(err);
		res.sendStatus(400);
	});

	res.status(200).send(post);
});

module.exports = router;
const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');

app.use(bodyParser.urlencoded({ extended: false }));

//Get all Posts

router.get('/', async (req, res, next) => {
	let searchObj = req.query;

	//Filter replies
	if (searchObj.isReply !== undefined) {
		const isReply = searchObj.isReply === 'true';
		searchObj.replyTo = { $exists: isReply };
		delete searchObj.isReply;
	}

	//Filter posts only from following users
	if (searchObj.followingOnly !== undefined) {
		const followingOnly = searchObj.followingOnly === 'true';

		if (followingOnly) {
			let objectIds = [];

			if (!req.session.user.following) {
				req.session.user.following = [];
			}

			req.session.user.following.forEach((user) => objectIds.push(user));
			objectIds.push(req.session.user._id);

			searchObj.postedBy = { $in: objectIds };
		}

		delete searchObj.followingOnly;
	}

	const results = await getPosts(searchObj);
	return res.status(200).send(results);
});

//Get a single Post along with its replies

router.get('/:id', async (req, res, next) => {
	const postId = req.params.id;

	let postData = await getPosts({ _id: postId });
	postData = postData[0];

	const results = {
		postData: postData
	};

	if (postData.replyTo !== undefined) {
		results.replyTo = postData.replyTo;
	}

	results.replies = await getPosts({ replyTo: postId });
	return res.status(200).send(results);
});

//Submit a Post

router.post('/', async (req, res, next) => {
	if (!req.body.content) {
		console.log('Content param not sent with request');
		return res.sendStatus(400);
	}

	let postData = {
		content: req.body.content,
		postedBy: req.session.user
	};

	if (req.body.replyTo) {
		postData.replyTo = req.body.replyTo;
	}

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

//Like a Post

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
		return res.sendStatus(400);
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
		return res.sendStatus(400);
	});

	res.status(200).send(post);
});

//Retweet a Post

router.post('/:id/retweet', async (req, res, next) => {
	const postId = req.params.id;
	const userId = req.session.user._id;

	//Try and delete retweet
	const deletedPost = await Post.findOneAndDelete({
		postedBy: userId,
		retweetData: postId
	}).catch((err) => {
		console.error(err);
		return res.sendStatus(400);
	});

	const option = deletedPost != null ? '$pull' : '$addToSet';

	let retweet = deletedPost;

	if (retweet == null) {
		retweet = await Post.create({
			postedBy: userId,
			retweetData: postId
		}).catch((err) => {
			console.error(err);
			return res.sendStatus(400);
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
		return res.sendStatus(400);
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
		return res.sendStatus(400);
	});

	res.status(200).send(post);
});

//Delete a Post

router.delete('/:id', async (req, res, next) => {
	const postId = req.params.id;

	await Post.findByIdAndDelete(postId).catch((err) => {
		console.log(err);
		return res.sendStatus(400);
	});
	return res.sendStatus(202);
});

//Pin a post

router.put('/:id', async (req, res, next) => {
	const postId = req.params.id;

	if (req.body.pinned !== undefined) {
		await Post.updateMany(
			{ postedBy: req.session.user },
			{ pinned: false }
		).catch((err) => {
			console.log(err);
			return res.sendStatus(400);
		});
	}

	await Post.findByIdAndUpdate(postId, req.body).catch((err) => {
		console.log(err);
		return res.sendStatus(400);
	});
	return res.sendStatus(204);
});

//Common function for getting posts

const getPosts = async (filter) => {
	let results = await Post.find(filter)
		.populate('postedBy', '-password')
		.populate('retweetData')
		.populate('replyTo')
		.sort({ createdAt: -1 })
		.catch((err) => {
			console.log(err);
		});

	results = await User.populate(results, { path: 'replyTo.postedBy' });
	return await User.populate(results, { path: 'retweetData.postedBy' });
};

module.exports = router;

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
		.sort({ createdAt: -1 })
		.then((results) => res.status(200).send(results))
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

    const isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    const option = isLiked ? "$pull" : "$addToSet";

    //Insert user like
    await User.findByIdAndUpdate(userId, {
        [option]: { likes: postId}
    });

    //Insert post like
});

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/User');
const Post = require('../../schemas/Post');
const Hashtag = require('../../schemas/Hashtag');
const res = require('express/lib/response');

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

	//Filter according to search
	if (searchObj.search !== undefined) {
		searchObj.content = { $regex: searchObj.search, $options: 'i' };
		delete searchObj.search;
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

//Common function for getting posts

const getPosts = async (filter) => {
	let results = await Hashtag.find(filter)
		.populate('posts')
		.sort({ createdAt: -1 })
		.catch((err) => {
			console.log(err);
		});

	results = await User.populate(results, { path: 'posts.postedBy' });
	results = await Post.populate(results, { path: 'posts.retweetData' });
	results = await Post.populate(results, { path: 'posts.replyTo' });
	results = await User.populate(results, { path: 'posts.replyTo.postedBy' });
	results = await User.populate(results, { path: 'posts.mentions' });
	results = await User.populate(results, { path: 'posts.hashtags' });
	return await User.populate(results, { path: 'posts.retweetData.postedBy' });
};

module.exports = router;

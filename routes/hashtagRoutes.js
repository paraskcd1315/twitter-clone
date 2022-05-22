const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/User');
const bcrypt = require('bcrypt');

router.get('/:hashtag', (req, res, next) => {
	let payload = {
		pageTitle: '#' + req.params.hashtag,
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
		hashtag: req.params.hashtag
	};
	res.status(200).render('hashtagsPage', payload);
});

module.exports = router;

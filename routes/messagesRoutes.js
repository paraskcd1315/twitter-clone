const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/User');
const bcrypt = require('bcrypt');

router.get('/', (req, res, next) => {
	res.status(200).render('inboxPage', {
		pageTitle: 'Inbox',
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user)
	});
});

router.get('/new', (req, res, next) => {
	res.status(200).render('newMessagePage', {
		pageTitle: 'New Message',
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user)
	});
});

module.exports = router;

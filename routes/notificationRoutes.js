const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../schemas/User');
const Chat = require('../schemas/Chat');

router.get('/', (req, res, next) => {
	res.status(200).render('notificationsPage', {
		classActive: 'notifications',
		pageTitle: 'Notifications',
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user)
	});
});

module.exports = router;

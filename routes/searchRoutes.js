const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/User');
const bcrypt = require('bcrypt');

router.get('/', (req, res, next) => {
	let payload = createPayload(req.session.user);
	res.status(200).render('searchPage', payload);
});

router.get('/:selectedTab', (req, res, next) => {
	let payload = createPayload(req.session.user);
	payload.selectedTab = req.params.selectedTab;
	res.status(200).render('searchPage', payload);
});

const createPayload = (userLoggedIn) => {
	return {
		classActive: 'search',
		pageTitle: 'Search',
		userLoggedIn: userLoggedIn,
		userLoggedInJs: JSON.stringify(userLoggedIn)
	};
};

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/User');
const bcrypt = require('bcrypt');

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res, next) => {
	res.status(200).render('login');
});

router.post('/', async (req, res, next) => {
	let payload = req.body;

	if (req.body.logUsername && req.body.logPassword) {
		let user = await User.findOne({
			$or: [{ username: req.body.logUsername }, { email: req.body.logUsername }]
		}).catch((err) => {
			console.log(err);
			payload.errorMessage = 'Something went wrong.';
			res.status(200).render('login', payload);
		});

		if (user !== null) {
			let result = await bcrypt.compare(req.body.logPassword, user.password);

			if (result === true) {
				req.session.user = user;
				return res.redirect('/');
			}
		}

		payload.errorMessage = 'Login Credentials incorrect.';
		return res.status(200).render('login', payload);
	}
	payload.errorMessage = 'Make sure each field has a valid value.';

	res.status(200).render('login');
});

module.exports = router;

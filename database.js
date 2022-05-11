const mongoose = require('mongoose');

class Database {
	constructor() {
		this.connect();
	}

	connect() {
		mongoose
			.connect(
				'mongodb+srv://admin:dbuserpassword@cluster0.toha8.mongodb.net/twitterCloneDB?retryWrites=true&w=majority'
			)
			.then(() => {
				console.log('Database connection successful');
			})
			.catch((e) => {
				console.log('Database connection error' + e);
			});
	}
}

module.exports = new Database();

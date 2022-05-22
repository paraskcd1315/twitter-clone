const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const HashtagSchema = new Schema(
	{
		content: {
			type: String
		},
		posts: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Post'
			}
		]
	},
	{ timestamps: true }
);

var Hashtag = mongoose.model('Hashtag', HashtagSchema);

module.exports = Hashtag;

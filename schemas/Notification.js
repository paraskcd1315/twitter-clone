const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
	{
		userTo: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		userFrom: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		notificationType: {
			type: String
		},
		opened: {
			type: Boolean,
			default: false
		},
		entityId: {
			type: Schema.Types.ObjectId
		}
	},
	{ timestamps: true }
);

NotificationSchema.statics.insertNotification = async (
	userTo,
	userFrom,
	notificationType,
	entityId
) => {
	const data = {
		userTo: userTo,
		userFrom: userFrom,
		notificationType: notificationType,
		entityId: entityId
	};

	await Notification.deleteOne(data).catch((err) => console.error(err));

	return Notification.create(data).catch((err) => console.error(err));
};

var Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;

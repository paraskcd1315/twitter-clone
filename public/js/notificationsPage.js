$(document).ready(() => {
	$.get('/api/notifications', (results) => {
		outputNotificationList(results, $('.resultsContainer'));
		$('.loadingSpinnerContainer').remove();
		$('.resultsContainer').attr('style', '');
	});
});

$('#markNotificationsAsRead').click(() => markNotificationsAsOpened());

const outputNotificationList = (notifications, container) => {
	notifications.forEach((notification) => {
		const html = createNotificationHtml(notification);

		container.append(html);
	});

	if (notifications.length == 0) {
		container.append("<span class='noResults'>Nothing to show.</span>");
	}
};

const createNotificationHtml = (notification) => {
	const userFrom = notification.userFrom;
	const text = getNotificationText(notification);
	const url = getNotificationUrl(notification);
	const className = notification.opened ? '' : ' active';

	return `
    <a href="${url}" class="resultListItem notification${className}" data-id='${notification._id}'>
        <div class="resultsImageContainer">
            <img src='${userFrom.profilePic}' /> 
        </div>
        <div class='resultsDetailsContainer ellipsis'>
            ${text}
        </div>
    </a>
    `;
};

const getNotificationText = (notification) => {
	const userFrom = notification.userFrom;
	const notificationType = notification.notificationType;

	if (!userFrom.firstName || !userFrom.lastName) {
		console.error('userFrom not populated');
	}

	const userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

	let text;

	switch (notificationType) {
		case 'retweet':
			text = `${userFromName} retweeted one of your posts`;
			break;

		case 'postLike':
			text = `${userFromName} liked one of your posts`;
			break;

		case 'reply':
			text = `${userFromName} replied to one of your posts`;
			break;

		case 'follow':
			text = `${userFromName} followed you`;
			break;

		case 'mention':
			text = `${userFromName} mentioned you in one of their posts`;
			break;

		default:
			text = '';
			break;
	}

	return `
    <span class="ellipsis">
        ${text}
    </span>`;
};

const getNotificationUrl = (notification) => {
	const notificationType = notification.notificationType;

	let url;

	switch (notificationType) {
		case 'retweet':
		case 'postLike':
		case 'reply':
		case 'mention':
			url = `/post/${notification.entityId}`;
			break;

		case 'follow':
			url = `/profile/${notification.entityId}`;
			break;

		default:
			url = '#';
			break;
	}

	return url;
};

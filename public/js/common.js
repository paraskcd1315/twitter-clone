var cropper;
var timer;
var selectedUsers = [];
var deviceWidth = document.documentElement.clientWidth;
var is_opera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var is_Edge = navigator.userAgent.indexOf('Edge') > -1;
var is_chrome = !!window.chrome && !is_opera && !is_Edge;
var is_explorer =
	typeof document !== 'undefined' && !!document.documentMode && !is_Edge;
var is_firefox = typeof window.InstallTrigger !== 'undefined';
var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

$(document).ready(() => {
	refreshMessagesBadge();
	refreshNotificationsBadge();
	localstore.init({
		storageName: 'twitterClone',
		extraStorage: {}
	});
});

document.addEventListener('swiped-right', (e) => {
	if (deviceWidth <= 600) {
		$('.checkbox').prop('checked', true);
		openSidebar();
	}
});

document.addEventListener('swiped-left', (e) => {
	if (deviceWidth <= 600) {
		$('.checkbox').prop('checked', false);
		closeSidebar();
	}
});

$('#postTextarea, #replyTextArea').keyup((e) => {
	const textbox = $(e.target);
	const value = textbox.val().trim();

	const isModal = textbox.parents('.modal').length === 1;

	const submitButton = isModal
		? $('#submitReplyButton')
		: $('#submitPostButton');

	if (submitButton && submitButton.length === 0)
		return console.error('No submit button found');

	if (value === '') {
		submitButton.prop('disabled', true);
		return;
	} else {
		submitButton.prop('disabled', false);
	}
});

$('#submitPostButton, #submitReplyButton').click((e) => {
	const button = $(e.target);

	const isModal = button.parents('.modal').length === 1;

	const textbox = isModal ? $('#replyTextArea') : $('#postTextarea');

	let data = {
		content: textbox.val().trim()
	};

	if (isModal) {
		const postId = button.data().id;
		if (postId === null) {
			return console.error('Id is null');
		}

		data.replyTo = postId;
	}

	const hashtags = findHashtags(data.content);

	const mentions = findMentions(data.content);

	if (hashtags) {
		data.hashtags = hashtags;
	}

	if (mentions) {
		data.mentions = mentions;
	}

	$.post('/api/posts', data, (postData) => {
		if (postData.replyTo) {
			emitNotification(postData.replyTo.postedBy);
			return location.reload();
		}

		textbox.val('');
		const html = createPostHtml(postData);
		$('.postsContainer').prepend(html);
		button.prop('disabled', true);
		if (postData.mentions && postData.mentions.length > 0) {
			postData.mentions.forEach((mention) => {
				emitNotification(mention._id);
			});
		}
	});
});

$('#deletePostButton').click((e) => {
	const postId = $(e.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'DELETE',
		success: () => {
			location.reload();
		}
	});
});

$('#pinPostButton').click((e) => {
	const postId = $(e.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'PUT',
		data: { pinned: true },
		success: () => {
			location.reload();
		}
	});
});

$('#unpinPostButton').click((e) => {
	const postId = $(e.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'PUT',
		data: { pinned: false },
		success: () => {
			location.reload();
		}
	});
});

$('.checkbox').change((e) => {
	if ($('.checkbox').is(':checked') && deviceWidth <= 600) {
		openSidebar();
	} else {
		closeSidebar();
	}
});

$('#filePhoto').change(function () {
	if (this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById('imagePreview');
			image.src = e.target.result;

			if (cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				aspectRatio: 1 / 1,
				background: false
			});
		};
		reader.readAsDataURL(this.files[0]);
	}
});

$('#coverPhoto').change(function () {
	if (this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById('coverPreview');
			image.src = e.target.result;

			if (cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				aspectRatio: 16 / 9,
				background: false
			});
		};
		reader.readAsDataURL(this.files[0]);
	}
});

$('#imageUploadButton').click(() => {
	const canvas = cropper.getCroppedCanvas();

	if (canvas == null) {
		alert('Could not upload image, make sure it is an Image file');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);

		$.ajax({
			url: '/api/users/profilePicture',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: () => location.reload()
		});
	});
});

$('#coverPhotoButton').click(() => {
	const canvas = cropper.getCroppedCanvas();

	if (canvas == null) {
		alert('Could not upload image, make sure it is an Image file');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);

		$.ajax({
			url: '/api/users/coverPhoto',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: () => location.reload()
		});
	});
});

$('#userSearchTextbox').keydown((e) => {
	clearTimeout(timer);

	const textbox = $(e.target);
	let value = textbox.val();

	if (value == '' && (e.which == 8 || e.keyCode == 8)) {
		//Todo: Remove user from selection
		selectedUsers.pop();
		updateSelectedUsersHtml();
		$('.resultsContainer').html('');

		if (selectedUsers.length === 0) {
			$('#createChatButton').prop('disabled', true);
		}

		return;
	}

	timer = setTimeout(() => {
		value = textbox.val().trim();
		if (value == '') {
			$('.resultsContainer').html('');
		} else {
			searchUsers(value);
		}
	}, 1000);
});

$('#createChatButton').click(() => {
	const data = JSON.stringify(selectedUsers);

	$.post('/api/chats', { users: data }, (chat) => {
		if (!chat || !chat._id) {
			return console.error('Invalid response from server');
		}
		window.location.href = `/messages/${chat._id}`;
	});
});

$('#replyModal').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);

	$('#submitReplyButton').data('id', postId);

	$.get('/api/posts/' + postId, (results) => {
		outputPosts(results.postData, $('#originalPostContainer'));
	});
});

$('#replyModal').on('hidden.bs.modal', () =>
	$('#originalPostContainer').html('')
);

$('#deletePostModal').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);

	$('#deletePostButton').data('id', postId);
});

$('#confirmPinModal').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);

	$('#pinPostButton').data('id', postId);
});

$('#unpinModal').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);

	$('#unpinPostButton').data('id', postId);
});

$(document).on('click', '.likeButton', (e) => {
	const button = $(e.target);
	const postId = getPostIdFromElement(button);

	if (postId === undefined) console.error('Could not fetch post id');

	$.ajax({
		url: `/api/posts/${postId}/like`,
		type: 'PUT',
		success: (postData) => {
			button.find('span').text(postData.likes.length || '');
			if (postData.likes.includes(userLoggedIn._id)) {
				button.addClass('active');
				emitNotification(postData.postedBy);
			} else {
				button.removeClass('active');
			}
		}
	});
});

$(document).on('click', '.retweetButton', (e) => {
	const button = $(e.target);
	const postId = getPostIdFromElement(button);

	if (postId === undefined) console.error('Could not fetch post id');

	$.ajax({
		url: `/api/posts/${postId}/retweet`,
		type: 'POST',
		success: (postData) => {
			button.find('span').text(postData.retweetUsers.length || '');
			if (postData.retweetUsers.includes(userLoggedIn._id)) {
				button.addClass('active');
				emitNotification(postData.postedBy);
			} else {
				button.removeClass('active');
			}
		}
	});
});

$(document).on('click', '.post', (e) => {
	const element = $(e.target);
	const postId = getPostIdFromElement(element);

	if (postId !== undefined && !element.is('button')) {
		window.location.href = `/post/${postId}`;
	}
});

$(document).on('click', '.followButton', (e) => {
	const button = $(e.target);
	const userId = button.data().user;

	$.ajax({
		url: `/api/users/${userId}/follow`,
		type: 'PUT',
		success: (data, status, xhr) => {
			if (xhr.status == 404) {
				alert(
					"Something went wrong, either we've switched universes, or perhaps the User does not exist!"
				);
				return;
			}

			let difference = 1;

			if (data.following && data.following.includes(userId)) {
				button.addClass('following');
				button.text('following');
				emitNotification(userId);
			} else {
				button.removeClass('following');
				button.text('follow');
				difference = -1;
			}

			const followersLabel = $('#followersValue');
			if (followersLabel.length != 0) {
				const followersText = followersLabel.text();
				followersLabel.text(parseInt(followersText) + difference);
			}
		}
	});
});

$(document).on('click', '.notification.active', (e) => {
	const container = $(e.target);
	const notificationId = container.data().id;
	const href = container.attr('href');

	e.preventDefault();

	const callback = () => (window.location = href);

	markNotificationsAsOpened(notificationId, callback);
});

const getPostIdFromElement = (el) => {
	const isRoot = el.hasClass('post');
	const rootElement = isRoot ? el : el.closest('.post');
	return rootElement.data().id;
};

const createPostHtml = (postData, largeFont = false, isProfile = false) => {
	if (postData == null) return console.error('Post object is null');

	let newContent = postData.content;

	const websiteExp = /(https?:\/\/[^ ]*)/;
	const youtubeUrl =
		postData.content?.match(websiteExp) &&
		postData.content?.match(websiteExp)[1];

	const youtubeEmbed = youtubeEmbedder(youtubeUrl)
		? youtubeEmbedder(youtubeUrl)
		: '';

	if (youtubeEmbed) {
		newContent = newContent.replace(
			youtubeUrl,
			`<br /><a class="embedLink" href="${youtubeUrl}">Visit Youtube</a>`
		);
	}

	if (
		Array.isArray(findHashtags(postData.content)) &&
		findHashtags(postData.content).length > 0
	) {
		const hashtags =
			findDuplicateHashtags(findHashtags(postData.content)).length > 0
				? findDuplicateHashtags(findHashtags(postData.content))
				: findHashtags(postData.content);
		hashtags.map((hashtag) => {
			newContent = newContent.replace(
				hashtag,
				`<a class="hashtags" href='/hashtags/${hashtag.replace(
					'#',
					''
				)}'>${hashtag}</a>`
			);
		});
	}

	if (
		Array.isArray(findMentions(postData.content)) &&
		findMentions(postData.content).length > 0
	) {
		const mentions = findMentions(postData.content, true);
		mentions.map((mention) => {
			if (
				postData.mentions.some(
					(mention2) => mention2.username === mention.replace('@', '')
				)
			) {
				newContent = newContent.replace(
					mention,
					`<a class="hashtags" href='/profile/${mention.replace(
						'@',
						''
					)}'>${mention}</a>`
				);
			}
		});
	}

	if (newContent && newContent !== '') {
		postData.content = newContent;
	}

	const isRetweet = postData.retweetData !== undefined;
	const retweetedBy = isRetweet ? postData.postedBy.username : null;

	postData = isRetweet ? postData.retweetData : postData;

	let retweetText = '';

	if (isRetweet) {
		retweetText =
			retweetedBy === userLoggedIn.username
				? `
		<span>
			<i class="fas fa-retweet"></i>
			<a href='/profile/${retweetedBy}'>You retweeted it</a>
		</span>`
				: `
		<span>
			<i class="fas fa-retweet"></i>
			<a href='/profile/${retweetedBy}'>@${retweetedBy}</a> Retweeted
		</span>`;
	}

	let replyFlag = '';

	if (postData.replyTo && postData.replyTo._id) {
		if (!postData.replyTo._id) {
			return console.error('Reply is not populated');
		} else if (!postData.replyTo.postedBy._id) {
			return console.error('Reply user Id is not populated');
		}

		const replyToUsername = postData.replyTo.postedBy.username;

		replyFlag = `
			<div class="replyFlag">
				Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
			</div>
		`;
	}

	let buttons = '';
	let pinnedPostText = '';

	if (postData.pinned && isProfile) {
		pinnedPostText = `<i class="fas fa-thumbtack"></i> <span>Pinned Post</span>`;
	}

	if (postData.postedBy._id === userLoggedIn._id) {
		let pinnedClass = '';
		if (postData.pinned) {
			pinnedClass = 'active';
			pinnedPostText = `<i class="fas fa-thumbtack"></i> <span>Pinned Post</span>`;
		}

		buttons = `
		<button class='pinButton ${pinnedClass}' data-id="${
			postData._id
		}" data-bs-toggle="modal" data-bs-target="${
			postData.pinned ? '#unpinModal' : '#confirmPinModal'
		}">
			<i class="fas fa-thumbtack"></i>
		</button>
		<button data-id="${
			postData._id
		}" data-bs-toggle="modal" data-bs-target="#deletePostModal">
			<i class="fas fa-times"></i>
		</button>
		`;
	}

	return `
    <div class="post${largeFont ? ' largeFont' : ''}" data-id="${postData._id}">
		<div class="postActionContainer">
			${retweetText}
			${pinnedPostText}
		</div>
        <div class="mainContentContainer">
            <div class="userImageContainer">
                <img src="${postData.postedBy.profilePic}"/>
            </div>
            <div class="postContentContainer">
                <div class="header">
                    <a class="displayName" href="/profile/${
											postData.postedBy.username
										}">${postData.postedBy.username}</a>
                    <span class="date">${timeDifference(
											new Date(),
											new Date(postData.createdAt)
										)}</span>
					${buttons}
                </div>
				${replyFlag}
                <div class="postBody">
                    <span>${postData.content}</span>
					${youtubeEmbed ? `<div class="embeds">${youtubeEmbed}</div>` : ''}
                </div>
                <div class="postFooter">
                    <div class="postButtonContainer">
                        <button data-bs-toggle="modal" data-bs-target="#replyModal">
                            <i class="far fa-comment"></i>
                        </button>
                    </div>
                    <div class="postButtonContainer green">
                        <button class="retweetButton${
													postData.retweetUsers.includes(userLoggedIn._id)
														? ' active'
														: ''
												}">
                            <i class="fas fa-retweet"></i>
							<span>${postData.retweetUsers.length || ''}</span>
                        </button>
                    </div>
                    <div class="postButtonContainer red">
                        <button class="likeButton${
													postData.likes.includes(userLoggedIn._id)
														? ' active'
														: ''
												}">
                            <i class="far fa-heart"></i>
							<span>${postData.likes.length || ''}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

const timeDifference = (current, previous) => {
	let msPerMinute = 60 * 1000;
	let msPerHour = msPerMinute * 60;
	let msPerDay = msPerHour * 24;
	let msPerMonth = msPerDay * 30;
	let msPerYear = msPerDay * 365;

	let elapsed = current - previous;

	if (elapsed < msPerMinute) {
		if (elapsed / 1000 < 30) return 'Just now';

		return Math.round(elapsed / 1000) + ' seconds ago';
	} else if (elapsed < msPerHour)
		return Math.round(elapsed / msPerMinute) + ' minutes ago';
	else if (elapsed < msPerDay)
		return Math.round(elapsed / msPerHour) + ' hours ago';
	else if (elapsed < msPerMonth)
		return Math.round(elapsed / msPerDay) + ' days ago';
	else if (elapsed < msPerYear)
		return Math.round(elapsed / msPerMonth) + ' months ago';
	else return Math.round(elapsed / msPerYear) + ' years ago';
};

const outputPosts = (results, container) => {
	//container.html('');

	if (!Array.isArray(results)) {
		results = [results];
	}

	results.forEach((result) => container.append(createPostHtml(result)));

	if (results.length === 0) {
		container.append(`<span class="noResults">Nothing to show</span>`);
	}
};

const outputPostsWithReplies = (results, container) => {
	container.html('');

	if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
		container.append(createPostHtml(results.replyTo));
	}

	container.append(createPostHtml(results.postData, true));

	results.replies.forEach((result) => container.append(createPostHtml(result)));
};

const outputUsers = (results, container) => {
	container.html('');

	let html = '';
	results.forEach((result) => {
		html = createUserHtml(result, true);
		container.append(html);
	});

	if (results.length === 0) {
		container.append("<span class='noResults'>Wow! So empty.</span>");
	}
};

const outputSelectableUsers = (results, container) => {
	container.html('');

	let html = '';
	results.forEach((result) => {
		if (
			result._id == userLoggedIn._id ||
			selectedUsers.some((u) => u._id == result._id)
		) {
			return;
		}
		html = createUserHtml(result, false);
		let element = $(html);
		element.click(() => userSelected(result));
		container.append(element);
	});

	if (results.length === 0) {
		container.append("<span class='noResults'>Wow! So empty.</span>");
	}
};

const userSelected = (user) => {
	selectedUsers.push(user);
	updateSelectedUsersHtml();
	$('#userSearchTextbox').val('').focus();
	$('.resultsContainer').html('');
	$('#createChatButton').prop('disabled', false);
};

const createUserHtml = (userData, showFollowButton) => {
	const isFollowing =
		userLoggedIn.following && userLoggedIn.following.includes(userData._id);
	const text = isFollowing ? 'following' : 'follow';
	const buttonClass = isFollowing ? 'followButton following' : 'followButton';

	let followButton = '';
	if (showFollowButton && userLoggedIn._id !== userData._id) {
		followButton = `
        <div class='followButtonContainer'>
            <button class='${buttonClass}' data-user='${userData._id}'>
                ${text}
            </button>
        </div>
        `;
	}

	return `
    <div class='user'>
        <div class='userImageContainer'>
            <img src='${userData.profilePic}' />
        </div>
        <div class='userDetailsContainer'>
            <div class='header'>
                <a href='/profile/${userData.username}'>${userData.firstName} ${userData.lastName}</a>
                <span class='username'>@${userData.username}</span>
            </div>
        </div>
        ${followButton}
    </div>
    `;
};

const findHashtags = (searchText) => {
	const regexp = /\B\#\w\w+\b/g;
	let result = searchText && searchText.match(regexp);
	if (result) {
		return result.map(function (s) {
			return s.trim();
		});
	} else {
		return false;
	}
};

const findMentions = (searchText, withAt) => {
	const regexp = /\B\@\w\w+\b/g;
	let result = searchText && searchText.match(regexp);
	if (result) {
		return result.map(function (s) {
			let resultString = withAt ? s : s.replace('@', '');
			return resultString.trim();
		});
	} else {
		return false;
	}
};

const findDuplicateHashtags = (arr) => {
	return arr.filter((item, index) => arr.indexOf(item) != index);
};

const youtubeEmbedder = (url) => {
	const regExp =
		/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	const match = url && url.match(regExp);

	if (match && match[2].length == 11) {
		return `<iframe class='youtubeEmbed' src="//www.youtube.com/embed/${match[2]}" frameborder="0" allowfullscreen></iframe>`;
	} else {
		return false;
	}
};

const searchUsers = (searchTerm) => {
	$.get('/api/users', { search: searchTerm }, (results) => {
		outputSelectableUsers(results, $('.resultsContainer'));
	});
};

const updateSelectedUsersHtml = () => {
	var elements = [];

	selectedUsers.forEach((user) => {
		const name = user.firstName + ' ' + user.lastName;
		const userElement = $(`<span class="selectedUser">${name}</span>`);
		elements.push(userElement);
	});

	$('.selectedUser').remove();
	$('#selectedUsers').prepend(elements);
};

const getChatName = (chatData) => {
	var chatName = chatData.chatName;

	if (!chatName) {
		var otherChatUsers = getOtherChatUsers(chatData.users);
		var namesArray = otherChatUsers.map(
			(user) => user.firstName + ' ' + user.lastName
		);
		chatName = namesArray.join(', ');
	}

	return chatName;
};

const getOtherChatUsers = (users) => {
	if (users.length == 1) return users;

	return users.filter((user) => user._id != userLoggedIn._id);
};

const messageReceived = (newMessage) => {
	if ($(`[data-room="${newMessage.chat._id}"]`).length == 0) {
		showMessagePopup(newMessage);
	} else {
		addChatMessageHtml(newMessage);
	}

	refreshMessagesBadge();
};

const markNotificationsAsOpened = (notificationId = null, callback = null) => {
	if (callback == null) callback = () => location.reload();

	const url =
		notificationId != null
			? `/api/notifications/${notificationId}/markAsOpened`
			: `/api/notifications/markAsOpened`;

	$.ajax({
		url: url,
		type: 'PUT',
		success: callback
	});
};

const refreshMessagesBadge = () => {
	$.get('/api/chats', { unreadOnly: true }, (data) => {
		const numResults = data.length;

		if (numResults > 0) {
			$('#messagesBadge').text(numResults).addClass('active');
		} else {
			$('#messagesBadge').text('').removeClass('active');
		}
	});
};

const refreshNotificationsBadge = () => {
	$.get('/api/notifications', { unreadOnly: true }, (data) => {
		const numResults = data.length;

		if (numResults > 0) {
			$('#notificationBadge').text(numResults).addClass('active');
		} else {
			$('#notificationBadge').text('').removeClass('active');
		}
	});
};

const showNotificationPopup = (data) => {
	const html = createNotificationHtml(data);

	const element = $(html);

	element.hide().prependTo('#notificationList').slideDown('fast');

	setTimeout(() => element.fadeOut(400), 5000);
};

const showMessagePopup = (data) => {
	if (!data.chat.latestMessage._id) {
		data.chat.latestMessage = data;
	}

	const html = createChatHtml(data.chat);

	const element = $(html);

	element.hide().prependTo('#notificationList').slideDown('fast');

	setTimeout(() => element.fadeOut(400), 5000);
};

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

const createChatHtml = (chatData) => {
	var chatName = getChatName(chatData);
	var image = getChatImageElements(chatData);
	var latestMessage = getLatestMessage(chatData.latestMessage);

	var activeClass =
		!chatData.latestMessage ||
		chatData.latestMessage.readBy.includes(userLoggedIn._id)
			? ''
			: ' active';

	return `<a href='/messages/${chatData._id}' class='resultListItem${activeClass}'>
                ${image}
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subText ellipsis'>${latestMessage}</span>
                </div>
            </a>`;
};

const getLatestMessage = (latestMessage) => {
	if (latestMessage != null) {
		const sender = latestMessage.sender;
		return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
	}

	return 'New Chat';
};

const getChatImageElements = (chatData) => {
	var otherChatUsers = getOtherChatUsers(chatData.users);

	var groupChatClass = '';
	var chatImage = getUserChatImageElement(otherChatUsers[0]);

	if (otherChatUsers.length > 1) {
		groupChatClass = 'groupChatImage';
		chatImage += getUserChatImageElement(otherChatUsers[1]);
	}

	return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
};

const getUserChatImageElement = (user) => {
	if (!user || !user.profilePic) {
		return alert('User passed into function is invalid');
	}

	return `<img src='${user.profilePic}' alt='User's profile pic'>`;
};

const openSidebar = () => {
	$('.mainSectionContainer').attr(
		'style',
		`${
			is_safari ? 'width: calc(100% - 75px);' : ''
		}transform: translate(75px, 0);transition: all 250ms ease`
	);
};
const closeSidebar = () => {
	$('.mainSectionContainer').attr(
		'style',
		`translate(0, 0);transition: all 250ms ease`
	);
};

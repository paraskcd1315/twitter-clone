$('#postTextarea, #replyTextArea').keyup((e) => {
	const textbox = $(e.target);
	const value = textbox.val().trim();

	const isModal = textbox.parents('.modal').length === 1;

	const submitButton = isModal
		? $('#submitReplyButton')
		: $('#submitPostButton');

	if (submitButton && submitButton.length === 0)
		return console.log('No submit button found');

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

	$.post('/api/posts', data, (postData) => {
		if (postData.replyTo) {
			return location.reload();
		}

		textbox.val('');
		const html = createPostHtml(postData);
		$('.postsContainer').prepend(html);
		button.prop('disabled', true);
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

const getPostIdFromElement = (el) => {
	const isRoot = el.hasClass('post');
	const rootElement = isRoot ? el : el.closest('.post');
	return rootElement.data().id;
};

const createPostHtml = (postData, largeFont = false) => {
	if (postData == null) return console.error('Post object is null');

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

	return `
    <div class="post${largeFont ? ' largeFont' : ''}" data-id="${postData._id}">
		<div class="postActionContainer">
			${retweetText}
		</div>
        <div class="mainContentContainer">
            <div class="userImageContainer">
                <img src="${postData.postedBy.profilePic}"/>
            </div>
            <div class="postContentContainer">
                <div class="header">
                    <a class="displayName" href="/profile/${
											postData.postedBy.username
										}">${
		postData.postedBy.firstName + ' ' + postData.postedBy.lastName
	}</a>
                    <span class="username">@${postData.postedBy.username}</span>
                    <span class="date">${timeDifference(
											new Date(),
											new Date(postData.createdAt)
										)}</span>
                </div>
				${replyFlag}
                <div class="postBody">
                    <span>${postData.content}</span>
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
	container.html('');

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

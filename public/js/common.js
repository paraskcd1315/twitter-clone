$('#postTextarea').keyup((e) => {
	const textbox = $(e.target);
	const value = textbox.val().trim();

	const submitButton = $('#submitPostButton');

	if (submitButton && submitButton.length === 0)
		return console.log('No submit button found');

	if (value === '') {
		submitButton.prop('disabled', true);
		return;
	} else {
		submitButton.prop('disabled', false);
	}
});

$('#submitPostButton').click((e) => {
	const button = $(e.target);
	const textbox = $('#postTextarea');

	const data = {
		content: textbox.val().trim()
	};

	$.post('/api/posts', data, (postData) => {
		textbox.val('');
		const html = createPostHtml(postData);
		$('.postsContainer').prepend(html);
		button.prop('disabled', true);
	});
});

$(document).on('click', '.likeButton', (e) => {
	const button = $(e.target);
	const postId = getPostIdFromElement(button);
	
    if(postId === undefined) console.error("Could not fetch post id");

    $.ajax({
        url:`/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            console.log(postData);
        }
    })
});

const getPostIdFromElement = (el) => {
	const isRoot = el.hasClass('post');
	const rootElement = isRoot ? el : el.closest('.post');
	return rootElement.data().id;
};

const createPostHtml = (postData) => {
	const postedBy = postData.postedBy;
	const displayName = postedBy.firstName + ' ' + postedBy.lastName;
	const timestamp = timeDifference(new Date(), new Date(postData.createdAt));

	return `
    <div class="post" data-id="${postData._id}">
        <div class="mainContentContainer">
            <div class="userImageContainer">
                <img src="${postedBy.profilePic}"/>
            </div>
            <div class="postContentContainer">
                <div class="header">
                    <a class="displayName" href="/profile/${postedBy.username}">${displayName}</a>
                    <span class="username">@${postedBy.username}</span>
                    <span class="date">${timestamp}</span>
                </div>
                <div class="postBody">
                    <span>${postData.content}</span>
                </div>
                <div class="postFooter">
                    <div class="postButtonContainer">
                        <button>
                            <i class="far fa-comment"></i>
                        </button>
                    </div>
                    <div class="postButtonContainer">
                        <button>
                            <i class="fas fa-retweet"></i>
                        </button>
                    </div>
                    <div class="postButtonContainer">
                        <button class="likeButton">
                            <i class="far fa-heart"></i>
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

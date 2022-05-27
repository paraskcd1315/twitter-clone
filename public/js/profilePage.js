var isProcessPending = false; // for stop multiple request simultaneously
var recordsPerPage = 15; // you can set as you want to get data per ajax request
var recordsOffset = 0; // get data from given no
var noMorePosts = false;

$(document).ready(() => {
	if (selectedTab === 'replies') {
		loadReplies(false);
	} else {
		loadPosts(false);
	}
});

$(window).scroll(function () {
	// End of the document reached?
	if (
		$(document).height() - $(this).height() - 200 < $(this).scrollTop() &&
		isProcessPending === false &&
		noMorePosts === false
	) {
		recordsOffset = recordsOffset + recordsPerPage;
		isProcessPending = true;
		if (selectedTab === 'replies') {
			loadReplies(true);
		} else {
			loadPosts(true);
		}
	}
});

const loadPosts = (more) => {
	$.get('/api/posts', { postedBy: profileUserId, pinned: true }, (results) => {
		outputPinnedPost(results, $('.pinnedPostContainer'));
		isProcessPending = false;
	});
	$.get(
		'/api/posts',
		{
			postedBy: profileUserId,
			isReply: false,
			recordsPerPage: recordsPerPage,
			recordsOffset: recordsOffset
		},
		(results) => {
			if (more && results.length === 0) {
				noMorePosts = true;
				return;
			}
			outputPosts(results, $('.postsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.postsContainer').attr('style', '');
			$('.pinnedPostContainer').attr('style', '');
			isProcessPending = false;
		}
	);
};

const loadReplies = (more) => {
	$.get(
		'/api/posts',
		{
			postedBy: profileUserId,
			isReply: true,
			recordsPerPage: recordsPerPage,
			recordsOffset: recordsOffset
		},
		(results) => {
			if (more && results.length === 0) return;
			outputPosts(results, $('.postsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.postsContainer').attr('style', '');
			$('.pinnedPostContainer').attr('style', '');
			isProcessPending = false;
		}
	);
};

const outputPinnedPost = (results, container) => {
	if (results.length === 0) {
		container.hide();
		return;
	}

	container.html('');

	results.forEach((result) =>
		container.append(createPostHtml(result, false, true))
	);
};

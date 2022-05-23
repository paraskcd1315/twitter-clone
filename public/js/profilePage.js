$(document).ready(() => {
	if (selectedTab === 'replies') {
		loadReplies();
	} else {
		loadPosts();
	}
});

const loadPosts = () => {
	$.get('/api/posts', { postedBy: profileUserId, pinned: true }, (results) => {
		outputPinnedPost(results, $('.pinnedPostContainer'));
	});
	$.get(
		'/api/posts',
		{ postedBy: profileUserId, isReply: false },
		(results) => {
			outputPosts(results, $('.postsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.postsContainer').attr('style', '');
			$('.pinnedPostContainer').attr('style', '');
		}
	);
};

const loadReplies = () => {
	$.get('/api/posts', { postedBy: profileUserId, isReply: true }, (results) => {
		outputPosts(results, $('.postsContainer'));
	});
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

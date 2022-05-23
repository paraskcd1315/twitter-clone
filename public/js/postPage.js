$(document).ready(() => {
	$.get('/api/posts/' + postId, (results) => {
		outputPostsWithReplies(results, $('.postsContainer'));
		$('.loadingSpinnerContainer').remove();
		$('.postsContainer').attr('style', '');
	});
});

$(document).ready(() => {
	$.get('/api/posts', { followingOnly: true }, (results) => {
		outputPosts(results, $('.postsContainer'));
		$('.loadingSpinnerContainer').remove();
		$('.postsContainer').attr('style', '');
	});
});

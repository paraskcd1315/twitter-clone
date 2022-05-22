$(document).ready(() => {
	$.get('/api/hashtags', { search: hashtag }, (results) => {
		outputPosts(results[0].posts, $('.resultsContainer'));
	});
});

$('#searchBox').keydown((e) => {
	clearTimeout(timer);

	const textbox = $(e.target);
	let value = textbox.val();
	const searchType = textbox.data().search;

	timer = setTimeout(() => {
		value = textbox.val().trim();
		if (value == '') {
			$('.resultsContainer').html('');
		} else {
			search(value, searchType);
		}
	}, 1000);
});

const search = (searchTerm, searchType) => {
	const url = searchType === 'users' ? '/api/users' : '/api/posts';

	$.get(
		url,
		{ search: searchTerm, followingOnly: searchType == 'users' ? false : true },
		(results) => {
			if (searchType == 'users') {
				outputUsers(results, $('.resultsContainer'));
			} else {
				outputPosts(results, $('.resultsContainer'));
			}
		}
	);
};

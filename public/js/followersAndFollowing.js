$(document).ready(() => {
	if (selectedTab === 'followers') {
		loadFollowers();
	} else {
		loadFollowing();
	}
});

const loadFollowers = () => {
	$.get(
		`/api/users/${profileUserId}/followers`,
		{ postedBy: profileUserId, isReply: false },
		(results) => {
			outputUsers(results.followers, $('.resultsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.resultsContainer').attr('style', '');
		}
	);
};

const loadFollowing = () => {
	$.get(
		`/api/users/${profileUserId}/following`,
		{ postedBy: profileUserId, isReply: true },
		(results) => {
			outputUsers(results.following, $('.resultsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.resultsContainer').attr('style', '');
		}
	);
};

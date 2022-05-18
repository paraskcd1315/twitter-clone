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
		}
	);
};

const loadFollowing = () => {
	$.get(
		`/api/users/${profileUserId}/following`,
		{ postedBy: profileUserId, isReply: true },
		(results) => {
			outputUsers(results.following, $('.resultsContainer'));
		}
	);
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

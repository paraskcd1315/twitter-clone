$(document).ready(() => {
	$.get('/api/chats', (data, status, xhr) => {
		if (xhr.status == 400) {
			console.error('Could not get chat list');
		} else {
			outputChatList(data, $('.resultsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.resultsContainer').attr('style', '');
		}
	});
});

const outputChatList = (chatList, container) => {
	chatList.forEach((chat) => {
		var html = createChatHtml(chat);
		container.append(html);
	});

	if (chatList.length == 0) {
		container.append("<span class='noResults'>Nothing to show.</span>");
	}
};

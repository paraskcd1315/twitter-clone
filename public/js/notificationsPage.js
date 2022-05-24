$(document).ready(() => {
	$.get('/api/notifications', (results) => {
		outputNotificationList(results, $('.resultsContainer'));
		$('.loadingSpinnerContainer').remove();
		$('.resultsContainer').attr('style', '');
	});
});

$('#markNotificationsAsRead').click(() => markNotificationsAsOpened());

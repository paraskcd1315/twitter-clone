var isProcessPending = false; // for stop multiple request simultaneously
var recordsPerPage = 15; // you can set as you want to get data per ajax request
var recordsOffset = 0; // get data from given no
var noMorePosts = false;

$(document).ready(() => {
	$.get(
		'/api/posts',
		{
			followingOnly: true,
			recordsPerPage: recordsPerPage,
			recordsOffset: recordsOffset
		},
		(results) => {
			outputPosts(results, $('.postsContainer'));
			$('.loadingSpinnerContainer').remove();
			$('.postsContainer').attr('style', '');
		}
	);
});

$(window).scroll(function () {
	if (
		$(document).height() - $(this).height() - 200 < $(this).scrollTop() &&
		isProcessPending === false &&
		noMorePosts === false
	) {
		recordsOffset = recordsOffset + recordsPerPage;
		isProcessPending = true;
		$.get(
			'/api/posts',
			{
				followingOnly: true,
				recordsPerPage: recordsPerPage,
				recordsOffset: recordsOffset
			},
			(results) => {
				if (results.length === 0) {
					noMorePosts = true;
					return;
				}
				outputPosts(results, $('.postsContainer'));
				isProcessPending = false;
			}
		);
	}
});

$('#submitImageButton').click(function () {
	$('#postImageInput').trigger('click');
});

$('#postImageInput').change(function () {
	console.log(this.files);
	if (this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.createElement('img');
			image.className = 'imagePreview';
			image.src = e.target.result;

			const imagePostContainer = document.createElement('div');
			imagePostContainer.className = 'imagePostContainer';
			imagePostContainer.innerHTML = `
			<button class='removeImage'>
				<i class="fas fa-trash"></i>
			</button>
			`;

			const jQImage = $(image);
			$(imagePostContainer).append(jQImage);
			$('.imagePostPreviewContainer').append(imagePostContainer);
			$('.imagePostPreviewContainer').attr('style', 'display: flex');
		};
		reader.readAsDataURL(this.files[0]);
	}
});

$(document).on('click', '.removeImage', () => {
	$('.imagePreview').remove();
	$('.imagePostContainer').remove();
	$('.imagePostPreviewContainer').attr('style', 'display: none');
});

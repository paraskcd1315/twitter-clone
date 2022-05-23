var typing = false;
var lastTypingTime;

$(document).ready(() => {
	socket.emit('Join room', chatId);
	socket.on('Typing', () => $('.typingDots').show());
	socket.on('Stop Typing', () => $('.typingDots').hide());

	$.get(`/api/chats/${chatId}`, (data) => {
		$('#chatName').text(getChatName(data));
	});

	$.get(`/api/chats/${chatId}/messages`, (data) => {
		let messages = [];

		let lastSenderId = '';

		data.forEach((message, index) => {
			const html = createMessageHtml(message, data[index + 1], lastSenderId);
			messages.push(html);

			lastSenderId = message.sender._id;
		});

		const messageHtml = messages.join('');

		addMessagesHtmlToPage(messageHtml);
		scrollToBottom(false);
		$('.loadingSpinnerContainer').remove();
		$('.chatContainer').css('visibility', 'visible');
	});
});

$('#chatNameButton').click((e) => {
	const name = $('#chatNameTextbox').val().trim();
	$.ajax({
		url: `/api/chats/${chatId}`,
		type: 'PUT',
		data: { chatName: name },
		success: (data, status, xhr) => {
			if (xhr.status != 204) {
				alert('Could not update');
			} else {
				location.reload();
			}
		}
	});
});

$('.sendMessageButton').click(() => {
	messageSubmitted();
});

$('.inputTextBox').keydown((e) => {
	updateTyping();
	if ((e.which === 13 || e.keyCode == 13) && !e.shiftKey) {
		messageSubmitted();
		return false;
	}
});

const updateTyping = () => {
	if (!connected) {
		return;
	}

	if (!typing) {
		typing = true;
		socket.emit('Typing', chatId);
	}

	lastTypingTime = new Date().getTime();
	const timerLength = 3000;

	setTimeout(() => {
		const timeNow = new Date().getTime();
		const timeDiff = timeNow - lastTypingTime;

		if (timeDiff >= timerLength && typing) {
			socket.emit('Stop Typing', chatId);
			typing = false;
		}
	}, timerLength);
};

const addMessagesHtmlToPage = (html) => {
	$('.chatMessages').append(html);
};

const messageSubmitted = () => {
	const content = $('.inputTextBox').val().trim();

	if (content != '') {
		sendMessage(content);
		$('.inputTextBox').val('');
		socket.emit('Stop Typing', chatId);
		typing = false;
	}
};

const sendMessage = (content) => {
	$.post(
		`/api/messages`,
		{ content: content, chatId: chatId },
		(data, status, xhr) => {
			if (xhr.status != 201) {
				console.error('Could not send message');
				$('.inputTextBox').val(content);
				return;
			}

			addChatMessageHtml(data);

			if (connected) {
				socket.emit('New Message', data);
			}
		}
	);
};

const addChatMessageHtml = (message) => {
	if (!message || !message._id) {
		console.error('Message is not valid');
		return;
	}

	let messageDiv = createMessageHtml(message, null, '');

	addMessagesHtmlToPage(messageDiv);
	scrollToBottom(true);
};

const createMessageHtml = (message, nextMessage, lastSenderId) => {
	const sender = message.sender;
	const senderName = sender.firstName + ' ' + sender.lastName;

	const currentSenderId = sender._id;
	const nextSenderId = nextMessage != null ? nextMessage.sender._id : '';

	const isFirst = lastSenderId != currentSenderId;
	const isLast = nextSenderId != currentSenderId;

	const isMine = message.sender._id == userLoggedIn._id;
	let liClassName = isMine ? ' mine' : ' theirs';

	let nameElement = '';
	if (isFirst) {
		liClassName += ' first';
		if (!isMine) {
			nameElement = `<span class='senderName'>${senderName}</span>`;
		}
	}

	let profileImage = '';
	if (isLast) {
		liClassName += ' last';
		profileImage = `<img src='${sender.profilePic}'>`;
	}

	let imageContainer = '';
	if (!isMine) {
		imageContainer = `
        <div class='imageContainer'>
            ${profileImage}
        </div>`;
	}

	return `
    <li class='message${liClassName}'>
        ${imageContainer}
        <div class='messageContainer'>
            ${nameElement}
            <span class='messageBody'>
                ${message.content}
            </span>
        </div>
    </li>
    `;
};

const scrollToBottom = (animated) => {
	const container = $('.chatMessages');
	const scrollHeight = container[0].scrollHeight;

	if (animated) {
		container.animate({ scrollTop: scrollHeight }, 'slow');
	} else {
		container.scrollTop(scrollHeight);
	}
};

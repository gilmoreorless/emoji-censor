/**
 * Basic process
 * 
 * - When page is loaded, ask for censoring status
 * - If censoring is enabled:
 *   - Redact page & send total count to background script
 *   - Set up mutation observer
 *     - On new content, redact it and update count
 *     - On removed content, look for removed redactions and update count
 */

var specialCases = [
	['twitter.com', '.Emoji'],
	['mobile.twitter.com', 'img[src*="twimg.com/emoji/"]'],
];

var isCensoringActive = false;

function redact(elems) {
	var options = {};
	specialCases.forEach(function (rule) {
		if (location.hostname === rule[0]) {
			options.customDisplayElements = rule[1];
		}
	});
	emojiCensor.redactElements(elems, options);
}

var observerConfig = {
	characterData: true,
	childList: true,
	subtree: true,
};
var observer = new MutationObserver(function (mutations) {
	console.log('observer', mutations);
	mutations.forEach(function (mutation) {
		if (mutation.type === 'childList') {
			redact(mutation.addedNodes);
		} else if (mutation.type === 'characterData') {
			redact(mutation.target);
		}
	});
	sendTotalCount();
});

function setIsActive(isNowActive) {
	console.log('setIsActive', isNowActive);
	isNowActive = !!isNowActive;
	if (isNowActive === isCensoringActive) {
		return;
	}
	isCensoringActive = isNowActive;
	if (isCensoringActive) {
		document.querySelectorAll('.emoji-censor-wrapped').forEach(el => {
			el.classList.add('emoji-censor-redacted');
		});
		redact(document.body);
		sendTotalCount();
		observer.observe(document.body, observerConfig);
	} else {
		document.querySelectorAll('.emoji-censor-redacted').forEach(el => {
			el.classList.remove('emoji-censor-redacted');
		});
		sendTotalCount(0);
		observer.disconnect();
	}
}

function getGlobalStatus() {
	console.log('getGlobalStatus')
	chrome.runtime.sendMessage({ msg: 'isGlobalActive' }, function (response) {
		console.log('isGlobalActive response', response);
		setIsActive(response.isActive);
	});
}

function sendTotalCount(explicitCount) {
	var count = explicitCount !== undefined ? explicitCount : emojiCensor.redactedCount();
	chrome.runtime.sendMessage({
		msg: 'totalRedacted',
		count: count
	});
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.msg) {
		case 'setActive': setIsActive(true); break;
		case 'setInactive': setIsActive(false); break;
		case 'isPageActive':
			sendResponse({ isActive: isCensoringActive });
			break;
	}
});

function checkReadyState() {
	if (document.readyState === 'complete') {
		getGlobalStatus();
	}
}

document.addEventListener('readystatechange', checkReadyState);
checkReadyState();
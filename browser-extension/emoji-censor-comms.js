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

function pad(n) {
	return ('00' + n).substr(-2);
}
function log(...args) {
	var now = new Date();
	var stamp = [now.getHours(), now.getMinutes(), now.getSeconds()].map(pad).join(':');
	args.unshift('%c[emoji-censor ' + stamp + ']', 'color:#999');
	console.log(...args);
}

var observerConfig = {
	characterData: true,
	childList: true,
	subtree: true,
};
var observer = new MutationObserver(function (mutations) {
	log('observer', mutations);
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
	log('setIsActive', isNowActive);
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
	log('getGlobalStatus')
	chrome.runtime.sendMessage({ msg: 'isGlobalActive' }, function (response) {
		log('isGlobalActive response', response);
		setIsActive(response.isActive);
	});
}

function sendTotalCount(explicitCount) {
	var count = explicitCount !== undefined ? explicitCount : emojiCensor.redactedCount();
	log('sendTotalCount', count);
	chrome.runtime.sendMessage({
		msg: 'totalRedacted',
		count: count
	});
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	log('runtime.onMessage', request);
	switch (request.msg) {
		case 'setActive': setIsActive(true); break;
		case 'setInactive': setIsActive(false); break;
		case 'isPageActive':
			log('  [response]:', isCensoringActive);
			sendResponse({ isActive: isCensoringActive });
			break;
	}
});

function checkReadyState() {
	log('checkReadyState', document.readyState);
	if (document.readyState === 'complete') {
		getGlobalStatus();
	}
}

document.addEventListener('readystatechange', checkReadyState);
checkReadyState();

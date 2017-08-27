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

///// CONFIG /////

var DEBUG = false;

var specialCases = [
	['twitter.com', '.Emoji'],
	['mobile.twitter.com', 'img[src*="twimg.com/emoji/"]'],
	['www.facebook.com', 'img[src*="images/emoji.php"]'],
];

var isCensoringActive = false;


///// DEBUG LOGGING /////

function pad(n) {
	return ('00' + n).substr(-2);
}
function log(...args) {
	if (!DEBUG) {
		return;
	}
	var now = new Date();
	var stamp = [now.getHours(), now.getMinutes(), now.getSeconds()].map(pad).join(':');
	args.unshift('%c[emoji-censor ' + stamp + ']', 'color:#999');
	console.log(...args);
}


///// REDACTION /////

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


///// COMMUNICATION & LIFECYCLE /////

var runtimeOnMessage, runtimeSendMessage;
if (typeof browser !== 'undefined') {
	runtimeOnMessage = browser.runtime.onMessage;
	runtimeSendMessage = function (message, onResponse) {
		var promise = browser.runtime.sendMessage(message);
		return onResponse ? promise.then(onResponse) : promise;
	};
} else {
	runtimeOnMessage = chrome.runtime.onMessage;
	runtimeSendMessage = function (message, onResponse) {
		var promise = new Promise((resolve, reject) => {
			if (onResponse) {
				chrome.runtime.sendMessage(message, function (...resArgs) {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
						return;
					}
					resolve(...resArgs);
				});
			} else {
				chrome.runtime.sendMessage(message);
				resolve();
			}
		});
		return onResponse ? promise.then(onResponse) : promise;
	};
}

function getGlobalStatus() {
	log('getGlobalStatus')
	runtimeSendMessage({ msg: 'isGlobalActive' }, function (response) {
		log('isGlobalActive response', response);
		setIsActive(response.isActive);
	});
}

function sendTotalCount(explicitCount) {
	var count = explicitCount !== undefined ? explicitCount : emojiCensor.redactedCount();
	log('sendTotalCount', count);
	runtimeSendMessage({
		msg: 'totalRedacted',
		count: count
	});
}

runtimeOnMessage.addListener(function (request, sender, sendResponse) {
	log('runtime.onMessage', request);
	switch (request.msg) {
		case 'setActive': setIsActive(true); break;
		case 'setInactive': setIsActive(false); break;
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

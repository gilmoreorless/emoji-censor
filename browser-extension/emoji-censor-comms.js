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
	['*', 'img[src^="https://twemoji.maxcdn.com/"]'],
	['*', 'img[src^="https://s.w.org/images/core/emoji/"]'],
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
	args.push(window.frameElement);
	console.log(...args);
}


///// REDACTION /////

var trackedCustomElements = new WeakMap();

function redact(elems, rootNode, customHost) {
	(rootNode || document).querySelectorAll('.emoji-censor-wrapped').forEach(el => {
		el.classList.add('emoji-censor-redacted');
	});
	var options = {};
	var customSelectors = specialCases.filter(function (rule) {
		return (
			rule[0] === '*' ||
			rule[0] === location.hostname ||
			(customHost && rule[0] === customHost)
		);
	}).map(function (rule) {
		return rule[1];
	});
	if (customSelectors.length) {
		options.customDisplayElements = customSelectors.join(',');
	}
	if (rootNode) {
		options.rootNode = rootNode;
	}
	emojiCensor.redactElements(elems, options);
}

function unredact(rootNode) {
	rootNode.querySelectorAll('.emoji-censor-redacted').forEach(el => {
		el.classList.remove('emoji-censor-redacted');
	});
}

function observerCallback(rootNode, customHost) {
	return function (mutations) {
		log('observer', mutations, rootNode, customHost);
		mutations.forEach(function (mutation) {
			if (mutation.type === 'childList') {
				redact(mutation.addedNodes, rootNode, customHost);
				// Clean up custom element MutationObservers that are no longer needed
				mutation.removedNodes.forEach(function (node) {
					if (trackedCustomElements.has(node)) {
						trackedCustomElements.delete(node);
					}
				})
			} else if (mutation.type === 'characterData') {
				redact(mutation.target, rootNode, customHost);
			}
		});
		sendTotalCount();
	}
}

var observerConfig = {
	characterData: true,
	childList: true,
	subtree: true,
};
var observer = new MutationObserver(observerCallback(document));

function setIsActive(isNowActive) {
	log('setIsActive', isNowActive);
	isNowActive = !!isNowActive;
	if (isNowActive === isCensoringActive) {
		return;
	}
	isCensoringActive = isNowActive;
	if (isCensoringActive) {
		redact(document.body);
		// Special case to redact <twitter-widget> custom elements
		document.querySelectorAll('twitter-widget').forEach(widget => {
			let root = widget.shadowRoot;
			let twitterObserver;
			redact(root, root, 'twitter.com');
			if (trackedCustomElements.has(widget)) {
				twitterObserver = trackedCustomElements.get(widget);
			} else {
				let cssClone = document.getElementById('emoji-censor-default-styles').cloneNode(true);
				let style = root.querySelector('style');
				style.parentNode.insertBefore(cssClone, style);
				twitterObserver = new MutationObserver(observerCallback(root, 'twitter.com'));
				trackedCustomElements.set(widget, twitterObserver);
			}
			twitterObserver.observe(root, observerConfig);
		});
		observer.observe(document.body, observerConfig);
		sendTotalCount();
	} else {
		unredact(document);
		document.querySelectorAll('twitter-widget').forEach(widget => {
			unredact(widget.shadowRoot);
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
	var count = explicitCount;
	if (explicitCount === undefined) {
		count = emojiCensor.redactedCount();
		document.querySelectorAll('twitter-widget').forEach(widget => {
			count += emojiCensor.redactedCount({ rootNode: widget.shadowRoot });
		});
	}
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

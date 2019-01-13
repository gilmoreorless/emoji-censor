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

// Extra rules to apply on specific domains.
// Used for sites & applications that replace emoji chars with custom images.
var specialCases = [
	['*', 'img[src^="https://twemoji.maxcdn.com/"]'], // Twemoji library
	['*', 'img[src^="https://s.w.org/images/core/emoji/"]'], // Any Wordpress site
	['twitter.com', '.Emoji'],
	['mobile.twitter.com', 'img[src*="twimg.com/emoji/"]'],
	['www.facebook.com', 'img[src*="images/emoji.php"]'],
];

// Extra rules for about:blank pages.
// If a query selector matches on the page, the page is associated with a specific domain.
// Mainly useful for embedded Twitter widgets.
var aboutBlankCases = [
	['.timeline-Widget[data-iframe-title]', 'twitter.com'],
];

var isCensoringActive = false;


///// DEBUG LOGGING /////

function pad(n) {
	return ('00' + n).substr(-2);
}
function pad4(n) {
	return ('0000' + n).substr(-4);
}
function log(...args) {
	if (!DEBUG) {
		return;
	}
	var now = new Date();
	var stamp = `${
		[now.getHours(), now.getMinutes(), now.getSeconds()].map(pad).join(':')
	}.${pad4(now.getMilliseconds())}`;
	args.unshift('%c[emoji-censor ' + stamp + ']', 'color:#999');
	args.push(window.frameElement);
	console.log(...args);
}


///// REDACTION /////

var trackedCustomElements = new WeakMap();
var cachedCustomSelectors = new Map();

// NOTE: customHost is undefined in the majority of cases
function getCustomSelectors(customHost) {
	if (!cachedCustomSelectors.has(customHost)) {
		var customSelectors = specialCases.filter(function (rule) {
			return (
				rule[0] === '*' ||
				rule[0] === location.hostname ||
				(customHost && rule[0] === customHost)
			);
		}).map(function (rule) {
			return rule[1];
		});
		// Check for Twitter widgets in iframes without a src attribute
		// NOTE: Doesn't always work in Firefox — see https://bugzilla.mozilla.org/show_bug.cgi?id=1415539
		if (location.href === 'about:blank') {
			if (!document.body.firstChild) {
				// Don't cache if there's no content yet
				return customSelectors.join(',');
			}
			customSelectors = customSelectors.concat(
				aboutBlankCases.filter(function (rule) {
					return document.querySelector(rule[0])
				}).map(function (rule) {
					var hostRule = specialCases.find(function (hostRule) {
						return hostRule[0] === rule[1];
					});
					return hostRule[1];
				})
			);
		}
		cachedCustomSelectors.set(customHost, customSelectors.join(','));
	}
	return cachedCustomSelectors.get(customHost);
}

function redact(elems, rootNode, customHost) {
	(rootNode || document).querySelectorAll('.emoji-censor-wrapped').forEach(el => {
		el.classList.add('emoji-censor-redacted');
	});
	var options = {};
	var customSelectors = getCustomSelectors(customHost);
	if (customSelectors.length) {
		options.customDisplayElements = customSelectors;
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

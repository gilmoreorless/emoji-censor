/**
 * Basic process
 *
 * - Click browser action
 *     - If content script isn't in the page, inject it
 *     - Run script to redact any unredacted emoji
 *     - Get count of redacted elements
 *     - Set icon badge to count of redactions for that tab
 *         - Set error icon and different colour if it didn't work
 */

var codeData;

var colors = {
	good: 'hsl(126, 93%, 33%)',
	warning: 'hsl(56, 83%, 43%)',
	bad: 'hsl(16, 83%, 43%)'
};

function executeScriptPromise(tab, opts) {
	return new Promise(function (resolve, reject) {
		chrome.tabs.executeScript(tab.id, opts, function (results) {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(results);
			}
		});
	});
}

function injectContentScriptIfNeeded(tab) {
	return executeScriptPromise(tab, {
		code: 'document.documentElement.dataset.emojiCensorInstalled;'
	}).then(function (results) {
		if (results && results[0]) {
			return tab;
		}
		return executeScriptPromise(tab, {
			file: 'emoji-censor.js'
		}).then(function () {
			return executeScriptPromise(tab, {
				code: 'document.documentElement.dataset.emojiCensorInstalled = true;'
			});
		}).then(function () {
			return tab;
		});
	});
}

function setBadgeCount(tab, count) {
	var badgeOptions = {tabId: tab.id, text: ''};
	if (count != null && count !== '') {
		badgeOptions.text = '' + count;
	}
	chrome.browserAction.setBadgeText(badgeOptions);
}

function setBadgeColor(tab, color) {
	chrome.browserAction.setBadgeBackgroundColor({
		tabId: tab.id,
		color: color
	});
}

function setTotalCount(tab, count) {
	setBadgeColor(tab, colors.good);
	setBadgeCount(tab, count);
}

function replaceAndGetCount(tab) {
	return executeScriptPromise(tab, {
		code: 'emojiCensor.redactElements(document.body); emojiCensor.redactedCount();'
	}).then(function (results) {
		return (results && +results[0] || 0);
	});
}

function runConverter(tab) {
	injectContentScriptIfNeeded(tab)
		.then(replaceAndGetCount)
		.then(function (count) {
			setTotalCount(tab, count);
		})
	.catch(function (err) {
		console.error('Emoji Censor error:', err, tab);
		setBadgeColor(tab, colors.bad);
		setBadgeCount(tab, 'x');
	});
}

chrome.browserAction.onClicked.addListener(runConverter);

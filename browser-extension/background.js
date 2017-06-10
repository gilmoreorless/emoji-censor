/**
 * Basic process
 *
 * - Click browser action
 *   - If censoring is disabled
 *     - Enable censoring
 *     - Tell current tab to start censoring
 *   - If censoring is enabled
 *     - Disable censoring
 *     - Tell current tab to remove redactions & stop censoring
 *   - On tab selected, ensure that tab's content script is in the right mode
 * 
 * COMMS EVENTS
 * 
 * › Background -> content
 *   • setActive
 *   • setInactive
 *   • isPageActive -> returns boolean
 * 
 * › Content -> background
 *   • isGlobalActive -> returns boolean
 *   • totalRedacted {count: int}
 */

var isCensoringActive = false;

var colors = {
	good: 'hsl(126, 93%, 33%)',
	warning: 'hsl(56, 83%, 43%)',
	bad: 'hsl(16, 83%, 43%)'
};

var actionTitle = {
	active: 'Stop censoring emoji',
	inactive: 'Censor all emoji'
};

function getCountText(count) {
	if (count <= 999) {
		return count.toString();
	}
	return Math.floor(count / 1000) + 'k';
}

function setBadgeCount(tabId, count) {
	var badgeOptions = { tabId: tabId, text: '' };
	if (count != null && count !== '') {
		badgeOptions.text = getCountText(count);
	}
	chrome.browserAction.setBadgeText(badgeOptions);
}

function setBadgeColor(tabId, color) {
	chrome.browserAction.setBadgeBackgroundColor({
		tabId: tabId,
		color: color
	});
}

function setTotalCount(tabId, count) {
	setBadgeColor(tabId, colors.good);
	setBadgeCount(tabId, isCensoringActive ? count : '');
}

function ensureTabStatus(tabId) {
	chrome.tabs.sendMessage(tabId, {
		msg: isCensoringActive ? 'setActive' : 'setInactive'
	});
}

function toggleStatus() {
	isCensoringActive = !isCensoringActive;
	chrome.tabs.query({ active: true }, function (tabs) {
		tabs.forEach(function (tab) {
			ensureTabStatus(tab.id);
		});
	});
	chrome.browserAction.setTitle({
		title: actionTitle[isCensoringActive ? 'active' : 'inactive']
	});
}

function contentScriptMessageHandler(request, sender, sendResponse) {
	if (sender.tab && request.msg) {
		switch (request.msg) {
			case 'isGlobalActive':
				sendResponse({ isActive: isCensoringActive });
				break;
			case 'totalRedacted':
				setTotalCount(sender.tab.id, request.count);
				break;
		}
	}
}

chrome.browserAction.onClicked.addListener(toggleStatus);
chrome.runtime.onMessage.addListener(contentScriptMessageHandler);
chrome.tabs.onActivated.addListener(function (activeInfo) {
	ensureTabStatus(activeInfo.tabId);
});

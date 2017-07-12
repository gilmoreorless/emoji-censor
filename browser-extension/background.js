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
 * 
 * › Content -> background
 *   • isGlobalActive -> returns boolean
 *   • totalRedacted {count: int}
 */

///// CONFIG /////

var DEBUG = false;

var state = {
	isCensoringActive: false
};

var colors = {
	good: 'hsl(126, 93%, 33%)',
	warning: 'hsl(56, 83%, 43%)',
	bad: 'hsl(16, 83%, 43%)'
};

var actionTitle = {
	active: 'Stop censoring emoji',
	inactive: 'Censor all emoji'
};


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
	var stampArg = '%c[' + stamp + ']';
	var stampStyle = 'color:#999';
	if (typeof args[0] === 'string' && args[0].indexOf('%c') > -1) {
		args.splice(0, 1, stampArg + ' ' + args[0], stampStyle);
	} else {
		args.unshift(stampArg, stampStyle);
	}
	console.log(...args);
}


///// ICON BADGING /////

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
	log('setTotalCount', tabId, count);
	setBadgeColor(tabId, colors.good);
	setBadgeCount(tabId, state.isCensoringActive ? count : '');
}


///// LIFECYCLE /////

function ensureTabStatus(tabId) {
	log('ensureTabStatus', tabId);
	chrome.tabs.sendMessage(tabId, {
		msg: state.isCensoringActive ? 'setActive' : 'setInactive'
	});
}

function saveState() {
	log('saveState', state);
	localStorage.setItem('state', JSON.stringify(state));
}

function restoreState() {
	try {
		var savedState = JSON.parse(localStorage.getItem('state'));
		log('restoreState', savedState);
		if (savedState) {
			state = savedState;
		}
	} catch (e) {
		log('restoreState FAILED, state =', state);
	}
}

function contentScriptMessageHandler(request, sender, sendResponse) {
	if (sender.tab && request.msg) {
		log('%cruntime.onMessage', 'color:green;font-weight:bold', request, sender);
		switch (request.msg) {
			case 'isGlobalActive':
				log('  [response]:', state.isCensoringActive);
				sendResponse({ isActive: state.isCensoringActive });
				break;
			case 'totalRedacted':
				setTotalCount(sender.tab.id, request.count);
				break;
		}
	}
}

chrome.runtime.onMessage.addListener(contentScriptMessageHandler);
chrome.runtime.onSuspend.addListener(saveState);
chrome.tabs.onActivated.addListener(function (activeInfo) {
	ensureTabStatus(activeInfo.tabId);
});

log('--- event page loaded ---');
restoreState();


///// USER ACTIONS /////

function toggleStatus() {
	state.isCensoringActive = !state.isCensoringActive;
	log('toggleStatus, active =', state.isCensoringActive);
	chrome.tabs.query({ active: true }, function (tabs) {
		tabs.forEach(function (tab) {
			ensureTabStatus(tab.id);
		});
	});
	chrome.browserAction.setTitle({
		title: actionTitle[state.isCensoringActive ? 'active' : 'inactive']
	});
}

chrome.browserAction.onClicked.addListener(toggleStatus);

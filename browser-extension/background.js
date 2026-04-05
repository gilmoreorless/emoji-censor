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
var hasLocalState = false; // Set to true after fetching from browser.storage

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
	return ('00' + n).slice(-2);
}
function pad4(n) {
	return ('0000' + n).slice(-4);
}
function log(...args) {
	if (!DEBUG) {
		return;
	}
	var now = new Date();
	var stamp = `${
		[now.getHours(), now.getMinutes(), now.getSeconds()].map(pad).join(':')
	}.${pad4(now.getMilliseconds())}`;
	var stampArg = '%c[' + stamp + ']';
	var stampStyle = 'color:#999';
	if (typeof args[0] === 'string' && args[0].indexOf('%c') > -1) {
		args.splice(0, 1, stampArg + ' ' + args[0], stampStyle);
	} else {
		args.unshift(stampArg, stampStyle);
	}
	console.log(...args);
}


///// WEBEXTENSIONS POLYFILL /////

if (typeof browser === 'undefined') {
	globalThis.browser = {};
	for (let key of ['action', 'runtime', 'storage', 'tabs']) {
		browser[key] = chrome[key];
	}
}


///// ICON BADGING /////

class MappyMap extends Map {
	get(key) {
		let value = super.get(key);
		return value || new Map();
	}
}

var tabCounts = new MappyMap();

function addTabFrameCount(tabId, frameId, count) {
	var tabFrames = tabCounts.get(tabId);
	tabFrames.set(frameId, count);
	tabCounts.set(tabId, tabFrames);
}

function resetTabCount(tabId) {
	if (tabCounts.has(tabId)) {
		tabCounts.set(tabId, new Map());
	}
}

function getTabCount(tabId) {
	var count = 0
	var tabFrames = tabCounts.get(tabId);
	for (let frameCount of tabFrames.values()) {
		count += frameCount;
	}
	return count;
}

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
	browser.action.setBadgeText(badgeOptions);
}

function setBadgeColor(tabId, color) {
	browser.action.setBadgeBackgroundColor({
		tabId: tabId,
		color: color
	});
}

function setTotalCount(tabId, frameId, count) {
	log('setTotalCount', { tabId, frameId, count });
	getState().then(function (state) {
		setBadgeColor(tabId, colors.good);
		addTabFrameCount(tabId, frameId, count);
		setBadgeCount(tabId, state.isCensoringActive ? getTabCount(tabId) : '');
	});
}


///// LIFECYCLE /////

function ensureTabStatus(tabId) {
	log('ensureTabStatus', tabId);
	getState().then(function (state) {
		browser.tabs.sendMessage(tabId, {
			msg: state.isCensoringActive ? 'setActive' : 'setInactive'
		});
	});
}

function saveState() {
	log('saveState', state);
	browser.storage.local.set({ state });
}

function getState() {
	log('getState, hasLocal =', hasLocalState);
	if (hasLocalState) {
		return Promise.resolve(state);
	}
	return restoreState();
}

function restoreState() {
	try {
		log('restoreState, hasLocal =', hasLocalState);
		var promise = browser.storage.local.get({ state }).then(function (data) {
			state = data.state;
			hasLocalState = true;
			log('restoreState, got local', state);
			return state;
		});
		return promise;
	} catch (e) {
		log('restoreState FAILED, state =', state);
		return Promise.reject(e);
	}
}

function contentScriptMessageHandler(request, sender, sendResponse) {
	if (sender.tab && request.msg) {
		log('%cruntime.onMessage', 'color:green;font-weight:bold', request, sender);
		switch (request.msg) {
			case 'isGlobalActive':
				getState().then(function (state) {
					log('  [response]:', state.isCensoringActive);
					sendResponse({ isActive: state.isCensoringActive });
				});
				return true; // Needed to keep `sendResponse` alive async
			case 'totalRedacted':
				setTotalCount(sender.tab.id, sender.frameId, request.count);
				break;
		}
	}
}

function tabLoadingHandler(tabId, changeInfo) {
	log('tabLoadingHandler', tabId, changeInfo);
	// Reset counts when a tab loads a new page, to ensure old iframe counts are cleared
	if (changeInfo.status === 'loading') {
		resetTabCount(tabId);
	}
}

browser.runtime.onMessage.addListener(contentScriptMessageHandler);
browser.tabs.onActivated.addListener(function (activeInfo) {
	ensureTabStatus(activeInfo.tabId);
});
browser.tabs.onUpdated.addListener(tabLoadingHandler);

log('--- service worker loaded ---');
restoreState();


///// USER ACTIONS /////

function toggleStatus() {
	log('toggleStatus, wait for state');
	getState().then(function () {
		state.isCensoringActive = !state.isCensoringActive;
		log('toggleStatus, active =', state.isCensoringActive);
		browser.tabs.query({ active: true }).then(function (tabs) {
			tabs.forEach(function (tab) {
				ensureTabStatus(tab.id);
			});
		});
		browser.action.setTitle({
			title: actionTitle[state.isCensoringActive ? 'active' : 'inactive']
		});
		if (state.isCensoringActive) {
			log('===ADD===')
			browser.tabs.onUpdated.addListener(tabLoadingHandler);
		} else {
			log('===REMOVE===')
			browser.tabs.onUpdated.removeListener(tabLoadingHandler);
		}
		saveState();
	});
}

browser.action.onClicked.addListener(toggleStatus);

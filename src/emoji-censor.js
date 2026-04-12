var emojiCensor = (function () {

	var eggsports = {
		version: '1.4.0'
	};


	/**
	 * Dependency: emoji-regex-xs v2.0.1 (c) Steven Levithan
	 * https://www.npmjs.com/package/emoji-regex-xs
	 *
	 * This is a looser interpretation of the Unicode specification than the `emoji-regex` package
	 * originally used for this project. I ended up having to use a modified fork of `emoji-regex`
	 * for each release in order to catch some real-world uses that didn't strictly match the spec.
	 *
	 * `emoji-regex-xs` does end up catching some symbols that I don't want (because most people
	 * don't really count them as "emoji" - e.g. © and ™). But this is worth the trade-off of not
	 * having to keep updating this dependency every time there's a new Unicode version release.
	 */
	function emojiRegex() {
		var r = String.raw;
		var base = r`\p{Emoji}(?:\p{EMod}|[\u{E0020}-\u{E007E}]+\u{E007F}|\uFE0F?\u20E3?)`;
		return new RegExp(r`\p{RI}{2}|(?![#*\d](?!\uFE0F?\u20E3))${base}(?:\u200D${base})*`, 'gu');
	}


	/***************
	 *    UTILS    *
	 ***************/

	function emojiRegexGroup() {
		var regex = emojiRegex();
		return new RegExp('(' + regex.source + ')', regex.flags);
	}

	function hasEmoji(text) {
		return emojiRegex().test(text);
	}

	function splitText(text) {
		var parts = String(text).split(emojiRegexGroup());
		return parts.map(function (part, i) {
			return {
				text: part,
				isEmoji: i % 2 === 1
			}
		});
	}

	var excludeRedaction = {
		'INPUT': true,
		'SELECT': true,
		'OPTION': true,
		'TEXTAREA': true,
		'STYLE': true,
		'SCRIPT': true,
		'IFRAME': true,
	};
	function isRedactable(textNode) {
		var parent = textNode.parentNode;
		if (!parent) return false;
		return !excludeRedaction.hasOwnProperty(parent.nodeName);
	}

	function hasBeenRedacted(node) {
		return node.parentNode && node.parentNode.classList.contains(classes.redacted);
	}

	function getElementArray(elemsOrSelector, rootNode) {
		var elems;
		if (typeof elemsOrSelector === 'string' || elemsOrSelector instanceof String) {
			elems = (rootNode || document).querySelectorAll(elemsOrSelector);
		} else if (Array.isArray(elemsOrSelector) || elemsOrSelector instanceof NodeList) {
			elems = elemsOrSelector;
		} else {
			elems = [elemsOrSelector];
		};
		return Array.prototype.slice.call(elems);
	}

	eggsports.hasEmoji = hasEmoji;
	eggsports.splitText = splitText;



	/***********************
	 *    DOM REDACTION    *
	 ***********************/

	var classes = {
		wrapped: 'emoji-censor-wrapped',
		redacted: 'emoji-censor-redacted',
		blackout: 'emoji-censor-redacted-blackout',
	};

	// The laziest way to allow users to override default styles while not messing
	// around with forcing people to include a separate CSS file.
	var stylesheet;
	function addStyles() {
		var stylesheetId = 'emoji-censor-default-styles';
		if (stylesheet || (stylesheet = document.getElementById(stylesheetId))) {
			return;
		}
		stylesheet = document.createElement('style');
		stylesheet.id = stylesheetId;
		stylesheet.textContent =
			'.' + classes.redacted + ' { display: inline-block; position: relative; }\n' +
			'.' + classes.blackout + ' { display: none; background-color: black; position: absolute; left: -1px; top: 0; width: calc(100% + 2px); height: 100%; }\n' +
			'.' + classes.redacted + ' .' + classes.blackout + ' { display: inline-block; }';
		// Insert the node before any other styles so users can override them if necessary
		var referenceNode = document.querySelector('link, style');
		if (referenceNode) {
			referenceNode.parentNode.insertBefore(stylesheet, referenceNode);
		} else {
			document.head.appendChild(stylesheet);
		}
	}

	var wrapTagName = 'span';
	var wrapClassName = classes.wrapped;

	function wrapText(node, blocks) {
		var origText = node.textContent;
		var textIndex = 0;

		var doc = node.ownerDocument;
		var frag = doc.createDocumentFragment();
		var subTextNode = function (start, end) {
			return doc.createTextNode(origText.substring(start, end));
		};

		var wrappers = [];
		blocks.forEach(function (block) {
			var wrapper = doc.createElement(wrapTagName);
			wrapper.textContent = block.text;
			wrapper.className = wrapClassName;
			frag.appendChild(subTextNode(textIndex, block.index));
			frag.appendChild(wrapper);
			textIndex = block.index + block.text.length;
			wrappers.push(wrapper);
		});
		if (textIndex < origText.length) {
			frag.appendChild(subTextNode(textIndex, origText.length));
		}

		node.parentNode.replaceChild(frag, node);
		return wrappers;
	}

	function wrapWholeNode(node) {
		var wrapper = node.ownerDocument.createElement(wrapTagName);
		wrapper.className = wrapClassName;
		var parent = node.parentNode;
		parent.replaceChild(wrapper, node);
		wrapper.appendChild(node);
		return wrapper;
	}

	function wrapNodeEmoji(node) {
		var text = node.textContent;
		var blocks = [];
		var match;
		var regex = emojiRegex();
		while ((match = regex.exec(text)) !== null) {
			blocks.push({
				text: match[0],
				index: match.index
			});
		}

		if (!blocks.length) {
			return [];
		}
		return wrapText(node, blocks);
	}

	function wrapAllEmoji(selector, options) {
		if (!selector) return [];
		options = options || {};

		var NF = window.NodeFilter;
		var whatToShow = NF.SHOW_TEXT;
		var nodeList = [];

		getElementArray(selector, options.rootNode).forEach(function (elem) {
			// Set up a DOM node walker for all text nodes in this element
			var walker = elem.ownerDocument.createTreeWalker(elem, whatToShow, {
				acceptNode: function (node) {
					return isRedactable(node) && hasEmoji(node.textContent) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
				}
			});
			var node;
			while ((node = walker.nextNode())) {
				// Don't re-add this node if it's already queued to be processed,
				// or if it's already part of a redaction
				if (node.emojiCensorQueued || hasBeenRedacted(node)) {
					continue;
				}
				// Add this node to the list and mark it as queued for processing
				nodeList.push(node);
				node.emojiCensorQueued = true;
			}
		});

		var redactedNodes = nodeList.map(wrapNodeEmoji).reduce(function (m, a) {
			return m.concat(a);
		}, []);

		if (options.customDisplayElements) {
			var extraNodes = getElementArray(options.customDisplayElements, options.rootNode)
				.filter(function (node) {
					return !hasBeenRedacted(node);
				}).map(wrapWholeNode);
			redactedNodes = redactedNodes.concat(extraNodes);
		}

		return redactedNodes;
	}

	function redactElements(selector, options) {
		var wrapped = wrapAllEmoji(selector, options);
		if (!wrapped.length) {
			return wrapped;
		}

		addStyles();
		wrapped.forEach(function (node, i) {
			var span = node.ownerDocument.createElement('span');
			span.className = classes.blackout;
			node.classList.add(classes.redacted);
			node.appendChild(span);
		});

		return wrapped;
	}

	function redactedCount(options) {
		options = options || {};
		return (options.rootNode || document).querySelectorAll('.' + classes.redacted).length;
	}

	eggsports.redactElements = redactElements;
	eggsports.redactioAdAbsurdum = redactElements;
	eggsports.redactedCount = redactedCount;



	/*************************
	 *    AUDIO CENSORING    *
	 *************************/

	var synth = window.speechSynthesis;
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	function isAudioSupported() {
		return typeof synth !== 'undefined' &&
			typeof SpeechSynthesisUtterance !== 'undefined' &&
			typeof AudioContext !== 'undefined';
	}


	///// TEXT-TO-SPEECH

	function speak(text, onFinished, onError) {
		var utter = new SpeechSynthesisUtterance(text);
		// It's about here that I should add support for controlling the language and/or
		// voice via options, but for now just leave it with browser/system defaults.
		utter.onend = function () {
			onFinished();
		};
		utter.onerror = function (event) {
			onError(event.error);
		};
		synth.speak(utter);
		return {
			stop: function () {
				synth.cancel();
			}
		}
	}


	///// CENSORSHIP BEEPS

	var audioCtx, gainNode;

	// Lazily instantiated
	function ensureContext() {
		if (!audioCtx) {
			audioCtx = new AudioContext();
		}
		if (!gainNode) {
			gainNode = audioCtx.createGain();
			gainNode.gain.value = 0.5;
			gainNode.connect(audioCtx.destination);
		}
	}

	function playBleep(charLength, onFinished, onError) {
		var millis = charLength * 200;
		try {
			var osc = audioCtx.createOscillator();
			osc.frequency.value = 1000;
			osc.connect(gainNode);
			osc.start();
			setTimeout(function () {
				osc.stop();
				onFinished();
			}, millis);
			return {
				stop: function () {
					osc.stop();
				}
			}
		} catch (e) {
			onError(e.message);
		}
	}


	///// CONTROLLER

	function speakCensored(text, onFinished) {
		var finish = function () {
			if (onFinished) {
				onFinished();
			}
		}

		if (!isAudioSupported() || typeof text !== 'string') {
			console.warn('[emoji-censor] Cannot speak censored text as some required audio APIs are not found.');
			finish();
			return;
		}
		ensureContext();
		var parts = splitText(text);
		var curIndex = 0;
		var curPlayer;
		var shouldContinue = true;

		var stopSpeaking = function () {
			shouldContinue = false;
			if (curPlayer && curPlayer.stop) {
				curPlayer.stop();
			}
			finish();
		};

		// RIP Bill Paxton
		var gameOverMan = function (verbing, text) {
			return function (error) {
				console.error('[emoji-censor] There was an error when ' + verbing + ' the text "' + text + '":', error);
			};
		};

		var playPart = function (part) {
			if (part.isEmoji) {
				curPlayer = playBleep(part.text.length, next, gameOverMan('censoring', part.text));
			} else if (part.text !== '') {
				curPlayer = speak(part.text, next, gameOverMan('speaking', part.text));
			} else {
				next();
			}
		};

		var next = function () {
			if (shouldContinue) {
				if (curIndex < parts.length) {
					playPart(parts[curIndex++]);
				} else {
					finish();
				}
			}
		};

		next();

		return {
			stop: stopSpeaking
		}
	}

	eggsports.isAudioSupported = isAudioSupported;
	eggsports.speakCensored = speakCensored;

	return eggsports;

})();

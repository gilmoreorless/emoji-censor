var emojiCensor = (function () {

	var eggsports = {};


	/**
	 * Dependency: emoji-regex v6.4.1 (c) Mathias Bynens
	 * https://www.npmjs.com/package/emoji-regex
	 *
	 * Lazy copy-pasta of a simple function to avoid having to stuff around with build systems.
	 */
	function emojiRegex() {
		// https://mathiasbynens.be/notes/es-unicode-property-escapes#emoji
		return (/\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|\uD83D\uDC68(?:\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68)|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|(?:\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uFE0F\u200D[\u2640\u2642])\uFE0F|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|[#\*0-9]\uFE0F\u20E3|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F/g
		);
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

	eggsports.hasEmoji = hasEmoji;
	eggsports.splitText = splitText;



	/***********************
	 *    DOM REDACTION    *
	 ***********************/

	var classes = {
		wrapped: 'emoji-wrapped',
		redacted: 'emoji-censor-redacted',
		blackout: 'emoji-censor-redacted-blackout',
	};

	// The laziest way to allow users to override default styles while not messing
	// around with forcing people to include a separate CSS files.
	var stylesheet;
	function addStyles() {
		if (stylesheet) {
			return;
		}
		stylesheet = document.createElement('style');
		stylesheet.id = 'emoji-censor-default-styles';
		stylesheet.textContent =
			'.' + classes.redacted + ' { display: inline-block; position: relative; }\n' +
			'.' + classes.blackout + ' { display: inline-block; background-color: black; position: absolute; left: -1px; top: 0; }\n';
		// Insert the node before any other styles so users can override them if necessary
		var referenceNode = document.querySelector('link, style');
		if (referenceNode) {
			referenceNode.parentNode.insertBefore(stylesheet, referenceNode);
		} else {
			document.head.appendChild(stylesheet);
		}
	}

	function wrapText(node, blocks, tagName, className) {
		if (tagName === undefined) tagName = 'span';
		if (className === undefined) className = classes.wrapped;
		var origText = node.textContent;
		var textIndex = 0;

		var doc = node.ownerDocument;
		var frag = doc.createDocumentFragment();
		var subTextNode = function (start, end) {
			return doc.createTextNode(origText.substring(start, end));
		};

		var wrappers = [];
		blocks.forEach(function (block) {
			var wrapper = doc.createElement(tagName);
			wrapper.textContent = block.text;
			wrapper.className = className;
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

	function wrapAllEmoji(selector) {
		if (!selector) return [];

		var NF = window.NodeFilter;
		var whatToShow = NF.SHOW_TEXT;
		var nodeList = [];

		var elems = selector instanceof HTMLElement ? [selector] : document.querySelectorAll(selector);
		Array.prototype.forEach.call(elems, function (elem) {
			// Set up a DOM node walker for all text nodes in this element
			var walker = elem.ownerDocument.createTreeWalker(elem, whatToShow, {
				acceptNode: function (node) {
					return hasEmoji(node.textContent) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
				}
			});
			while ((node = walker.nextNode())) {
				// Don't re-add this node if it's already queued to be processed
				if (node.emojiCensorQueued) {
					continue;
				}
				// Skip this node if it's already part of a redaction
				if (node.parentNode && node.parentNode.classList.contains(classes.redacted)) {
					continue;
				}
				// Add this node to the list and mark it as queued for processing
				nodeList.push(node);
				node.emojiCensorQueued = true;
			}
		});

		return nodeList.map(wrapNodeEmoji).reduce(function (m, a) {
			return m.concat(a);
		}, []);
	}

	function redactElements(selector) {
		var wrapped = wrapAllEmoji(selector);
		if (!wrapped.length) {
			return wrapped;
		}

		// Grab all dimensions in one pass to avoid layout thrashing
		var dims = wrapped.map(function (node) { return node.getBoundingClientRect(); });

		addStyles();
		wrapped.forEach(function (node, i) {
			var width = dims[i].width + 2;
			var height = dims[i].height;
			var span = node.ownerDocument.createElement('span');
			span.className = classes.blackout;
			span.style.width = width + 'px';
			span.style.height = height + 'px';
			node.classList.add(classes.redacted);
			node.appendChild(span);
		});

		return wrapped;
	}

	eggsports.redactElements = redactElements;
	eggsports.redactioAdAbsurdum = redactElements;



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
		} catch (e) {
			onError(e.message);
		}
	}


	///// CONTROLLER

	function speakCensored(text) {
		if (!isAudioSupported() || typeof text !== 'string') {
			console.warn('[emoji-censor] Cannot speak censored text as some required audio APIs are not found.');
			return;
		}
		ensureContext();
		var parts = splitText(text);
		var curIndex = 0;

		// RIP Bill Paxton
		var gameOverMan = function (verbing, text) {
			return function (error) {
				console.error('[emoji-censor] There was an error when ' + verbing + ' the text "' + text + '":', error);
			};
		};

		var playPart = function (part) {
			if (part.isEmoji) {
				playBleep(part.text.length, next, gameOverMan('censoring', part.text));
			} else if (part.text !== '') {
				speak(part.text, next, gameOverMan('speaking', part.text));
			} else {
				next();
			}
		};

		var next = function () {
			if (curIndex < parts.length) {
				playPart(parts[curIndex++]);
			}
		};

		next();
	}

	eggsports.isAudioSupported = isAudioSupported;
	eggsports.speakCensored = speakCensored;

	return eggsports;

})();

(function() {
	var dom = {
		input: document.getElementById('text-input'),
		optTranslate: document.getElementById('use-emoji-translate'),
		output: document.getElementById('text-output'),
		link: document.getElementById('abraham-link-on'),
		play: document.getElementById('radio-gag-gag'),
	};

	var useTranslate = false;
	var currentText = '';

	function toggleUseTranslate() {
		useTranslate = dom.optTranslate.checked;
		setOutput();
	}

	function debounce(fn, waitTime) {
		var timeout;

		var actualFn = function (args) {
			timeout = undefined;
			fn.apply(this, args);
		};

		return function () {
			if (timeout) {
				clearTimeout(timeout);
			}
			var args = Array.prototype.slice.call(arguments);
			timeout = setTimeout(actualFn.bind(this), waitTime, args);
		}
	}

	function translateText(text) {
		var words = text.split(' ').map(function (word) {
			if (!word.length) return word;
			var cleanWord = word.replace(/\W/g, '');
			var translated = emojiTranslate.getMeAnEmoji(cleanWord);
			if (!translated.length) return word;
			return word.replace(cleanWord, translated[0]);
		});
		return words.join(' ');
	}

	function encode(str) {
		return encodeURIComponent(str).replace(/%20/g, '+');
	}

	function generateLink() {
		var params = ['text=' + encode(dom.input.value)];
		if (useTranslate) {
			params.push('translate=true');
		}
		return '#' + params.join('&');
	}

	function parseUrlParams() {
		var result = {
			text: '',
			translate: false
		};

		if (URLSearchParams !== undefined) {
			var params = new URLSearchParams(location.hash.substr(1));
			result.text = params.get('text') || '';
			result.translate = params.get('translate') === 'true';
		} else {
			var pairs = location.hash.substr(1).split('&');
			pairs.forEach(function (pair) {
				var parts = pair.split('=');
				if (parts[0] === 'text' && !result.text.length) {
					result.text = decodeURIComponent(parts[1].replace(/\+/g, '%20'));
				}
				if (parts[0] === 'translate' && parts[1] === 'true') {
					result.translate = true;
				}
			});
		}
		return result;
	}

	function setOutput() {
		var fragment = document.createDocumentFragment();
		var lines = dom.input.value.split(/(\n)/g);
		currentText = lines.map(function (line) {
			if (line === '\n') {
				fragment.appendChild(document.createElement('br'));
			} else if (line.length) {
				if (useTranslate) {
					line = translateText(line);
				}
				fragment.appendChild(document.createTextNode(line));
			}
			return line;
		}).join('');
		dom.output.innerHTML = '';
		dom.output.appendChild(fragment);
		dom.link.hash = generateLink(currentText);
		emojiCensor.redactElements(dom.output);
	}

	var currentPlayer;
	function playIt() {
		if (currentPlayer) {
			currentPlayer.stop();
		}
		if (currentText.length) {
			currentPlayer = emojiCensor.speakCensored(currentText, function () {
				currentPlayer = null;
			});
		}
	}

	function setupFromUrl(isChange) {
		var params = parseUrlParams();
		if (params.text) {
			dom.input.value = params.text;
		} else if (isChange) {
			dom.input.value = '';
		}
		if (params.translate) {
			dom.optTranslate.checked = useTranslate = true;
		} else if (isChange) {
			dom.optTranslate.checked = useTranslate = false;
		}
		setOutput();
	}

	dom.input.addEventListener('input', debounce(setOutput, 500));
	dom.optTranslate.addEventListener('change', toggleUseTranslate);

	if (emojiCensor.isAudioSupported()) {
		dom.play.addEventListener('click', playIt);
	} else {
		document.body.classList.add('audio-test-failed');
	}

	// Enable the emoji-translate option once its data has been loaded
	document.addEventListener('emoji-ready', function () {
		dom.optTranslate.disabled = false;
		if (useTranslate) {
			setOutput();
		}
	});

	// Initial censoring of the page, but run after page load to allow text/emoji to finish rendering
	window.addEventListener('load', function () {
		setupFromUrl();
		emojiCensor.redactElements('h1, footer');
	});

	window.addEventListener('hashchange', function () {
		setupFromUrl(true);
	});

	// Yup, I still like to know if anyone actually visits my sites
	if (~location.hostname.indexOf('github.io')) {
		var ga = window.ga = function () {
			ga.q.push(arguments);
		};
		ga.q = [
			['create', 'UA-8341018-3', 'auto'],
			['send', 'pageview']
		];
		ga.l = +new Date();
		// Make sure to load GA script after page load
		window.addEventListener('load', function () {
			var s = document.createElement('script');
			s.src = 'https://ssl.google-analytics.com/analytics.js';
			document.body.appendChild(s);
		}, false);
	}

})();

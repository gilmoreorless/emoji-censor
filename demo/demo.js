(function() {
	var dom = {
		input: document.getElementById('text-input'),
		output: document.getElementById('text-output'),
		play: document.getElementById('radio-gag-gag'),
	};

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

	function setOutput() {
		var fragment = document.createDocumentFragment();
		var lines = dom.input.value.split(/(\n)/g);
		lines.forEach(function (line) {
			if (line === '\n') {
				fragment.appendChild(document.createElement('br'));
			} else if (line.length) {
				fragment.appendChild(document.createTextNode(line));
			}
		});
		dom.output.innerHTML = '';
		dom.output.appendChild(fragment);
		emojiCensor.redactElements(dom.output);
	}

	function playIt() {
		var text = dom.input.value;
		if (text.length) {
			emojiCensor.speakCensored(text);
		}
	}

	dom.input.addEventListener('input', debounce(setOutput, 500));

	if (emojiCensor.isAudioSupported()) {
		dom.play.addEventListener('click', playIt);
	} else {
		document.body.classList.add('audio-test-failed');
	}

	setOutput();
	emojiCensor.redactElements('h1, footer');

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

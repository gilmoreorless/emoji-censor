var synth = speechSynthesis;
function speak(text, onFinished) {
    var utter = new SpeechSynthesisUtterance(text);
    utter.onend = function () {
        onFinished();
    };
    // TODO: Handle errors
    synth.speak(utter);
}


var audioContext = new AudioContext();
var gainNode = audioContext.createGain();
gainNode.gain.value = 0.5;
gainNode.connect(audioContext.destination);

function playBeep(charLength, onFinished) {
    var millis = charLength * 100;
    var osc = audioContext.createOscillator();
    osc.frequency.value = 900;
    osc.connect(gainNode);
    osc.start();
    setTimeout(function () {
        osc.stop();
        onFinished();
    }, millis);
}

function speakRedacted(text) {
    var parts = redacter.splitText(text);
    var curIndex = 0;

    var playPart = function (part) {
        if (part.isEmoji) {
            playBeep(part.text.length, next);
        } else if (part.text !== '') {
            speak(part.text, next);
        } else {
            next();
        }
    };

    var next = function () {
        if (curIndex < parts.length) {
            playPart(parts[curIndex++]);
        }
    };

    console.log(parts);
    next();
}

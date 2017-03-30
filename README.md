# Emoji Censor

A script to censor out any emoji characters in a piece of text, either visually or audibly.

## Why would anyone want such a thing?

Maybe you’re a curmudgeon like me. Maybe you just think it would have tremendous comedic value.

Really, this all started with a tweet from [Ben Buchanan](http://weblog.200ok.com.au/):

> Fun game: mentally replace all emoji with a censorship bleep.
>
> — Ben Buchanan (@200okpublic) [March 14, 2017](https://twitter.com/200okpublic/status/841555205833469953)

The best way to describe it properly is to just link to the demo, so go play with it: [gilmoreorless.github.io/emoji-censor](https://gilmoreorless.github.io/emoji-censor/)


## Usage

Include the `emoji-censor.js` file into your project – the API sits on a global variable named `emojiCensor`.

### `speakCensored(text)`

Uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) and [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to speak the provided text out loud. Any emoji characters are replaced with a [censorship bleep](https://en.wikipedia.org/wiki/Bleep_censor).

For example:

```js
emojiCensor.speakCensored('What a nice cat. 🐱');
```

This will announce `"What a nice cat. [bleep]"` using text-to-speech synthesis.

### `redactElements(selector)`

Applies [redaction](https://en.wikipedia.org/wiki/Sanitization_(classified_information)) to HTML elements by blacking out emoji characters.

The `selector` argument is any valid CSS selector that can be passed to `document.querySelectorAll()`.

```js
// Example: This will black out any emoji within `.content` and its children.
emojiCensor.redactElements('.content');
```

This API is also aliased as `emojiCensor.redactioAdAbsurdum()`, purely because I liked the pun.

### Utilities

There are some simple utility methods that are required to make the main methods work, exposed on the API for convenience.

#### `hasEmoji(text)`

Tests if the provided `text` contains emoji characters, returning a boolean. This is just a wrapper around the [emoji-regex](https://github.com/mathiasbynens/emoji-regex) library.

```js
emojiCensor.hasEmoji('Approved ✔');  // false
emojiCensor.hasEmoji('Approved ✅');  // true
```

#### `splitText(text)`

Splits the given `text` into an array of parts based on the location of emoji characters. Each member of the array is an object containing two properties:

* `isEmoji` – (`boolean`) `true` if the text is an emoji character, `false` otherwise
* `text` – (`string`) the text content of the part

```js
emojiCensor.splitText('Hi there. 👋🏼 Nice to meet you.');
/*
 * Return value:
 *
 * [
 *   { isEmoji: false, text: 'Hi there. ' },
 *   { isEmoji: true,  text: '👋🏼' },
 *   { isEmoji: false, text: ' Nice to meet you.' }
 * ]
 */
```

#### `isAudioSupported()`

Returns a boolean indicating if speaking censored text is supported in the user’s browser.


## Credits

This code is open source under the [MIT license](LICENSE) – © Gilmore Davidson.

Emoji detection is provided by the [emoji-regex](https://github.com/mathiasbynens/emoji-regex) library, thanks to the tireless efforts of Mathias Bynens to improve the state of Unicode handling in JavaScript.

And, of course, thanks to Ben for sparking the idea in the first place. Stop providing me with distractions, dammit! 😉

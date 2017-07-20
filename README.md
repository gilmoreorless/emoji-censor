# Emoji Censor

A script to censor out any emoji characters in a piece of text, either visually or audibly.

## Why would anyone want such a thing?

Maybe you’re a curmudgeon like me. Maybe you just think it would have tremendous comedic value.

Really, this all started with a tweet from [Ben Buchanan](http://weblog.200ok.com.au/):

> Fun game: mentally replace all emoji with a censorship bleep.
>
> — Ben Buchanan (@200okpublic) [March 14, 2017](https://twitter.com/200okpublic/status/841555205833469953)

The best way to describe it properly is to just link to the demo, so go play with it: [gilmoreorless.github.io/emoji-censor](https://gilmoreorless.github.io/emoji-censor/)

You can also try it as a browser extension, to visually block out all emoji as you browse the web.
It’s available for [Chrome][ext-chrome] and [Firefox][ext-firefox].

[ext-chrome]: https://chrome.google.com/webstore/detail/emoji-censor/heceohcbaahlibmaeheomnkpmhnggnld
[ext-firefox]: https://addons.mozilla.org/addon/emoji-censor/


## Usage

Include the `emoji-censor.js` file into your project – the API sits on a global variable named `emojiCensor`.

### `speakCensored(text)`

Uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) and [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to speak the provided text out loud. Any emoji characters are replaced with a [censorship bleep](https://en.wikipedia.org/wiki/Bleep_censor).

For example:

```js
emojiCensor.speakCensored('What a nice cat. 🐱');
```

This will announce `"What a nice cat. [bleep]"` using text-to-speech synthesis.

### `redactElements(elementsOrSelector[, options])`

Applies [redaction](https://en.wikipedia.org/wiki/Sanitization_(classified_information)) to HTML elements by blacking out emoji characters.

The `elementsOrSelector` argument determines which elements to redact. It can be:

* A single DOM element.
* An array or `NodeList` of DOM elements.
* A string of any valid CSS selector that can be passed to `document.querySelectorAll()`.

An `options` object can also be provided for additional functionality.
Currently there is only one option — `customDisplayElements`. This is an `elementsOrSelector`-style value that determines extra elements to redact.
This is different from the main arguments as these elements are wholly redacted — no text substitution is performed. This is useful for sites that use custom image fallbacks instead of emoji text characters, where the whole image has to be redacted.

```js
// Example: This will black out any emoji within `.content` and its children.
emojiCensor.redactElements('.content');

// Example for a site using custom images instead of text
emojiCensor.redactElements('.article', { customDisplayElements: 'img.custom-emoji' });
```

This API is also aliased as `emojiCensor.redactioAdAbsurdum()`, purely because I liked the pun.

### `redactedCount()`

Returns the number of redacted emoji characters found in the current `document`.

```js
emojiCensor.redactedCount();
// 12
```

### Utilities

There are some simple utility methods that are required to make the main methods work, exposed on the API for convenience.

#### `hasEmoji(text)`

Tests if the provided `text` contains emoji characters, returning a boolean. This is just a wrapper around the [emoji-regex](https://github.com/mathiasbynens/emoji-regex) library.

**Technical note:** This script matches all characters that are listed by the [Unicode Technical Report #51](http://www.unicode.org/reports/tr51/) as having the property `Emoji=yes`. These characters may or may not appear as coloured glyphs, it entirely depends on your browser and operating system.
The only exception is that I have deliberately excluded the following characters: `0`-`9` (all numbers), `#`, `*`, `©`, `®`, `™`.

```js
emojiCensor.hasEmoji('⦿ Selected');  // false
emojiCensor.hasEmoji('🔘 Selected');  // true
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

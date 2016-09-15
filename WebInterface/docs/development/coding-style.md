# Coding Style

These are the style guidelines for coding mesonet-js.

!! Say something about the jslint/jshint process here


## JavaScript

* Write [strict](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) JavaScript style.
* Use 4 spaces for indentation, __No tabs__.
* File names should be concatenated with `-` instead of `_`, e.g. `file-name.js` rather than `file_name.js`.
* Do not use ES6, use only ES5 JavaScript (We are working on upgrading to a full Node.js/ES6 version later)
* Use C style comments.
* Try to limit lines of code to 80 characters.

## Naming Things

- Use `camelCase` for nearly all things.
- Private functions are prefixed with `_`, i.e. `_responseHandler`.

When creating a new API, it is preferred to use getters and setters. For example, `.getText()` and `.setText(text)` are preferred to `.text([text])`.

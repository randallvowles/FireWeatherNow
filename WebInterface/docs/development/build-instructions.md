# Build instructions

## Prerequisites

You'll need __npm__ and __gruntjs__ installed in order to build this library.

### Installing Node.js (npm)

Assuming you have "brew" installed:
```
brew install node
```

### Install Grunt
```
npm install -g grunt-cli
```

Then install the following Grunt packages

```
npm install grunt --save-dev
npm install grunt-cli --save-dev
npm install grunt-strip-code --save-dev
npm install grunt-contrib-uglify --save-dev
npm install grunt-contrib-jshint --save-dev
npm install grunt-contrib-clean --save-dev
npm install grunt-import --save-dev
npm install grunt-jsbeautifier --save-dev
```

Now just run `grunt` !

## Compiling the library

From here you can build the code by `grunt` from the command line.


## About version numbers

Versioning for this project in general follows the [Semantic Versioning 2.0.0](http://semver.org) schema. This only caveat to this is we will consider all __odd__ minor numbers as a stable release whereas an __even__ number is a unstable and intended for testing.

- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards-compatible manner, and
- PATCH version when you make backwards-compatible bug fixes.
- CODENAME Code name of the release, such as "coffee-cup".

For example `0.1.1` would be considered stable with a single patch fix. Version `0.2.0` is considered unstable and is for developers and testing.

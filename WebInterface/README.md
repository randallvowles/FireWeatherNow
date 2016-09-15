[![Build Status](https://travis-ci.com/adamabernathy/MesonetJS.svg?token=intXpzBqxVUzrnuyQi3j&branch=master)](https://travis-ci.com/adamabernathy/MesonetJS)

# MesonetJS

__MesonetJS__ is a JavaScript interface designed to work with [MesoWest/SynopticLabs Mesonet API](http://synopticlabs.org/api/mesonet/).  Our current version is limited to only our commonly used services.  We plan on having a full function platform available soon.

Made with :heart: by [SynopticLabs](http://www.synopticlabs.org)

## Installing

For the latest stable version:

```shell
npm install mesonet --save-dev
```

For development builds, see the [`dev` branch on GitHub](https://github.com/mesowx/mesonet-js/tree/dev)

## Usage / quick start

You need to source jQuery first.

```javascript
/* Create a new class object */
var M = new mesonet();

/*
 * Assuming we take all the query string parameters, we can just
 * set the API token and move on.
 */
M.setApiToken("6eee5fabf5ce409d91047c0fc8aedb96");
/* These are async managed via the library */
M.fetch();

/*
 * If you want to use the API response outside of our methods,
 * you need to manage your own async processes. We make this
 * easy by using the .async() method
 */
var ready = M.async();
$.when(ready).done(function() {
    // Do something with the data
});
```

## Contribute

If you would like to [contribute](CONTRIBUTING.md), you can help in several ways:
* Submit bugs and help us test fixes
* Discuss with other users on StackOverflow
* Submit a feature
* Build your own plugin and tell us about it!

## Documentation

* Quick start
* API interface
* Examples
* Building instructions

## Building (from source)

In order to build MesonetJS from source, you'll need [Git](http://git-scm.com/downloads) and [Node.js](http://nodejs.org/) installed.

Clone a copy of the repo:

```
git clone https://github.com/mesowx/mesonetjs.git
```

Move into the directory:

```shell
cd mesonetjs
```

For Mac users, run the `install_node_packages.sh` script.

```shell
grunt
```

## Versioning schema

Versioning for this project in general follows the [Semantic Versioning 2.0.0](http://semver.org) schema. This only caveat to this is we will consider all __even__ minor numbers as a stable release whereas an __odd__ number is a unstable and intended for testing.

## Roadmap (maybe?)

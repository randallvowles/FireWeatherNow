# `windowArgs()`

> Returns the URL arguments

When using the `.fetch()` method, if no `queryParameters` are defined, `.fetch()` will, by default, use `.windowArgs()` method to collect the arguments from the URL.

```javascript
var M = new mesonet();
M.fetch(0); // Default fetch statement, will use `.windowArgs()`
```

# `async()`

> Method to keep tabs on the async processes

If you want to use the API response, you need to manage your own async processes. We make this easy by using the `.async()` method. This method will monitor all running functions and make sure that they all complete before moving on with the next lines of code.

Below is an example of how to call the `.async()` method and use it to control when code is able to be run.

```javascript
var ready = M.async();
$.when(ready).done(function() {
  // code to be run when all other scripts finish running
})
```         

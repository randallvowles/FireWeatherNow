# Quick start with MesonetJS

> How to get going!

MesonetJS allows MesoWest/SynopticLabs users to seamlessly access and integrate the Mesonet API data into web and node.js projects. This tutorial will help new users understand how to query the API data through this interface, how the response is formatted, and finally how to "do something" with the data.

Let's get started by building a simple web application to see how MesonetJS works!

## Adding MesonetJS to your project

Getting start is pretty easy, just source the library in your HTML header from:

```
http://dev2.mesowest.net/mesonetjs/mesonet-current.min.js
```

and in your JavaScript code, initialize a new instance by:

```javascript
var M = new mesonet();
```

> **Note**: All of our examples use `M` for our declarations. It is also important to note that in our examples we declare `M` in the global namespace so you can access it from your browser's developer tools. Clearly we do not recommend this for production code.

Once we've initiated our class, we will write a short handler function to configure and retrieve the Mesonet API request. To display the observation information for our chosen weather station, we will use the `makeTimeSeriesTable()` method to display an HTML table in the browser.

```javascript
/** Declare new instance of MesonetJS */
var M = new mesonet();

function main() {
    /**
     * Just like with any Mesonet API request
     * you must set API token to gain access to data
     */
    M.setApiToken("demotoken");
}
```

At this point we have to construct our query parameters. You are able to build your data query in countless ways. You can statically or programmatically configure the [`fetch()`](docs/api/fetch.md) method or you can use the internal functions to use a query string passed to the browser window.

Below is an example of statically setting the query parameters in the JavaScript code and using the fetch method:

```javascript
var queryParameters = {
    state: "UT",
    network: 153,
    recent: 60
};
M.fetch(queryParameters);
```

Similarly you could append the same query parameters to the html page url such as `example.html?state=ut&network=153` and then simply include in your script:

```javascript
M.fetch(0)
```

Regardless what method you use, the query parameters are the same as those for the Mesonet API. The default API service you are accessing with MesonetJS is the [timeseries service](http://synopticlabs.org/api/mesonet/reference/#stationstimeseries).

Any valid parameter for the Mesonet API are also valid when building your query for MesonetJS. It also follows that any mandatory parameters for the API are also mandatory for MesonetJS to function.

> The exception to this rule, is we **highly recommend** using the `.setApiToken()` method right after initialization. By doing this you are not required to pass the token in your `fetch()` arguments.

At this point we should have a something along the lines of

```html
<!DOCTYPE html>
<html>
<head>
    <title>Station Data</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
    <script src="http://dev2.mesowest.net/mesonejs/mesonet-current.min.js"></script>   

    <!-- Local JS code -->
    <script>
    var M = new mesonet();

    /** Main */
    function main() {

        M.setApiToken("your-api-token-here");
        var queryParameters = {
          state: "UT",
          network: 153,
          recent: 60
        };

        M.fetch(queryParameters)
      }
    </script>
</head>
<body onload="main();">
        <h1>Station Data in console</h1>
</body>
</html>
```

## Using the Mesonet API response

If following with the example above we are only able to see the data queried via your browser's developer tools. From the console you can inspect the `M` object.

Upon inspection you should have following elements of `M`:

Name        | Type  | Description
----        | ----  | -----------
config      | list  | Configuration options for the library
response    | list  | All the response information from the API and supplemental data

You will see that the `M.response.station[]` element has the same schema as the direct JSON response from the Mesonet API.

### Create a table from the query

Now that you are familiar with how to request data and the structure of the returned data, we will build a simple example of displaying a data table on the html page. The MesonetJS core library is equipped with primarily back-end functions to assist you in retrieving and preparing your data for use in applications, but we do include an intrinsic method to generate an HTML table to display retrieved time series data.

> We are working on standardizing a plugin framework to expand the overall library.

To make an HTML table, you will first need to add the following to your HTML file:

```html
<div id="tabular-data-container"></div>
```

then add some basic configuration information to your JavaScript code:

```javascript
var tableConfig = {  
  tableID: "tabular-data",
  stid: M.response.station[0].STID   
};
M.configureTable(tableConfig);
M.table();
```

At this point, your HTML page should display a HTML table for one of the stations in the MesoWest network. You may have noticed that the table headers automatically use the long names for the variables. MesonetJS automatically retrieves these from our variables service and does the matching for you. You can disable this by setting `M.config.fetch.longNames` to `false`.

From here, we can add some of the metadata information to our webpage. Since we have already have all this information in `M`, lets just use some JavaScript to update our webpage.

First we need to add the following to our HTML page, ideally above the table container.

```html
<h2>Station table for <span id="station-name"></span>
  <span id="station-id"></span></h2>

<h3>Location: <span id="latitude"></span> , <span id="longitude"></span></h3>
```

Since we use an AJAX call to get our data, we need to wait until all of our asynchronous calls come back. We include some handy tools to solve this problem for you. The `async()` method is further explained in the [methods documentation](need link), but long story short, when using non-intrinsic functions and the MesonetJS library, just wrap your code in the following statement:

> Future versions will be refactored to ES6 async/await methods to alleviate the need for jQuery dependency.

```JavaScript
var ready = M.async();
$.when(ready).done(function() {
    // Your code here!
});
```

To update our HTML page ...

```JavaScript
var ready = M.async();
$.when(ready).done(function() {
     document.getElementById("station-name").innerHTML = M.response.station[0].NAME;
     document.getElementById("station-id").innerHTML = M.response.station[0].STID;
     document.getElementById("latitude").innerHTML = M.response.station[0].LATITUDE;
     document.getElementById("longitude").innerHTML = M.response.station[0].LONGITUDE;
});
```

__Congratulations!__ You've built your first application using MesonetJS! At this point, you should have a webpage with a data table and basic information about the weather station displayed.

We've built MesonetJS for developers and researchers who want quick and reliable access to MesoWest/SynopticLabs data.

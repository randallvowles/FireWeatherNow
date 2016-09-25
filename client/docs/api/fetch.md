# `fetch()`

> Manages API calls and data processing

This method is the main process to gather information via the API.

You can pass your search parameters to the fetch method either by appending them to the page url or by setting them within the actual JavaScript. By default, fetch is accessing the API [timeseries service](http://synopticlabs.org/api/mesonet/reference/#stationstimeseries). You are able to change this default service with the `setService()` method before using `fetch()`:

```javascript
M.setService("Metadata")
```
The above line would change the default time-series service to the API metadata service. The available API services are [time-series](http://synopticlabs.org/api/mesonet/reference/#stationstimeseries), [metadata](http://synopticlabs.org/api/mesonet/reference/#stationsmetadata), [latest](http://synopticlabs.org/api/mesonet/reference/#stationslatest), and [qctypes](http://synopticlabs.org/api/mesonet/reference/#qctypes). The parameters you specify depend on the service you have set. Just as if you were building an API query, each service has its own required parameters. For example when using the default time-series service, you must pass a start/end or recent argument. Below is an example of using the `fetch()` method and setting the parameters within the JavaScript code:  

```javascript
var queryParameters = {
    state: "UT",
    network: 153,
    recent: 60
};
M.fetch(queryParameters);
```  

When using `fetch()` as a default query, JavaScript will get the arguments from the window with the `windowArgs()` ([documentation here](../mesonet.js/docs/windowargs)) method. If you wish to pass your own arguments, it can be done with the `fetch({})` command, where the object specified takes priority and returns only what is requested.


  Argument    | Description
  ---         | ---
  service     | Requested API service, defaults to time series
  apiToken    | User's Mesonet API token
  longNames   | Boolean, retrieve variable long names, default is true
  qcTypes     | Boolean, retrieves QC test names, default is true

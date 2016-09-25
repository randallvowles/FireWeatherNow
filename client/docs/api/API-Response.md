# API response

> Format of returned data

After completing a successful `fetch()`, the `mesonet` class returns an object named `response`. This `response` object contains all the data returned from the Mesonet API. This data can then be accessed using standard dictionary and array notation, depending on the type.

For example, if you had passed the following query:

```javascript
var queryParameters = {
  state: "UT",
  network: 153,
  recent: 60
};
M.fetch(queryParameters)
```
Then you could access all of the variables returned with `response.sensorStack[n]`. Alternatively, you can look up the index of a specific station using the `response.tableOfContents()` method, and then use that index to access the specific observations from the `station[]` array.




Response        | Type   | Description
---             | ---    | ---
tableOfContents | object | A list containing STID's and their associated `station[n]` index
station         | array  | A dictionary containing a list of values for each station (same schema as the direct JSON response from the Mesonet API)
sensorStack     | array  | An array listing all variables reported by each station
sensorLongNames | object | A dictionary response from the Mesonet variable service
summary         | object | The API response summary
units           | object | An object listing the units for each reported variable
qcFlags         | object | Returns True or False for each `qcEnabled` test
qcFlagNames     | array  | An array listing the names of all `qcFlags`
qcEnabled       | array  | An array listing all enabled QC tests
qcLongNames     | object | An object listing the long name of all QC tests
queryParameters | object | An object listing all `queryParameters` that was passed through to the API

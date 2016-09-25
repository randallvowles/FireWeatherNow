# makeTimeSeriesTable

>Create data tables

MesonetJS has built-in methods to help users easily build data tables, as we do in the [quick start guide](../quick-start.md). We keep things pretty simple in the tutorial but here we will discuss all the different options available when configuring a table.

After making your [fetch()](fetch.md) query in your javascript, declare a variable `tableConfig`. If you do not specify which station data the table will be for, the default option is the first station returned by your query. If multiple stations are returned you may specify the station by setting `stid` equal to either the location of the station's id within the data container or the string literal of the station id. Note that if setting it equal to a string literal, this string must be the same as the station id string in M.response.tableOfContents. After declaring which station's data the table will display, set the tableID option to a string. This is the id of the container we will be displaying in the html.

```
var tableConfig = {
  stid: M.response.station[0].STID,
  tableID: "tabular-data",
};
M.configureTable(tableConfig);

M.table();
```

You may also add other options to the tableConfig variable to change other default options. Below are the default settings with the alternate options explained:


Argument    | Type           | Description
---         | ---            | ---
descend     | bool           | By default the most recent observation from the query will be displayed as the table's first entry. You have the option to set this to false and thus show the oldest observation at the top.
detached    | string, number | Other options are false or "inline".
qcFailClass | string         | CSS class for QC indicators
showUnits   | bool           | By default the units of the variables are displayed in the table. You have the option to set this to false and thus only show the reported variable's name without units.
stid        | string         | Limits results to a station or group of stations

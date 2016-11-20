(function () {
    "use strict";

    var P = new User({ cookie_name: "mesowest", cookie_ttl: 1 });
    var APITOKEN = typeof P.getToken() === null ? P.getToken() : "demotoken";
    var M = new Mesonet({ token: APITOKEN, service: "TimeSeries" });
    var apiArgs = M.windowArgs();

    // Since we want to force the time format to Epoch/Unix time, we need to do a bit more work at
    // this level.  We should consider setting MesonetJS to default as this.  If so then other code
    // will need to be updated to reflect the upstream changes.
    apiArgs.timeformat = "%s|%z|%Z";
    apiArgs.obtimezone = "local";
    apiArgs.qc = "all";
    apiArgs.recent = "60";
    apiArgs.stid = "wbb";

    // Determine the units
    apiArgs.units = P.getUnits();
    // apiArgs.units = "metric";
    //d3.select("#tabtable-station-name").text("Tabular Data for " + );
    d3.select("#tabtable-message").text("Loading data...").classed("lead", true);
    d3.select("#tabtable-progress").classed("hide", false);

    M.fetch({ api_args: apiArgs });
    M.printResponse();
    $.when(M.async()).done(function () {

        var tableArgs = {
            table_container: "#tabtable-container",
            table_class: "tabtable",
            time_utc: P._isUTC(),
            descend: true
        };

        // Render table & update text fields
        d3.selectAll("#tabtable-message, #tabtable-progress").classed("hide", true);
        d3.select("#page-title").text(
            "Weather Conditions for : " + M.response.station[0].NAME + " (" +
            apiArgs.stid.toUpperCase() + ")"
        );

        d3.selectAll("#tabtable-container").classed("hide", false);
        _tabTableEmitter(M, tableArgs);

        // Set global listeners
        d3.selectAll("#show-preferences, #show-sensor-menu").on("click", function (d) {
            _showSettingsModal(d3.select(this).attr("id"), tableArgs);
        });
    });


    /**
     * Displays the settings menu
     *
     * @param {string} tab
     * @param {object} tableArgs
     * @returns {boolean} - True: Good, False: Fail
     */
    function _showSettingsModal(tab, tableArgs) {

        cout(tab)

        // A bit of error checking and type guarding...
        var _selected = tab.split(" ")[0];

        _buildSensorSelectors();
        _buildUnitSelectors();

        // Modal behaviors
        //var _tab = "";
        var reloadPage = false;
        var reEmitTable = false;


        /**
         * Register button listeners
         */

        // Unit selector listener.  Listens for any unit selector
        d3.selectAll(".units-selector").on("click", function () {
            reloadPage = true;

            var _p = d3.select(this).attr("id").split("-");
            P.setValue("options.units." + _p[1], _p[2]);
        });

        // Listener: Settings -> Sensors -> Best Choice
        d3.select("#sensors-best-choice").on("click", function () {
            d3.selectAll(".multi-sensor").classed("hide", function () {
                return d3.select(this).property("checked");
            });
            _updateTdWidth(tableArgs);
            P.setSensorBestChoice(d3.select(this).property("checked"));
        });

        // Set the default state of the unit convention
        // Listens for the `units-conv` class
        d3.selectAll(".units-conv").on("click", function () {
            reloadPage = true;

            var isMetric = d3.select(this).property("value") === "0" ? true : false;

            // Update cookie and API arguments
            P._isMetric(isMetric);
            apiArgs.units = P.getUnits();

            // Now some UI stuff
            var _state = isMetric ? 0 : 1;
            var _u = [
                ["pa", "m", "c", "mm", "pa", "mps"],
                ["pa", "ft", "f", "in", "mb", "kts"]
            ];

            P.getUnits(-1).map(function (d, i) {
                d3.select("#units-" + d + "-" + _u[_state][i]).property("checked", true);
                P.setValue("options.units." + d, _u[_state][i]);
            });
        });


        // Select default (`whiteList`) sensors
        d3.select("#sensors-default-set").on("click", function () {
            reEmitTable = true;

            var whiteList = P.getWhiteList();
            P.resetSensorToWhiteList();

            d3.select("#settings-sensor-list").selectAll("input").property("checked", false);
            d3.select("#settings-sensor-list").selectAll("input").property("checked", function (d) {
                return whiteList.indexOf(d) === -1 ? false : true;
            });
        });

        // Select all sensors
        d3.select("#sensors-select-all").on("click", function () {
            reEmitTable = true;

            var _a = [];
            d3.selectAll("#settings-sensor-list").selectAll("input")._groups[0].forEach(
                function (d) { if (d.value !== "date_time") { _a.push(d.value); } }
            );
            _a.map(function (d) { P.addSensor(d); });
            d3.select("#settings-sensor-list").selectAll("input").property("checked", true);
        });

        // Unselect all Sensors
        d3.select("#sensors-unselect-all").on("click", function () {
            reEmitTable = true;
            P.removeAllSensors();
            d3.select("#settings-sensor-list").selectAll("input").property("checked", false);
        });

        // View sensors for just this station
        d3.select("#sensor-list-this-station").on("click", function () {
            d3.selectAll("#settings-sensor-list").selectAll("li").classed("hidden", function (d) {
                return (d3.select("." + d))._groups[0][0] !== null ? false : true;
            });
        });

        // View the global sensor inventory
        d3.select("#sensor-list-full-inventory").on("click", function () {
            d3.selectAll("#settings-sensor-list").selectAll("li").classed("hidden", false);
        });


        // Now show the modal
        $("#settings-editor").on('shown.bs.modal', function () {

            var _tab = "";
            switch (tab.split(" ")[0]) {
                case "show-preferences":
                    _tab = "general";
                    break;
                case "show-sensor-menu":
                    _tab = "sensors";
                    break;
                case "tabtable-units":
                    _tab = "units";
                    break;
                default:
                    _tab = "general";
            }

            $("a[href=\"#prefs-" + _tab + "\"]").tab('show');
        });
        $("#settings-editor").modal("show");

        $("#settings-editor").on('hidden.bs.modal', function () {
            if (reloadPage) {
                location.reload(true);
            }
            else if (reEmitTable) {
                _tabTableEmitter(M, tableArgs);
                _updateTdWidth(tableArgs);
            }
            else {
                _tabTableEmitter(M, tableArgs);
                _updateTdWidth(tableArgs);
            }
        });


        return true;


        /** Generate the unit configuration */
        function _buildUnitSelectors() {
            P.getUnits(-1).map(function (d) {
                d3.select("#units-" + d + "-" + P.getUnits(d)).property("checked", true);
            });
        }


        /** Generate the avaiable sensor list */
        function _buildSensorSelectors() {
            d3.select("#sensors-best-choice").property("checked", P.isSensorBestChoice());

            d3.selectAll("#settings-sensor-list").select("ol").remove();
            var _ul = d3.selectAll("#settings-sensor-list").append("ol");
            _ul.selectAll("li")
                .data(M.response.sensor.metadata.rank)
                .enter()
                .append("li");

            _ul.selectAll("li").append("input")
                .attr("type", "checkbox")
                .property("checked", function (d) {
                    return P.getSensors().indexOf(d) === -1 ? false : true;
                })
                .attr("id", function (d) { return "sensor-selector__" + d; })
                .attr("class", "sensor-selector")
                .property("value", function (d) { return d; })
                .on("change", function (d) {
                    if (d3.select(this).property("checked")) {
                        P.addSensor(d3.select(this).property("value"));
                    }
                    else {
                        P.removeSensor(d3.select(this).property("value"));
                    }
                });

            _ul.selectAll("li").append("label")
                .attr("class", "sensor-selector")
                .attr("for", function (d) { return "sensor-selector__" + d; })
                .text(function (d) { return M.response.sensor.metadata.meta[d].long_name; });

            _ul.selectAll("li").classed("hidden", function (d) {
                return (d3.select("." + d))._groups[0][0] !== null ? false : true;
            });
        }
    }


    /**
     * Emits the time series table
     *
     * @param {any} M
     * @param {any} args
     * @returns
     */
    function _tabTableEmitter(M, args) {

        var _r = M.response;
        var _s = _r.station[0];
        var whiteList = P.getSensors();
        var U = new Units();

        // Lets sort the variables in the stack by rank
        var i = 0;
        var li = _r.sensor.metadata.rank.length;
        var j = 0;
        var lj = _r.sensor.stack[0].length;
        var rankedSensorStack = ["date_time"];
        while (i < li) {
            while (j < lj) {
                var thisSensor = (_r.sensor.stack[0][j]).split("_set_")[0];
                if (thisSensor === _r.sensor.metadata.rank[i]) {
                    rankedSensorStack.push(_r.sensor.stack[0][j]);
                }
                j++;
            }
            j = 0;
            i++;
        }
        console.log(rankedSensorStack);
        // Should put all these styles in a class
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "qc-tooltip")
            .text("");

        // Let's re-organize the response so it's easier to render as a table.
        var qc_active = typeof _s.QC_FLAGGED !== "undefined" ? _s.QC_FLAGGED : false;
        var obsByTime = [];
        i = 0;
        li = _s.OBSERVATIONS.date_time.length;
        j = 0;
        lj = rankedSensorStack.length;

        // See commit #98ea8e4 - Fix for QC disconnect
        var qc_bug_fix_1 = qc_active && typeof _s.QC !== "undefined" ? false : true;

        while (i < li) {
            obsByTime.push({ idx: i });
            while (j < lj) {
                // If we have a QC stack associated with this variable then we need to append
                // it to the response as `[ob, [QC1, QC2, QCn]]`
                if (
                    qc_bug_fix_1 ||
                    (!qc_active || typeof _s.QC[rankedSensorStack[j]] === "undefined")
                ) {
                    obsByTime[i][rankedSensorStack[j]] = _s.OBSERVATIONS[rankedSensorStack[j]][i];
                }
                else {
                    obsByTime[i][rankedSensorStack[j]] =
                        [
                            _s.OBSERVATIONS[rankedSensorStack[j]][i],
                            _s.QC[rankedSensorStack[j]][i] === null ?
                                false : _s.QC[rankedSensorStack[j]][i]
                        ];
                }
                j++;
            }
            j = 0;
            i++;
        }
        cout(obsByTime);
        // Descending array?
        obsByTime = args.descend ? obsByTime.reverse() : obsByTime;

        // Create and append table to DOM, but first check to see if we have a table node. This is
        // not the best method, but it works for now.
        d3.select("body " + args.table_container).selectAll("table").remove();
        var table = d3.select("body " + args.table_container).append("table")
            .attr("data-count-fixed-columns", 2)
            .attr("id", "tabtable")
            //.attr("class", "table scrollable-table table-condensed table-striped")
            .attr("class", args.table_class +
                " table scrollable-table table-condensed table-striped table-hover");

        // Make the header
        table.append("thead").attr("class", "fixed-header").append("tr")
            .selectAll("th").data(rankedSensorStack).enter().append("th")
            .attr("id", function (d) { return d; })
            .attr("class", function (d) {
                // @todo: needs improvement
                return whiteList.indexOf(d.split("_set_")[0]) === -1 ?
                    "hidden tabtable-header hidden-sensor " + d.split("_set_")[0] :
                    "tabtable-header " + d.split("_set_")[0];
            })
            .classed("fixed-column", function (d) {
                return d === "date_time" ? true : false;
            })
            .html(function (d) {
                var _v = d.split("_set_");

                // Number of similar sensors
                var _n = d !== "date_time" ? Number(d.split("_set_")[1].split("d")[0]) : 1;
                d3.select(this).classed(
                    "multi-sensor multi-" + _v[0] + "-sensor-" + _n,
                    function () { return _n > 1 ? true : false; }
                );
                _n = _n === 1 ? "" : " (" + _n + ")";

                // Is variable derived? Look for `d`.
                var _w = typeof _v[1] !== "undefined" && _v[1].split("d").length > 1 ?
                    "<sup>&#402;</sup>" : "";

                d3.select(this).classed("derived-variable", function () {
                    return _w === "<sup>&#402;</sup>" ? true : false;
                });

                return d === "date_time" ? "Time" : _r.sensor.metadata.meta[_v[0]].long_name + _n + _w;
            })
            .property("sorted", false)
            .on('click', function (d) {

                var _thisId = d3.select(this).attr("id");
                var _this = this;
                var _state = d3.select(this).property("sorted");
                d3.select(_this).property("sorted", function (d) { return _state ? false : true; });

                if (_thisId !== "date_time") {
                    rows.sort(function (a, b) {
                        // Typeguarding for null values.  See commit #90eb9ea
                        var _a = a[d] === null ? -9999 : typeof a[d] === "object" ? a[d][0] : a[d];
                        var _b = b[d] === null ? -9999 : typeof b[d] === "object" ? b[d][0] : b[d];
                        return _state ? _a - _b : _b - _a;
                    });
                }
                else {
                    args.descend = args.descend ? false : true;
                    _tabTableEmitter(M, args);
                }

                d3.selectAll(".tabtable-header").selectAll("i").classed("fa-chevron-circle-down", false);
                d3.selectAll(".tabtable-header").selectAll("i").classed("fa-chevron-circle-up", false);

                d3.select("#" + _thisId).select("i").attr("class", "fa")
                    .classed("fa-chevron-circle-up", function () { return _state ? true : false })
                    .classed("fa-chevron-circle-down", function () { return !_state ? true : false });

            })
            .append("i").attr("class", "sort-icon");

        // d3.select("#date_time")
        //     .append("button").attr("class", "btn btn-default").attr("id", "toggle-descend-obs")
        //     .append("i").attr("class", "fa")
        //     .on("click", function (d) {
        //         args.descend = args.descend ? false : true;
        //         _tabTableEmitter(M, args);
        //     })
        //     .classed("fa-chevron-circle-down", !args.descend)
        //     .classed("fa-chevron-circle-up", args.descend)
        //     .text(" Time");

        // Add the units to the table. We add this as a `TD` in the `THEAD` node.  If you change
        // this to `TH` you will need to update the filtering of `TH` elements in the update
        // table width routine.
        table.select("thead").append("tr")
            .selectAll("th").data(rankedSensorStack).enter().append("td")
            .attr("id", function (d) {
                return d === "date_time" ? "date-time-locale" : "";
            })
            .attr("class", function (d) {
                return whiteList.indexOf(d.split("_set_")[0]) === -1 ?
                    "hidden tabtable-units" : "tabtable-units";
            })
            .classed("fixed-column", function (d) {
                return d === "date_time" ? true : false;
            })
            .html(function (d) {
                var _v = d.split("_set_");

                // Number of similar sensors
                var _n = d !== "date_time" ? Number(d.split("_set_")[1].split("d")[0]) : 1;
                d3.select(this).classed(
                    "multi-sensor multi-" + _v[0] + "-sensor-" + _n,
                    function () { return _n > 1 ? true : false; }
                );

                return d === "date_time" ?
                    null :
                    typeof U.get(_r.sensor.units[0][d.split("_set_")[0]]).html === "undefined" ?
                        _r.sensor.units[0][d.split("_set_")[0]] :
                        U.get(_r.sensor.units[0][d.split("_set_")[0]]).html;
            })
            .on("click", function (d) { _showSettingsModal(d3.select(this).attr("class"), args); });

        // Create the rows
        var rows = table.append("tbody").attr("class", "scrollable")
            .selectAll("tr").data(obsByTime).enter().append("tr");

        // Create and populate the cells
        var cells = rows.selectAll('td')
            .data(function (row) {
                return rankedSensorStack.map(function (d) {
                    return {
                        name: d,
                        value: row[d] === null ? false : row[d]
                    };
                });
            })
            .enter().append("td")
            .attr("id", function (d) {
                return d.name === "date_time" ? "t" + _parseDate(d.value) : null;
            })
            .attr("class", function (d) {
                return whiteList.indexOf(d.name.split("_set_")[0]) === -1 ?
                    "hidden " + d.name : d.name;
            })
            .classed("fixed-column", function (d) {
                return d.name === "date_time" ? true : false;
            })
            .text(function (d) {

                var _v = (d.name).split("_set_");
                // Number of similar sensors
                var _n = d.name !== "date_time" ? Number(((d.name).split("_set_")[1]).split("d")[0]) : 1;
                d3.select(this).classed(
                    "multi-sensor multi-" + (d.name).split("_set_")[0] + "-sensor-" + _n,
                    function () { return _n > 1 ? true : false; }
                );

                _v = typeof d.value === "object" && !!d.value[1] ?
                    d.value[0] : typeof d.value === "object" ? d.value[0] : d.value;
                _v = !_v ? "" : _v;

                // Unit precision
                var _p = typeof _r.sensor.units[0][d.name.split("_set_")[0]] === "undefined" ?
                    2 : U.get(_r.sensor.units[0][d.name.split("_set_")[0]]).precision;

                return d.name === "date_time" ?
                    __fmtDate(_v, args.time_utc) : typeof _v === "number" ? Number(_v).toFixed(_p) : _v;
            })
            .classed("metar-message", function (d) {
                return d.name.split("_set_")[0] === "metar" ? true : false;
            })
            .classed("bang", function (d) {
                return typeof d.value === "object" && !!d.value[1] ? true : false;
            })
            .on("mouseover", function (d) {
                if (typeof d.value === "object" && !!d.value[1] && d.name !== "date_time") {
                    var s = "<ul>";
                    if (typeof d.value === "object") {
                        d.value[1].forEach(function (_d) {
                            s += "<li>" + _r.qc.metadata[_d].NAME + "</li>";
                        });
                    }
                    s += "</ul>";
                    tooltip.html(s);
                    return tooltip.style("visibility", "visible");
                }
                else {
                    return;
                }
            })
            .on("mousemove", function () {
                return tooltip.style(
                    "top",
                    (d3.event.pageY - 10) + "px").style("left",
                    (d3.event.pageX + 10) + "px"
                    );
            })
            .on("mouseout", function () { return tooltip.style("visibility", "hidden"); })
            .on("click", function (d) {
                // Does this element have QC?
                if (!d3.select(this).classed("bang")) { return; }

                // We need to get the time stamp for this observation, so we have to work back up
                // the DOM tree and get the `ID` we buried with the time stamp.
                var _ti = (d3.select(this.parentNode)._groups[0][0]); // string
                var _t = Number(d3.select(_ti).select(".date_time").attr("id").split("t")[1]); // int

                var M2 = new Mesonet({ token: APITOKEN, service: "QcSegments" });
                M2.fetch({
                    d3_compat: true,
                    api_args: {
                        stid: apiArgs.stid,
                        start: M.epochToApi(_t),
                        end: M.epochToApi(_t + 1),
                        vars: d.name.split("_set_")[0],
                        units: P.getUnits(),
                        timeformat: apiArgs.timeformat,
                        obtimezone: apiArgs.obtimezone
                    }
                });

                $("#qc-inspector").modal('show');
                $.when(M2.async()).done(function () {

                    var _r2 = M2.response.station[0].QC;

                    // Number of similar sensors
                    var _v = d.name.split("_set_");
                    var _n = d.name !== "date_time" ? Number(_v[1].split("d")[0]) : 1;
                    _n = _n === 1 ? "" : " (" + _n + ")";

                    // Is variable derived? Look for `d`.
                    var _w = typeof _v[1] !== "undefined" && _v[1].split("d").length > 1 ? "^" : "";
                    $("#qc-inspector-title").text(
                        _r.sensor.metadata.meta[_v[0]].long_name + _n + _w
                    );

                    d3.select("#qc-inspector-table-container").selectAll("table").remove();
                    var _table = d3.select("#qc-inspector-table-container").append("table")
                        .attr("class", "table table-condensed table-striped qc-inspector-table");

                    var _theaders = ["Start", "Finish", "QC Flag"];
                    var _tstack = ["start", "end", "qc_flag"];

                    _table.append("thead").append("tr")
                        .selectAll("th").data(_theaders).enter().append("th")
                        .text(function (d) { return d; });

                    // Create the rows
                    var _rows = _table.append("tbody").selectAll("tr").data(_r2).enter().append("tr");

                    // Create and populate the cells
                    var _cells = _rows.selectAll("td")
                        .data(function (_row) {
                            return _tstack.map(function (d) {
                                return {
                                    name: d,
                                    value: _row[d] === null ? false : _row[d]
                                };
                            });
                        })
                        .enter().append("td")
                        .text(function (d) {

                            switch (d.name) {
                                case "start":
                                    // @FIXME: for some reason calling the API with the Epoch time
                                    // format breaks this.
                                    return __fmtDate(d.value, args.time_utc, true);
                                case "end":
                                    return __fmtDate(d.value, args.time_utc, true);
                                case "sensor":
                                    return _r.sensor.metadata.meta[d.value.split("_qc_")[0]].long_name;
                                case "qc_flag":
                                    return _r.qc.metadata[d.value].NAME;
                                default:
                                    console.log("Sorry, we are out of " + d.name + ".");
                            }

                        });
                    $("#qc-inspector-progress").hide();
                });

                var M3 = new Mesonet({ token: APITOKEN, service: "TimeSeries" });
                M3.fetch({
                    d3_compat: true,
                    api_args: {
                        stid: apiArgs.stid,
                        start: apiArgs.start,
                        end: apiArgs.end,
                        vars: d.name.split("_set_")[0],
                        timeformat: "%s",
                        //obtimezone: apiArgs.obtimezone,
                        qc: "all",
                        units: P.getUnits()
                    }
                });

                // Time series plot
                $.when(M3.async()).done(function () {
                    var _r3 = M3.response.station[0];
                    var data = [];
                    var i = 0;
                    var l = _r3.OBSERVATIONS.date_time.length;
                    while (i < l) {
                        data.push({
                            date: M.epochDate(Number(_r3.OBSERVATIONS.date_time[i])),
                            value: _r3.OBSERVATIONS[d.name][i],
                            qc_flag: _r3.QC[d.name][i],
                            units: M3.response.sensor.units[0][d.name.split("_set_")[0]]
                        });
                        i++;
                    }

                    d3.select("#qc-inspector-plot-container").selectAll("svg").remove();
                    var _ps = plotSettings(
                        M3.response.sensor.units[0][d.name.split("_set_")[0]],
                        d.name.split("_set_")[0]
                    );
                    var _psd = {
                        range_min: (d3.min(data, function (d) { return d.value; }) - 15).toFixed(2),
                        range_max: (d3.max(data, function (d) { return d.value; }) + 15).toFixed(2),
                        center: function () { return ((this.range_min + this.range_max) / 2); },
                        text: "Unknown!",
                    };
                    _ps = !_ps ? _psd : _ps;

                    var modalWidth = $("#qc-inspector .modal-header").width();
                    var margin = { top: 10, right: 10, bottom: 35, left: 30 };
                    var width = modalWidth - 10 - margin.left - margin.right;
                    var height = 300 - margin.top - margin.bottom;

                    var x = d3.scaleTime().range([0, width]);
                    var y = d3.scaleLinear().range([height, 0]);

                    var xAxis = d3.axisBottom().scale(x).ticks(3);
                    var yAxis = d3.axisLeft().scale(y).ticks(10);

                    var dataLine = d3.line()
                        .x(function (d) { return x(d.date); })
                        .y(function (d) { return y(d.value); });

                    var centerLine = _ps.center !== null ? d3.line()
                        .x(function (d) { return x(d.date); })
                        .y(function (d) { return y(_ps.center); }) : false;

                    var svg = d3.select("#qc-inspector-plot-container").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    x.domain(d3.extent(data, function (d) { return d.date; }));
                    y.domain([_ps.range_min, _ps.range_max]);

                    svg.append("g").attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")").call(xAxis);

                    svg.append("g").attr("class", "y axis").call(yAxis).append("text")
                        .attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em")
                        .style("text-anchor", "end").text(_ps.text);

                    svg.append("path").datum(data).attr("class", "data-line").attr("d", dataLine);

                    if (centerLine) {
                        svg.append("path").datum(data).attr("class", "center-line")
                            .attr("d", centerLine);
                    }

                    svg.selectAll("circle").data([_t, d.value[0]]).enter().append("circle")
                        .attr("cx", x(M.epochDate(_t))).attr("cy", y(d.value[0]))
                        .attr("r", "8px").attr("fill", "red");

                });
                return;
            });

        // Do we want the "best case" selection
        d3.selectAll(".multi-sensor").classed("hide", P.isSensorBestChoice());

        _updateTdWidth(args);
        _updateHiddenSensorCount();

        // If the users has unselected all the sensors, then hide the table.  We have to
        // let the table render, else the data binding in the dom, goes away and we don't
        // have a page anymore.
        table.classed("hidden", function (d) { return whiteList.length < 2 ? true : false; });

        var $table = $("#tabtable");
        $table.floatThead({
            responsiveContainer: function ($table) {
                return $table.closest('.table-responsive');
            },
            floatTableClass: "float-table",
            floatContainerClass: "float-table",
            position: 'fixed'
        });
        // $table.trigger('reflow');
        //$table.floatThead();
        //$table.floatThead('reflow');


        // var $table = $('.table');
        // var $fixedColumn = $table.clone().insertBefore($table).addClass("fixed-column");
        // $fixedColumn.find("th:not(:first-child),td:not(:first-child)").remove();
        // $fixedColumn.find("tr").each(function (i, elem) {
        //     cout(elem)
        //     $(this).height($table.find("tr:eq(" + i + ")").height());
        // });

        // $('#tabtable').DataTable({
        //     scrollY: "100%",
        //     scrollX: "100%",
        //     scrollCollapse: false,
        //     paging: false,
        //     fixedColumns: {
        //         leftColumns: 1
        //     }
        // });

        return;


        /** Updates the number of sensors that are not shown */
        function _updateHiddenSensorCount() {

            var _h = d3.selectAll(".hidden-sensor");
            var _hc = _h._groups[0].length;
            var _sense = [];
            _h._groups[0].forEach(function (d) { _sense.push((d.id).split("_set_")[0]); });


            if (_hc > 0) {
                d3.select("#hidden-sensor-count").classed("hidden", false);
                d3.select("#hidden-sensor-count").text(_h._groups[0].length);
            }
            else {
                d3.select("#hidden-sensor-count").classed("hidden", true);
            }
        }


        /**
         * Formats the date
         *
         * @param {string | object<Date> | number} - Date in either string, Date or Epoch integer
         * @param {bool} - UTC timezone? Default is true
         * @return {string} - Formatted time
         */
        function __fmtDate(_date, UTC, YEAR) {

            UTC = typeof UTC === "undefined" ? true : UTC;
            YEAR = typeof YEAR === "undefined" ? false : true;

            var _p = _date.split("|").length > 1 ? _date.split("|") : null;

            _date = typeof _date !== "object" && _date.split("|").length > 1 ?
                _parseDate(_date) : typeof _date === "object" ? M.epochDate(_date) : Number(_date);
            _date = UTC ? M.epochDate(_date).toISOString() : M.epochDate(_date).toString();

            var _m = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            var _z = UTC ? "UTC" : _p[2] + " (" + _p[1] + ")";
            d3.select("#date-time-locale")
                .html(function (d) {
                    var _s = [
                        "<span class=\"event-tip\">Change from UTC to " + _p[2] + "</span>",
                        "<span class=\"event-tip\">Change from " + _p[2] + " to UTC</span>"
                    ];

                    return d === "date_time" && UTC ? _s[0] : _s[1];
                })
                .on("click", function (d) {
                    // @note: It's important to know that the `apiArgs` are hoisted from above.
                    d3.selectAll("#tabtable-message, #tabtable-progress").classed("hide", false);
                    d3.selectAll("#tabtable-container").classed("hide", true);

                    args.time_utc = args.time_utc ? false : true;
                    P.setValue("options.time_utc", args.time_utc);

                    M.fetch({ api_args: apiArgs });
                    $.when(M.async()).done(function () {
                        d3.selectAll("#tabtable-container").classed("hide", false);
                        d3.selectAll("#tabtable-message, #tabtable-progress").classed("hide", true);
                        _tabTableEmitter(M, args);
                    });
                });

            return UTC ? _m[Number(_date.slice(5, 7)) - 1] +
                " " + _date.slice(8, 10) + " " + _date.slice(11, 16) + " " +
                (YEAR ? _date.slice(11, 15) : "") :
                _date.slice(4, 7) + " " + _date.slice(8, 10) + " " + _date.slice(16, 21) + " " +
                (YEAR ? _date.slice(11, 15) : "");
        }

        /**
         * Returns the UTC Unix time from our odd-ball time format response
         *
         * @param {string} dateString
         * @returns {number}
         */
        function _parseDate(dateString) {
            // `dateString` has the timezone format of `%s|%z|%Z` so we
            // need to break apart the values and then get the parts from it.
            var _p = dateString.split("|");

            var _h = [3];
            _h[0] = _p[1].slice(0, 1) === "-" ? -1 : 1;
            _h[1] = Number(_p[1].slice(1, 3)) * 3600;
            _h[2] = Number(_p[1].slice(3, 5)) * 60;

            var _date = _p === -1 ? null : Number(_p[0]) - _h[0] * (_h[1] + _h[2]);
            return _date;
        }
    }

    /**
     * Updates the table cells with the correct width.  This is needed since `thead` and `tbody` are
     * divorced so you can have a sticky header.
     *
     * @param {object} args
     */
    function _updateTdWidth(args) {

        // Minimum TD width in pixels
        var MIN_TD_WIDTH = 50;

        var q = d3.select("body " + args.table_container)
            .select("table").select("thead").selectAll("th");

        var i = 0;
        var l = q._groups[0].length;
        var _w0 = 0;
        var _w1 = 0;
        var _w = 0;
        while (i < l) {
            // Need to find the max size of the TH and the TD
            _w = Math.max(
                _w0 = Math.ceil(
                    document.getElementById(q._groups[0][i].getAttribute("id"))
                        .getBoundingClientRect().width
                ),
                _w1 = Math.ceil(
                    d3.selectAll("." + q._groups[0][i].getAttribute("id"))
                        .node().getBoundingClientRect().width
                )
            );

            document.getElementById(q._groups[0][i].getAttribute("id")).width = _w;

            var el = document.querySelectorAll("." + q._groups[0][i].getAttribute("id"));
            var ii = 0;
            var ll = el.length;
            while (ii < ll) {
                el[ii].style.minWidth = _w.toString() + "px";
                ii++;
            }
            i++;
        }
        return;
    }
})();


/**
 * Converts epoch date to API date.
 */
Mesonet.prototype.epochToApi = function (epoch) {
    var _s = typeof epoch === "number" ?
        this.epochDate(epoch).toJSON() : Number(this.epochDate(epoch)).toJSON();

    return (_s.split(".")[0]).replace(/[:T-]/g, "").slice(0, 12);
};


// Little helper...
// Remove me before production.
function cout(s) {
    if (typeof s === "undefined") {
        console.log("BANG!");
    }
    else {
        console.log(s);
    }
}


function plotSettings(unit, sensor) {

    // Test and bail
    sensor = typeof sensor === "undefined" ? null : sensor;
    if (typeof unit === "undefined") { return false; }

    // Because some of our units contain characters that are not valid variables names, we have to
    // ensure that they are passed as a string.
    unit = typeof unit === "string" ? unit : unit.toString();

    var lookup = {
        "Celsius": {
            range_min: -50,
            range_max: 50,
            center: 0,
            precision: 1,
            text: "Degrees C",
            exceptions: {
                dew_point_temperature: {
                    center: 8
                }
            }
        },
        "Fahrenheit": {
            range_min: -40,
            range_max: 135,
            center: 32,
            precision: 1,
            text: "Degrees F",
            exceptions: {
                dew_point_temperature: {
                    center: 50
                }
            }
        },
        "Kelvin": {
            range_min: -315,
            range_max: -133,
            center: -125,
            precision: 1,
            text: "Kelvin",
            exceptions: {}
        },
        "Meters/second": {
            range_min: 0,
            range_max: 100,
            center: 20,
            precision: 1,
            text: "Knots",
            exceptions: {}
        },
        "knots": {
            range_min: 0,
            range_max: 100,
            center: 20,
            precision: 1,
            text: "Knots",
            exceptions: {}
        },
        "%": {
            range_min: 0,
            range_max: 110,
            center: 50,
            precision: 0,
            text: "Percent (%)",
            exceptions: {}
        },
        "Pascals": {
            range_min: 8000,
            range_max: 10200,
            center: 10000,
            precision: 0,
            text: "Pascals",
            exceptions: {}
        },
        "Millibars": {
            range_min: 800,
            range_max: 1020,
            center: 1000,
            precision: 0,
            text: "Millibars (mb)",
            exceptions: {}
        },
        "W/m**2": {
            range_min: 0,
            range_max: 1000,
            center: 500,
            precision: 0,
            text: "Watts / Meter^2",
            exceptions: {}
        },
        "Degrees": {
            range_min: 0,
            range_max: 360,
            center: null,
            precision: 0,
            text: "Degrees",
            labels: [
                "N", "NNE", "NE", "E",
                "SE", "SSE", "S",
                "SSW", "SW", "W",
                "NW", "NNW", "N"
            ],
            exceptions: {}
        }
    }

    // Make any exception updates and pass it back
    var _r = lookup[unit];
    if (typeof _r === "undefined") { return false; }
    if (sensor !== null && typeof lookup[unit].exceptions[sensor] !== "undefined") {
        var key;
        for (key in lookup[unit].exceptions[sensor]) {
            _r[key] = lookup[unit].exceptions[sensor][key];
        }
    }
    delete _r.exceptions;
    return _r;
}






/* ------------------------------------------------------------------------------------------------
 * ECMA-262 Polyfills for cross browser support.
 * All modern browsers should have these features, but just in case, we include them here.
 * -----------------------------------------------------------------------------------------------*/

// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {

        var k;

        // 1. Let o be the result of calling ToObject passing
        //    the this value as the argument.
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let lenValue be the result of calling the Get
        //    internal method of o with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = o.length >>> 0;

        // 4. If len is 0, return -1.
        if (len === 0) {
            return -1;
        }

        // 5. If argument fromIndex was passed let n be
        //    ToInteger(fromIndex); else let n be 0.
        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        // 6. If n >= len, return -1.
        if (n >= len) {
            return -1;
        }

        // 7. If n >= 0, then Let k be n.
        // 8. Else, n<0, Let k be len - abs(n).
        //    If k is less than 0, then let k be 0.
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        // 9. Repeat, while k < len
        while (k < len) {
            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the
            //    HasProperty internal method of o with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            //    i.  Let elementK be the result of calling the Get
            //        internal method of o with the argument ToString(k).
            //   ii.  Let same be the result of applying the
            //        Strict Equality Comparison Algorithm to
            //        searchElement and elementK.
            //  iii.  If same is true, return k.
            if (k in o && o[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}


// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

    Array.prototype.forEach = function (callback, thisArg) {

        var T, k;

        if (this === null) {
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling toObject() passing the
        // |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get() internal
        // method of O with the argument "length".
        // 3. Let len be toUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If isCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let
        // T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let k be 0
        k = 0;

        // 7. Repeat, while k < len
        while (k < len) {

            var kValue;

            // a. Let Pk be ToString(k).
            //    This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty
            //    internal method of O with argument Pk.
            //    This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal
                // method of O with argument Pk.
                kValue = O[k];

                // ii. Call the Call internal method of callback with T as
                // the this value and argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined
    };
}
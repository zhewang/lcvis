var objs = {};

var plots = {};

function changePlot(newPlotId) {
    var period = objs[newPlotId].period;

    // plot current selection
    plotObject(newPlotId, period);
    document.getElementById("selection").childNodes[0].children[objs[newPlotId].index].selected = true;
}

d3.csv("data/object_list.csv", function(csv) {
    for (var i=0; i<csv.length; ++i) {
        csv[i].id= Number(csv[i].id);
        csv[i].period= Number(csv[i].period);
        objs[csv[i].id] = { period: Number(csv[i].period),
                            index: i
                          };
    }
    var select = d3.select("#selection").append("select");

    select.on("change", function() {
        var id = this.options[this.selectedIndex].text.split(" ")[0];
        var period = this.options[this.selectedIndex].value;

        changePlot(id);
    });

    select.selectAll("option")
          .data(csv)
          .enter()
          .append("option")
          .attr("id", function (d) { return d.id;})
          .attr("value", function (d) { return d.period; })
          .text(function (d) {
              if(d.period > 0)
                  return d.id;
              else
                  return d.id+" *";
          });

    // plot the first object when starting
    plotObject(csv[0].id, csv[0].period);

    // plot color coded PCA results according to LCType
    d3.json("data/pca.json", function(pca_data) {
        plotPCAColored(pca_data);
        plotPCAMultiple(pca_data);
    });
});

//////////////////////////////////////////////////////////////////////////////
// plot a periodic astro-object
function plotObject(id, period) {
    var data_file = "data/"+id.toString()+".dat.json";

    d3.json(data_file, function(json) {
        // Load Data
        for (var i=0; i<json.length; ++i) {
            json[i].time = Number(json[i].time);
            json[i].mag = Number(json[i].mag);
            json[i].error = Number(json[i].error);
        }

        // plot mag vs. time
        plotTimeMag(json, 500, 200);
        if (period > 0) {
            var curve_data_file = "data/"+id.toString()+".fit.json";
            var points = [];
            d3.json(curve_data_file, function(curve_data) {
                for (var i = 0; i < curve_data[0].mag.length; ++i) {
                    points[i] = {'x': Number(curve_data[0].phase[i]),
                                 'y': Number(curve_data[0].mag[i])
                                };
                }

                // plot mag vs. phase
                plotPhaseMag(json, period, points, 500, 200);

                // plot scaled mag vs. phase
                plotPhaseMagScaled(json, period, points, 500, 400);

                // plot the result of PCA
                plotPCA();
            });
        }
    });
};

//////////////////////////////////////////////////////////////////////////////

function createTimeMagPlot(data, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().range([50, plotWidth-30]);
    var yScale = d3.scale.linear().range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    plot.xScale = xScale;
    plot.yScale = yScale;
    plot.xAxis = xAxis;
    plot.yAxis = yAxis;
    yAxis.orient("left");

    plot.setCircleProperties = function(sel) {
        sel
            .attr("fill", "red")
            .attr("stroke", "none")
            .attr("cx", function(d) { return xScale(d.time); })
            .attr("cy", function(d) { return yScale(d.mag); })
            .attr("r", 3)    ;
    };

    var svgSel = d3.select("#plotTimeMag")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    plot.svgSel = svgSel;
    plot.xAxisGroup = svgSel.append("g").attr("transform", "translate(0, "+(plotHeight-30).toString()+")");
    plot.yAxisGroup = svgSel.append("g").attr("transform", "translate(50, 0)");

    return plot;
}

function plotTimeMag(data, width, height) {
    if (!plots.timeMag) {
        plots.timeMag = createTimeMagPlot(data, width, height);
    }
    var plot = plots.timeMag;

    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });

    var plotWidth = width;
    var plotHeight = height;

    var xScale = plot.xScale.domain(timeExtent);
    var yScale = plot.yScale.domain([magExtent[1], magExtent[0]]);

    var svgSel = plot.svgSel;

    var circleJoin = svgSel.selectAll("circle")
          .data(data);

    circleJoin.enter()
          .append("circle")
          .call(plot.setCircleProperties);

    circleJoin.call(plot.setCircleProperties);
    circleJoin.exit().remove();

    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);
};

//////////////////////////////////////////////////////////////////////////////

function createPhaseMagPlot(data, period, curve_points, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().domain([-0.5, 1.5]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    plot.xScale = xScale;
    plot.yScale = yScale;
    plot.xAxis = xAxis;
    plot.yAxis = yAxis;
    yAxis.orient("left");

    plot.setCircleProperties = function(shift) {
        return function(sel) {
            sel
                .attr("fill", "red")
                .attr("stroke", "none")
                .attr("cx", function(d) { return xScale(d.phase + shift); })
                .attr("cy", function(d) { return yScale(d.mag); })
                .attr("r", 3);
        };
    };

    var svgSel = d3.select("#plotPhaseMag")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    plot.svgSel = svgSel;
    plot.circleSel = svgSel.append("g");
    plot.xAxisGroup = svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")");
    plot.yAxisGroup = svgSel.append("g")
          .attr("transform", "translate(50, 0)");
    plot.curveSel = svgSel.append("g");

    return plot;
}

function plotPhaseMag(data, period, curve_points, width, height) {
    if (!plots.phaseMag) {
        plots.phaseMag = createPhaseMagPlot(data, period, curve_points, width, height);
    }
    var plot = plots.phaseMag;
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });
    var t;

    for(var i = 0; i < data.length; i ++) {
        t = data[i].time - timeExtent[0];
        data[i].phase = t/period - Math.floor(t/period);
    }

    var yScale = plot.yScale.domain([magExtent[1], magExtent[0]]);
    var svgSel = plot.svgSel;
    plot.circleSel.selectAll("circle").remove();
    var circleSel = plot.circleSel.selectAll("circle").data(data).enter();

    circleSel.append("circle")
        .call(plot.setCircleProperties(0));

    circleSel.append("circle")
        .filter(function(d) { return d.phase - 1 >= -0.5; })
        .call(plot.setCircleProperties(-1));

    circleSel.append("circle")
        .filter(function(d) { return d.phase + 1 <= 1.5; })
        .call(plot.setCircleProperties(1));

    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);

    // plot curve
    var lineFunction = d3.svg.line()
        .x(function(d) { return plot.xScale(d.x); })
        .y(function(d) { return yScale(d.y); })
        .interpolate("basis");

    var front_data = [];
    var end_data = [];
    for (var i = 0; i < curve_points.length; ++i) {
        if (curve_points[i].x > 0.5)
            front_data.push({'x':curve_points[i].x-1, 'y':curve_points[i].y});
        else
            end_data.push({'x':curve_points[i].x+1, 'y':curve_points[i].y});
    }
    curve_points = front_data.concat(curve_points, end_data);

    plot.curveSel.selectAll("path").remove();
    plot.curveSel.append('path')
          .attr('d', lineFunction(curve_points))
          .attr('stroke', 'blue')
          .attr('stroke-width', '2')
          .attr('fill', 'none');
};

//////////////////////////////////////////////////////////////////////////////

function createPhaseMagScaledPlot(data, period, curve_points, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().domain([0, 1]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain([1, -1]).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
    var yAxis = d3.svg.axis().scale(yScale);
    yAxis.orient("left");

    var svgSel = d3.select("#plotPhaseMagScaled")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight);
    plot.svgSel = svgSel;
    plot.circleSel = svgSel.append("g");
    plot.curveSel = svgSel.append("g");
    plot.xAxisGroup = svgSel.append("g")
        .attr("transform", "translate(0, "+(plotHeight-30).toString()+")");
    plot.yAxisGroup = svgSel.append("g")
        .attr("transform", "translate(50, 0)");
    plot.xAxis = xAxis;
    plot.yAxis = yAxis;
    plot.xScale = xScale;
    plot.yScale = yScale;

    return plot;
}

function plotPhaseMagScaled(data, period, curve_points, width, height) {
    if (!plots.phaseMagScale) {
        plots.phaseMagScale = createPhaseMagScaledPlot(
            data, period, curve_points, width, height);
    }
    var plot = plots.phaseMagScale;
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });
    var magAverage = d3.mean(data, function(row) { return row.mag; });
    var t;

    var max_peak = 100;
    var max_phase = -1;
    for (var i = 0; i < curve_points.length; i ++) {
        if (curve_points[i].y < max_peak) {
            max_peak = curve_points[i].y;
            max_phase = curve_points[i].x;
        }
    }

    var shift = max_phase - 0.3;

    function shiftFunction(d) {
        d = d - shift;
        if (d > 1) d = d - 1;
        if (d < 0) d = d + 1;
        return d;
    }

    for(var i = 0; i < data.length; i ++) {
        t = data[i].time - timeExtent[0];
        data[i].phase = shiftFunction(t/period - Math.floor(t/period));
    }

    var plotWidth = width;
    var plotHeight = height;

    var xScale = plot.xScale;
    var yScale = plot.yScale;
    var xAxis = plot.xAxis;
    var yAxis = plot.yAxis;

    var svgSel = plot.svgSel;

    plot.circleSel.selectAll("circle").remove();
    var circleSel = plot.circleSel.selectAll("circle").data(data).enter();

    circleSel.append("circle")
             .attr("fill", "red")
             .attr("stroke", "none")
             .attr("cx", function(d) { return xScale(d.phase); })
             .attr("cy", function(d) { return yScale(d.mag-magAverage); })
             .attr("r", 3);

    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);

    // plot curve
    for (var i = 0; i < curve_points.length; i ++) {
        curve_points[i].x = shiftFunction(curve_points[i].x);
    }

    function sortFunction(a, b) {
        if (a.x == b.x) return 0;
        else
            return (a.x < b.x) ? -1:1;
    }

    curve_points.sort(sortFunction);

    var lineFunction = d3.svg.line()
                         .x(function(d) { return xScale(d.x); })
                         .y(function(d) { return yScale(d.y-magAverage); })
                         .interpolate("basis");

    plot.curveSel.selectAll("path").remove();
    plot.curveSel.append('path')
          .attr('d', lineFunction(curve_points))
          .attr('stroke', 'blue')
          .attr('stroke-width', '2')
          .attr('fill', 'none');
};

//////////////////////////////////////////////////////////////////////////////

var createdPCA = false;
function plotPCA() {
    if (createdPCA)
        return;
    createdPCA = true;
    d3.json("data/pca.json", function(data) {

    var xExtent = d3.extent(data, function(row) { return row[0]; });
    var yExtent = d3.extent(data, function(row) { return row[1]; });

    var plotWidth = 500;
    var plotHeight = 500;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    var svgSel = d3.select("#plotPCA")
            .append("svg")
            .attr("width", plotWidth)
            .attr("height", plotHeight);

    var circleSel = svgSel.selectAll("circle").data(data).enter();

    circleSel.append("circle")
            .classed("clickable", true)
            .attr("fill", "rgba(255,0,0,0.1)")
            .attr("stroke", "none")
            .attr("cx", function(d) { return xScale(d[0]); })
            .attr("cy", function(d) { return yScale(d[1]); })
            .attr("r", 3)
            .on("click", function(d) {
                changePlot(d[3]);
            });

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);
    });
}

function getColorCode(LCType) {
    switch(LCType) {
        case 1: return "#e41a1c";
        case 2: return "#377eb8";
        case 4: return "#4daf4a";
        case 5: return "#984ea3";
        case 6: return "#ff7f00";
        default:
            return "#ffff33";
    }
}

// color coded for different LCTypes
function plotPCAColored(data) {
    var xExtent = d3.extent(data, function(row) { return row[0]; });
    var yExtent = d3.extent(data, function(row) { return row[1]; });

    var plotWidth = 800;
    var plotHeight = 800;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale);
    var yAxis = d3.svg.axis().scale(yScale);

    svgSel = d3.select("#plotPCAColored")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight)

    circleSel = svgSel.selectAll("circle").data(data).enter()

    circleSel.append("circle")
             .attr("stroke", "none")
             .attr("opacity", "0.2")
             .attr("fill", function(d) { return getColorCode(d[2]); })
             .attr("cx", function(d) { return xScale(d[0]); })
             .attr("cy", function(d) { return yScale(d[1]); })
             .attr("r", 3)
             .on("click", function(d) {
                 changePlot(d[3]);
             });

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);
}

// show PCA results in multiple small plots
function plotPCAMultiple(data) {
    var xExtent = d3.extent(data, function(row) { return row[0]; });
    var yExtent = d3.extent(data, function(row) { return row[1]; });

    var plotWidth = 400;
    var plotHeight = 400;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale);
    var yAxis = d3.svg.axis().scale(yScale);

    function sortFunction(type) {
        var fun = function(a, b) {
            if (a[2] == type) return 1;
            else if (b[2] == type)
                return -1;
            else
                return 0;
        }
        return fun;
    }

    var typeList = [1,2,4,5,6];
    for (var i = 0; i < typeList.length; i ++) {
        // sort the data so that the selected type comes last so
        // that the selected type is always on top of other types.
        data.sort(sortFunction(typeList[i]));

        svgSel = d3.select("#plotPCAMultiple")
                   .append("svg")
                   .attr("width", plotWidth)
                   .attr("height", plotHeight)

        circleSel = svgSel.selectAll("circle").data(data).enter()

        circleSel.append("circle")
                 .attr("stroke", "none")
                 .attr("opacity", "0.2")
                 .attr("fill", function(d) {
                     if (d[2] == typeList[i])
                         return getColorCode(typeList[i]);
                     else
                         return "#bdbdbd"; })
                 .attr("cx", function(d) { return xScale(d[0]); })
                 .attr("cy", function(d) { return yScale(d[1]); })
                 .attr("r", 3)
                 .on("click", function(d) {
                    changePlot(d[3]);
                 });

        svgSel.append("g")
              .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
              .call(xAxis);

        yAxis.orient("left");
        svgSel.append("g")
              .attr("transform", "translate(50, 0)")
              .call(yAxis);
    }
}

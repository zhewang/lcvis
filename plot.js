var objs = {};

var plots = {};

//var path = "data/data_new/";
var path = "data_raw/"

function changePlot(newPlotId) {
    var period = objs[newPlotId].period;
    // clear previous plot
    d3.select("#plot").selectAll("svg").remove();

    // plot current selection
    plotObject(newPlotId, period);
    document.getElementById("selection").childNodes[0].children[objs[newPlotId].index].selected = true;
}

function simpleDot(sel) {
    sel.attr("fill", "black")
        .attr("stroke", "none")
        .attr("r", 2.5)
        .attr("fill-opacity", 0.5);
}

d3.csv(path + "object_list.csv", function(csv) {
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

    // load attributes
    d3.json(path+"PLV_LINEAR.json", function(data) {
        for (var i=0; i < data.data.length; ++i) {
            var id = data.data[i].LINEARobjectID;
            objs[id]["LinearAttrs"] = data.data[i];
        }

        // plot the first object when starting
        plotObject(csv[0].id, csv[0].period);
    });

});

//////////////////////////////////////////////////////////////////////////////
// plot a periodic astro-object
function plotObject(id, period) {
    var data_file = path + id.toString()+".dat.json";
    var error_file = path + id.toString()+".error.json";

    d3.json(data_file, function(json) {
        // Load Data
        for (var i=0; i<json.length; ++i) {
            json[i].time = Number(json[i].time);
            json[i].mag = Number(json[i].mag);
            json[i].error = Number(json[i].error);
        }

        // plot mag vs. time
        plotTimeMag(json, 330, 200);
        if (period > 0) {
            var curve_data_file = path+id.toString()+".fit.json";
            var points = [];
            d3.json(curve_data_file, function(curve_data) {
                for (var i = 0; i < curve_data[0].mag.length; ++i) {
                    points[i] = {'x': Number(curve_data[0].phase[i]),
                                 'y': Number(curve_data[0].mag[i])
                                };
                }

                // plot mag vs. phase
                plotPhaseMag(json, period, points, 330, 200);

                // plot scaled mag vs. phase
                plotPhaseMagScaled(json, period, points, 360, 250);

                // plot the result of PCA
                plotPCA();
            });
        }
    });

    d3.json(error_file, function(json) {
        plotErrorHistogram(json, 300, 250);
    });

    plotLinearAttribute(id);
};

//////////////////////////////////////////////////////////////////////////////
function createLinearAttribute(id) {
    var plot = {};

    var data = objs[id].LinearAttrs;
    delete data.LINEARobjectID;
    var keys = Object.keys(data);

    var table = d3.select('#plotLinearAttribute').append('table');

    var t_header = table.append("tr")
                      .selectAll("td")
                      .data(keys)
                      .enter()
                      .append("td")
                      .html(function(d) {return d;})

    var t_content = table.append("tr")
                      .selectAll("td")
                      .data(keys)
                      .enter()
                      .append("td")
                      .html(function(d) {return data[d];})

    plot.table = table;
    plot.t_header = t_header;
    plot.t_content = t_content;

    return plot;
}

function plotLinearAttribute(id) {
    d3.select("#plotLinearAttribute").select("table").remove();
    createLinearAttribute(id);
}

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
            .call(simpleDot)
            .attr("cx", function(d) { return xScale(d.time); })
            .attr("cy", function(d) { return yScale(d.mag); });
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
            sel.call(simpleDot)
                .attr("cx", function(d) { return xScale(d.phase + shift); })
                .attr("cy", function(d) { return yScale(d.mag); });
        };
    };

    plot.setLineProperties = function(shift) {
        return function(sel) {
            sel.call(simpleDot)
                .attr("stroke", "black")
                .attr("x1", function(d) { return xScale(d.phase + shift); })
                .attr("x2", function(d) { return xScale(d.phase + shift); })
                .attr("y1", function(d) { return yScale(d.mag - d.error); })
                .attr("y2", function(d) { return yScale(d.mag + d.error); });
        };
    };

    var svgSel = d3.select("#plotPhaseMag")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    plot.svgSel = svgSel;
    plot.lineSel = svgSel.append("g");
    plot.circleSel = svgSel.append("g").attr("display", "none");
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


    plot.circleSel.selectAll("circle").remove(); // Ungh.
    var circleJoin = plot.circleSel.selectAll("circle").data(data).enter();

    circleJoin.append("circle")
        .call(plot.setCircleProperties(0));

    circleJoin.append("circle")
        .filter(function(d) { return d.phase - 1 >= -0.5; })
        .call(plot.setCircleProperties(-1));

    circleJoin.append("circle")
        .filter(function(d) { return d.phase + 1 <= 1.5; })
        .call(plot.setCircleProperties(1));

    plot.lineSel.selectAll("line").remove(); // Ungh.
    var lineJoin = plot.lineSel.selectAll("line").data(data).enter();

    lineJoin.append("line")
        .call(plot.setLineProperties(0));
    lineJoin.append("line")
        .filter(function(d) { return d.phase - 1 >= -0.5; })
        .call(plot.setLineProperties(-1));
    lineJoin.append("line")
        .filter(function(d) { return d.phase + 1 <= 1.5; })
        .call(plot.setLineProperties(1));

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
        .call(simpleDot)
        .attr("cx", function(d) { return xScale(d.phase); })
        .attr("cy", function(d) { return yScale(d.mag-magAverage); });

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
    d3.json(path + "/pca.json", function(data) {

    var xExtent = d3.extent(data, function(row) { return row[0]; });
    var yExtent = d3.extent(data, function(row) { return row[1]; });

    var plotWidth = 600;
    var plotHeight =600;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);
    var colorScale = d3.scale.ordinal().domain([1,2,4,5,6,3,7,8,9,11,0]).range([
       "#e41a1c",
       "#377eb8",
       "#4daf4a",
       "#984ea3",
       "#ff7f00",
       "#00ffff",
       "#00ffff",
       "#00ffff",
       "#00ffff",
       "#00ffff",
       "#00ffff"
    ]);

    var namesScale = d3.scale.ordinal().domain([1,2,4,5,6,3,7,8,9,11,0]).range([
        "RR Lyr ab",
        "RR Lyr c",
        "Algol-like with 2 minima",
        "Contact binary",
        "delta Scu/SX Phe",
        "Algol-like with 1 minima",
        "Long-period variable",
        "heartbeat candidates",
        "BL Her",
        "anomalous Cepheids",
        "other"
    ]);

    var svgSel = d3.select("#plotPCA")
            .append("svg")
            .attr("width", plotWidth)
            .attr("height", plotHeight);


    // LCType legend
    var legendSel = svgSel.append("g").attr("transform","translate(60,420)");
    var legendG = legendSel.selectAll("g")
            .data(colorScale.domain())
            .enter()
            .append("g")
            .classed("clickable", true);

    legendG.append("rect")
           .attr("width",10)
           .attr("height",10)
           .attr("fill", function(d) { return colorScale(d); })
           .attr("y", function(d, i) { return i * 11; });

    legendG.append("text")
           .text(function(d) { return namesScale(d); })
           .attr("x", 12)
           .attr("y", function(d, i) { return i * 11 + 10; }).classed("legend", true);

    var circleSel = svgSel.selectAll("circle").data(data).enter();

    function setDotColors(sel) {
        sel.attr("fill", function(d) { return colorScale(d[2]); })
            .attr("fill-opacity", 0.3)
            .attr("stroke", "none");
    }

    circleSel.append("circle")
            .classed("clickable", true)
            .call(setDotColors)
            .attr("cx", function(d) { return xScale(d[0]); })
            .attr("cy", function(d) { return yScale(d[1]); })
            .attr("r", 3)
            .on("mouseover", function(d) {
                changePlot(d[3]);
            });

    var allCircles = svgSel.selectAll("circle");

    legendG.on("mouseover", function(type) {
        var s = allCircles;
        s.filter(function(d) { return d[2] !== type; })
            .attr("fill", "gray")
            .attr("fill-opacity", 0.1);
        s.filter(function(d) { return d[2] === type; })
            .attr("fill-opacity", 0.5);
        s.sort(function(a, b) {
            if (a[2] !== type) { a = -1; } else { a = 1; }
            if (b[2] !== type) { b = -1; } else { b = 1; }
            return d3.ascending(a, b);
        });
    }).on("mouseout", function(type) {
        allCircles.call(setDotColors);
    });

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);

    // plot matrix weight
    var axesSel = svgSel.append("g");
    var axesLegend = svgSel.append("g");
    d3.json(path+"pca_matrix.json", function(m) {
        var xs = m[0], ys = m[1];
        axesSel.selectAll("line")
            .data(xs)
            .enter()
            .append("line")
            .attr("x1",xScale(0))
            .attr("y1",yScale(0))
            .attr("x2",function(d,i) { return xScale(m[0][i] * 20); })
            .attr("y2",function(d,i) { return yScale(m[1][i] * 20); })
            .attr("stroke", function(d, i) {
                return d3.hcl(i / 50 * 360, 50, 50);
            });

        axesLegend.selectAll("line")
            .data(xs)
            .enter()
            .append("line")
            .attr("x1",500)
            .attr("y1",500)
            .attr("x2",function(d,i) { return 500 + 20 * Math.cos(i / 50 * Math.PI * 2); })
            .attr("y2",function(d,i) { return 500 + 20 * Math.sin(i / 50 * Math.PI * 2); })
            .attr("stroke", function(d, i) {
                return d3.hcl(i / 50 * 360, 50, 70);
            })
            .attr("stroke-width", 3);


    });

    });
}

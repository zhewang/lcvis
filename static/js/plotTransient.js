var path = "data/";
var data, dataById;
var plots = {};

function plotPCA(data) {
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
    function setDotColors(sel) {
        sel.attr("fill", "black") // function(d) { return colorScale(d[2]); })
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
            plotPhaseMagScaled(d[2].id, 500, 200);
        });

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);
}

//////////////////////////////////////////////////////////////////////////////

function createPhaseMagScaledPlot(id, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;
    var curve = dataById[id];

    var xScale = d3.scale.linear().domain([0, 1]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
    var yAxis = d3.svg.axis().scale(yScale);
    yAxis.orient("left");

    var svgSel = d3.select("#plotLightCurve")
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

function plotPhaseMagScaled(id, width, height) {
    if (!plots.phaseMagScale) {
        plots.phaseMagScale = createPhaseMagScaledPlot(id, width, height);
    }
    var curve = dataById[id];
    var plot = plots.phaseMagScale;
    var timeExtent = [0,1];
    var magExtent = d3.extent(curve[2].splinedata);
    var plotWidth = width;
    var plotHeight = height;
    var xScale = plot.xScale;
    var yScale = plot.yScale;
    var xAxis = plot.xAxis;
    var yAxis = plot.yAxis;
    var svgSel = plot.svgSel;
    yScale.domain(magExtent);

    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);

    // plot curve
    var lineFunction = d3.svg.line()
        .x(function(d, i) { return xScale(i/20); })
        .y(function(d) { return yScale(d); })
        .interpolate("basis");

    plot.curveSel.selectAll("path").remove();
    plot.curveSel.append('path')
          .attr('d', lineFunction(curve[2].splinedata))
          .attr('stroke', 'blue')
          .attr('stroke-width', '2')
          .attr('fill', 'none');
};

//////////////////////////////////////////////////////////////////////////////

d3.json(path + "pca_transients.json", function(j) {
    data = j;

    dataById = {};
    for (var i=0; i<j.length; ++i) {
        dataById[j[i][2].id] = j[i];
    }
    plotPCA(data);
    debugger;
    plotPhaseMagScaled(data[0][2].id, 500, 200);
});

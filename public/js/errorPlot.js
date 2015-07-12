function createErrorHistogram(data, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;
    var xScale = d3.scale.linear().domain(d3.extent(data)).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().range([plotHeight-30, 30]);
  
    var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);
    yAxis.orient("left");
    var svgSel = d3.select("#plotErrorHistogram")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);
    plot.svgSel = svgSel;
    plot.xAxisGroup = svgSel.append("g")
        .attr("transform", "translate(0, "+(plotHeight-30).toString()+")");
    plot.yAxisGroup = svgSel.append("g")
        .attr("transform", "translate(50, 0)");

    //////////////////////////////////////////////////////////////////////////
    // from http://bl.ocks.org/mbostock/3048450    

    plot.xScale = xScale;
    plot.yScale = yScale;
    plot.xAxis = xAxis;
    plot.yAxis = yAxis;
    return plot;    
}

function plotErrorHistogram(data, width, height) {
    if (!plots.errorHistogram) {
        plots.errorHistogram = createErrorHistogram(data, width, height);
    }
    var plot = plots.errorHistogram;
    var xScale = plot.xScale;
    xScale.domain(d3.extent(data));
    var hist = d3.layout.histogram().bins(plot.xScale.ticks(20))(data);
    var yScale = plot.yScale;
    plot.yScale.domain([0, d3.max(hist, function(d) { return d.y; })]);

    function setBarAttrs(sel) {
        sel.attr("class", "bar")
            .attr("transform", function(d) { 
                return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
            });
    }
    function setRectAttrs(sel) {
        sel.attr("x", 1)
            .attr("y", 1)
            .attr("width", (xScale(hist[1].x) - xScale(hist[0].x)) - 1)
            .attr("height", function(d) { 
                return height-30 - yScale(d.y);
            })
            .attr("fill", "gray");
    }
    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);
    plot.svgSel.selectAll(".bar").remove(); // i lose, FIXME
    var barJoin = plot.svgSel.selectAll(".bar")
        .data(hist);
    var t = barJoin.enter().append("g")
        .call(setBarAttrs)
        .append("rect");
    t.call(setRectAttrs);
    barJoin.exit().remove();
    barJoin.call(setBarAttrs);
    barJoin.selectAll("rect").call(setRectAttrs);


    // barSel.append("rect")
    //     .attr("x", 1)
    //     .attr("y", 0)
    //     .attr("width", (xScale(hist[1].x) - xScale(hist[0].x)) - 1)
    //     .attr("height", function(d) { return plotHeight-30 - yScale(d.y); })
    //     .attr("fill", "gray");

    // plot.xAxisGroup.call(xAxis);
    // plot.yAxisGroup.call(yAxis);
    // plot.barSel = barSel;
}

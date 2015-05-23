function plotTimeMag(data, width, height) {
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });

    // Plot mag vs. time
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().domain(timeExtent).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain([magExtent[1], magExtent[0]]).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale);
    var yAxis = d3.svg.axis().scale(yScale);

    svgSel = d3.select("#plot")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight)

    yAxis.orient("left");
    svgSel.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("fill", "red")
          .attr("stroke", "black")
          .attr("cx", function(d) { return xScale(d.time); })
          .attr("cy", function(d) { return yScale(d.mag); })
          .attr("r", 3);

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);
};

function plotPhaseMag(data, period, width, height) {
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });

    for(var i = 0; i < data.length; i ++) {
        t = data[i].time - timeExtent[0]
        data[i].phase= t/period - Math.floor(t/period);
    }
    var phaseExtent = d3.extent(data, function(row) { return row.phase; });

    // Plot mag vs. time
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().domain([-0.5, 1.5]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain([magExtent[1], magExtent[0]]).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
    var yAxis = d3.svg.axis().scale(yScale);

    svgSel = d3.select("#plot")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight)

    yAxis.orient("left");
    svgSel.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("fill", "red")
          .attr("stroke", "black")
          .attr("cx", function(d) { return xScale(d.phase); })
          .attr("cy", function(d) { return yScale(d.mag); })
          .attr("r", 3);

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);
};

d3.json("allDAT/29848.dat.json", function(json) {
    // Load Data
    for (var i=0; i<json.length; ++i) {
        json[i].time = Number(json[i].time);
        json[i].mag = Number(json[i].mag);
        json[i].error = Number(json[i].error);
    }
    var period = 0.557009;

    plotTimeMag(json, 1000, 400);
    plotPhaseMag(json, period, 1000, 400);
});

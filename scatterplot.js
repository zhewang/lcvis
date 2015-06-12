d3.csv("data/object_list.csv", function(csv) {
    for (var i=0; i<csv.length; ++i) {
        csv[i].id= Number(csv[i].id);
        csv[i].period= Number(csv[i].period);
    }
    var select = d3.select("#selection").append("select")

    select.on("change", function() {
        var id = this.options[this.selectedIndex].text.split(" ")[0];
        var period = this.options[this.selectedIndex].value;

        // clear previous plot
        d3.select("#plot").selectAll("svg").remove();

        // plot current selection
        plotObject(id, period);
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

    plotObject(csv[0].id, csv[0].period);
});

function plotObject(id, period) {
    var data_file = "data/"+id.toString()+".dat.json";

    d3.json(data_file, function(json) {
        // Load Data
        for (var i=0; i<json.length; ++i) {
            json[i].time = Number(json[i].time);
            json[i].mag = Number(json[i].mag);
            json[i].error = Number(json[i].error);
        }

        plotTimeMag(json, 1000, 400);
        if (period > 0) {
            var curve_data_file = "data/"+id.toString()+".fit.json";
            var points = [];
            d3.json(curve_data_file, function(curve_data) {
                for (var i = 0; i < curve_data[0].mag.length; ++i) {
                    points[i] = {'x': Number(curve_data[0].phase[i]),
                                 'y': Number(curve_data[0].mag[i])}
                }

                plotPhaseMag(json, period, points, 1000, 400);
                plotPhaseMagScaled(json, period, points, 500, 400);
            });
        }
    });
};

function plotTimeMag(data, width, height) {
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });

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

function plotPhaseMag(data, period, curve_points, width, height) {
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });

    for(var i = 0; i < data.length; i ++) {
        t = data[i].time - timeExtent[0]
        data[i].phase = t/period - Math.floor(t/period);
    }

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

    circleSel = svgSel.selectAll("circle").data(data).enter()

    circleSel.append("circle")
             .attr("fill", "red")
             .attr("stroke", "black")
             .attr("cx", function(d) { return xScale(d.phase); })
             .attr("cy", function(d) { return yScale(d.mag); })
             .attr("r", 3);

    circleSel.append("circle")
             .filter(function(d) { return d.phase - 1 >= -0.5; })
             .attr("fill", "red")
             .attr("stroke", "black")
             .attr("cx", function(d) { return xScale(d.phase-1); })
             .attr("cy", function(d) { return yScale(d.mag); })
             .attr("r", 3);

    circleSel.append("circle")
             .filter(function(d) { return d.phase + 1 <= 1.5; })
             .attr("fill", "red")
             .attr("stroke", "black")
             .attr("cx", function(d) { return xScale(d.phase+1); })
             .attr("cy", function(d) { return yScale(d.mag); })
             .attr("r", 3);

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);

    // plot curve
    var lineFunction = d3.svg.line()
                         .x(function(d) { return xScale(d.x); })
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

    svgSel.append('path')
          .attr('d', lineFunction(curve_points))
          .attr('stroke', 'blue')
          .attr('stroke-width', '2')
          .attr('fill', 'none')
};

function plotPhaseMagScaled(data, period, curve_points, width, height) {
    var timeExtent = d3.extent(data, function(row) { return row.time; });
    var magExtent = d3.extent(data, function(row) { return row.mag; });
    var magAverage = d3.mean(data, function(row) {return row.mag});

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
        t = data[i].time - timeExtent[0]
        data[i].phase = shiftFunction(t/period - Math.floor(t/period));
    }

    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().domain([0, 1]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain([1, -1]).range([plotHeight-30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
    var yAxis = d3.svg.axis().scale(yScale);

    svgSel = d3.select("#plot")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight)

    circleSel = svgSel.selectAll("circle").data(data).enter()

    circleSel.append("circle")
             .attr("fill", "red")
             .attr("stroke", "black")
             .attr("cx", function(d) { return xScale(d.phase); })
             .attr("cy", function(d) { return yScale(d.mag-magAverage); })
             .attr("r", 3);

    svgSel.append("g")
          .attr("transform", "translate(0, "+(plotHeight-30).toString()+")")
          .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
          .attr("transform", "translate(50, 0)")
          .call(yAxis);

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

    svgSel.append('path')
          .attr('d', lineFunction(curve_points))
          .attr('stroke', 'blue')
          .attr('stroke-width', '2')
          .attr('fill', 'none')
};

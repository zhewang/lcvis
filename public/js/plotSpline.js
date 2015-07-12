var path = "data/";

function plotSpline(data, width, height) {
    var timeExtent = d3.extent(data[0].phase);
    var magExtent = d3.extent(data[0].splinedata);

    var plotWidth = width;
    var plotHeight = height;

    console.log(timeExtent);
    console.log(magExtent);

    var xScale = d3.scale.linear().domain([-15, 40]).range([50, plotWidth-30]);
    var yScale = d3.scale.linear().domain([5, -0.5]).range([plotHeight-30, 30]);

    var svgSel = d3.select("#plotSpline")
               .append("svg")
               .attr("width", plotWidth)
               .attr("height", plotHeight);

    var lineFunction = d3.svg.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); })
        .interpolate("basis");

    // generate points list for data
    var curve_points = []
    for(var i = 0; i < data.length; i ++) {
        points = []
        for(var j = 0; j < data[i].phase.length; j ++) {
            points[j] = {'x':data[i].phase[j], 'y':data[i].splinedata[j]};
        }
        curve_points[i] = {'points':points, 'id':data[i].id};
    }

    svgSel.selectAll("path")
          .data(curve_points)
          .enter()
          .append("path")
          .attr('d', function(d) { return lineFunction(d.points);})
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .on('mouseover', function(d){
              var element = document.getElementById("objectID");
              element.innerHTML = "ID: "+d.id;
          })
};

//////////////////////////////////////////////////////////////////////////////

d3.json(path + "clean_splinedata.json", function(data) {
    plotSpline(data, 400, 600);
});

var PATH = "/static/data/";

d3.json(PATH+"list.json", function(json) {
    var listCount = 0;
    var OBJS = [];

    var plotAfterLoadingFinished = function (count) {
        if(count == json.surveys.length) {
            console.log("plot ra dec");
            plotRaDec(OBJS);
        }
    };

    for(var i = 0; i < json.surveys.length; i++) {
        d3.json(PATH+json.surveys[i], function(d) {
            for(var j = 0; j < d.data.length; j++) {
                OBJS.push(d.data[j]);
            }
            listCount ++;
            plotAfterLoadingFinished(listCount);
        });
    }
});

d3.json(PATH+"pca.json", function(json) {
    plotPCA(json);
});

function plotRaDec(data) {
    var xExtent = d3.extent(data, function(row) {
        return Number(row.ra);
    });
    var yExtent = d3.extent(data, function(row) {
        return Number(row.dec);
    });

    var plotWidth = 500;
    var plotHeight = 500;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight - 30, 30]);

    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    d3.select("#ra_dec_scatter").select('svg').remove();
    var svgSel = d3.select("#ra_dec_scatter")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    function setDotColors(sel) {
        sel.attr("fill", 'black')
        .attr("fill-opacity", 0.15)
        .attr("stroke", "none")
        .attr("cx", function(d) {
            return xScale(d.ra);
        })
        .attr("cy", function(d) {
            return yScale(d.dec);
        })
        .attr("r", 3)
        .classed("clickable", true)
        .on("mouseover", function(d) {
            console.log(d.uid);
        });
    }

    var circleSel = svgSel.selectAll("circle").data(data).enter()
        .append("circle")
        .classed("clickable", true)
        .call(setDotColors);

    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);
}


function plotPCA(data) {
    var xExtent = d3.extent(data, function(row) {
        return Number(row[0]);
    });
    var yExtent = d3.extent(data, function(row) {
        return Number(row[1]);
    });

    var plotWidth = 500;
    var plotHeight = 500;

    xExtent = [-10, 10];
    yExtent = [-10, 10];

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight - 30, 30]);

    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    d3.select("#plotPCA").select('svg').remove();
    var svgSel = d3.select("#plotPCA")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    function setDotColors(sel) {
        sel.attr("fill", function(d) {
            return 'red';
        })
        .attr("fill-opacity", 0.15)
        .attr("stroke", "none")
        .attr("cx", function(d) {
            return xScale(d[0]);
        })
        .attr("cy", function(d) {
            return yScale(d[1]);
        })
        .attr("r", 3)
        .classed("clickable", true)
        .on("mouseover", function(d) {
            console.log(d[2]);
        });
    }

    var circleSel = svgSel.selectAll("circle").data(data).enter()
        .append("circle")
        .classed("clickable", true)
        .call(setDotColors);

    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);
}

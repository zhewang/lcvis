var objs = {};
var pca_data;
var plots = {};
var bandB = {};
var bandR = {};
var bandU = {};
var bandV = {};

var path = "/static/data/";

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

d3.json(path + "/SplinedataB.txt", function(data) {
    for(var i = 0; i < data.length; i ++) {
        bandB[data[i].id] = data[i];
    }
});
d3.json(path + "/SplinedataR.txt", function(data) {
    for(var i = 0; i < data.length; i ++) {
        bandR[data[i].id] = data[i];
    }
});
d3.json(path + "/SplinedataU.txt", function(data) {
    for(var i = 0; i < data.length; i ++) {
        bandU[data[i].id] = data[i];
    }
});
d3.json(path + "/SplinedataV.txt", function(data) {
    for(var i = 0; i < data.length; i ++) {
        bandV[data[i].id] = data[i];
    }
});

// plot the result of PCA
d3.json(path + "/pca_supernova.json", function(data) {
    pca_data = data;
    plotPCA(data);
});

function plotObject(id) {
    var width = 330;
    var height = 300;
    plotBand('B', bandB[id], width, height);
    plotBand('R', bandR[id], width, height);
    plotBand('U', bandU[id], width, height);
    plotBand('V', bandV[id], width, height);
};


//////////////////////////////////////////////////////////////////////////////

function createBandPlot(band, width, height) {
    var plot = {};
    var plotWidth = width;
    var plotHeight = height;

    var xScale = d3.scale.linear().range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().range([plotHeight - 30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    plot.xScale = xScale;
    plot.yScale = yScale;
    plot.xAxis = xAxis;
    plot.yAxis = yAxis;
    yAxis.orient("left");

    var svgSel = d3.select("#band"+band+"")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

    svgSel.append('text')
        .attr('x', width/2-10)
        .attr('y', 30)
        .text("Band "+band)

    plot.svgSel = svgSel;
    plot.xAxisGroup = svgSel.append("g").attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")");
    plot.yAxisGroup = svgSel.append("g").attr("transform", "translate(50, 0)");
    return plot;
}

function plotBand(band, raw_data, width, height) {
    if (!plots[band]) {
        plots[band] = createBandPlot(band, width, height);
    }


    data = [];
    if (raw_data != null) {
        for(var i = 0; i < raw_data.spldata_sampled.length; i ++) {
            data[i] = {"time": raw_data.mjddata_sampled[i], "mag": raw_data.spldata_sampled[i]};
        }
    }

    var plot = plots[band];

    var timeExtent = d3.extent(data, function(row) {
        return row.time;
    });
    var magExtent = d3.extent(data, function(row) {
        return row.mag;
    });

    var plotWidth = width;
    var plotHeight = height;

    var xScale = plot.xScale.domain(timeExtent);
    var yScale = plot.yScale.domain([magExtent[1], magExtent[0]]);

    var svgSel = plot.svgSel;

    var lineFunction = d3.svg.line()
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.mag); })
        .interpolate("basis");

    svgSel.selectAll('path').remove();
    svgSel.append('path')
        .attr('d', lineFunction(data))
        .attr('stroke', 'blue')
        .attr('stroke-width', 1)
        .attr('fill', 'none')

    plot.xAxisGroup.call(plot.xAxis);
    plot.yAxisGroup.call(plot.yAxis);
};

function plotPCA(data) {
    var xExtent = d3.extent(data, function(row) {
        return row[0];
    });
    var yExtent = d3.extent(data, function(row) {
        return row[1];
    });

    var plotWidth = 600;
    var plotHeight = 600;

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight - 30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);
    var colorScale = d3.scale.ordinal().domain([1, 2]).range([
        "#e41a1c",
        "#377eb8"
    ]);

    var namesScale = d3.scale.ordinal().domain([1, 2]).range([
        "type 1",
        "type 2"
    ]);

    d3.select("#plotPCA").select('svg').remove();
    var svgSel = d3.select("#plotPCA")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

    var legendSel = svgSel.append("g").attr("transform", "translate(60,520)");
    var legendG = legendSel.selectAll("g")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .classed("clickable", true);

    legendG.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", function(d) {
        return colorScale(d);
    })
    .attr("y", function(d, i) {
        return i * 11;
    });

    legendG.append("text")
    .text(function(d) {
        return namesScale(d);
    })
    .attr("x", 12)
    .attr("y", function(d, i) {
        return i * 11 + 10;
    }).classed("legend", true);

    var circleSel = svgSel.selectAll("circle").data(data).enter();

    var pinnedDotSel = null;

    function setDotColors(sel) {
        sel.attr("fill", function(d) {
            return colorScale(d[2]);
        })
        .attr("fill-opacity", 0.3)
        .attr("stroke", "none")
        .attr("cx", function(d) {
            return xScale(d[0]);
        })
        .attr("cy", function(d) {
            return yScale(d[1]);
        })
        .attr("r", function(d) {
            return d[2] < 0 ? 6 : 3;
        })
        .classed("clickable", true)
        .on("mouseover", function(d) {
            if (pinnedDotSel === null)
                plotObject(d[3]);
        })
        .on('click', highlightDot);
    }

    function highlightDot(d) {
        d3.event.stopPropagation();

        if (d3.select(this).classed('pinned')) {
            unhighlightDot(pinnedDotSel);
            return;
        }

        if (pinnedDotSel !== null) {
            unhighlightDot(pinnedDotSel);
        }

        pinnedDotSel = d3.select(this);

        pinnedDotSel.attr("fill-opacity", 1)
        .attr('r', 6)
        .attr('stroke', 'black')
        .classed('pinned', true)
        .moveToFront();

        changePlot(d[3]);

        //show other information associated with this dot
        //sdss = (objs[d[3]].SDSS);
        //var imgsrc = 'http://skyservice.pha.jhu.edu/DR12/ImgCutout/getjpeg.aspx?ra=' + sdss.RA + '&dec=' + sdss.Dec + '&scale=0.4&width=280&height=280&opt=L&query=&Label=on';
        //d3.select("#obj_img").append("img")
        //.attr('src', imgsrc);
    }

    function unhighlightDot(sel) {
        sel.attr("fill-opacity", 0.3)
        .attr("r", function(d) {
            return d[2] < 0 ? 6 : 3;
        })
        .attr('stroke', 'none')
        .classed('pinned', false);
        pinnedDotSel = null;

        d3.select("#obj_img").select("img").remove();
    }

    circleSel.append("circle")
    .classed("clickable", true)
    .call(setDotColors);

    var allCircles = svgSel.selectAll("circle");

    // reset dot color when click on blank area
    svgSel.on("click", function() {
        allCircles.call(setDotColors);

        if (pinnedDotSel !== null)
            unhighlightDot(pinnedDotSel);
    })

    legendG.on("click", function(type) {
        d3.event.stopPropagation();

        if (pinnedDotSel !== null)
            unhighlightDot(pinnedDotSel);

        var s = allCircles;
        s.filter(function(d) {
            return d[2] !== type;
        })
        .attr("fill", "gray")
        .attr("fill-opacity", 0.1)
        .classed("clickable", false)
        .on('click', function() {
            d3.event.stopPropagation();
        })
        .on("mouseover", function(d) {});
        s.filter(function(d) {
            return d[2] === type;
        })
        .attr("fill", colorScale(type))
        .attr("fill-opacity", 0.5)
        .classed("clickable", true)
        .on("mouseover", function(d) {
            if (pinnedDotSel === null)
                plotObject(d[3]);
        });
        s.sort(function(a, b) {
            if (a[2] !== type) {
                a = -1;
            } else {
                a = 1;
            }
            if (b[2] !== type) {
                b = -1;
            } else {
                b = 1;
            }
            return d3.ascending(a, b);
        });
    });

    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);
}


var PATH = "/static/data/";
var OBJS = [];

d3.json(PATH+"list.json", function(json) {
    var listCount = 0;

    var plotAfterLoadingFinished = function (count) {
        if(count == json.surveys.length) {
            data = [];
            for(var key in OBJS) {
                data.push(OBJS[key]);
            }

            plotRaDec(data);
            plotPeriodHist(data);
        }
    };

    for(var i = 0; i < json.surveys.length; i++) {
        // load meta data
        d3.json(PATH+json.surveys[i]+'_meta.json', function(d) {
            for(var j = 0; j < d.data.length; j++) {
                OBJS[d.data[j].uid] = d.data[j];
            }
            listCount ++;
            plotAfterLoadingFinished(listCount);
        });
    }
});

function plotPeriodHist(data) {
    // divide data into bins
    var pExtent = d3.extent(data, function(row) {
        return Number(row.P);
    });
    var binCount = 10;
    // {'count': 10, 'data':[[],[],[],...]}
    var binData = new Array(binCount);
    for(var i = 0 ; i < binCount; i ++) {
        binData[i] = [];
    }

    var step = (pExtent[1]-pExtent[0])/binCount;
    for(var i = 0; i < data.length; i ++) {
        var index = Math.floor((data[i].P-pExtent[0])/step);
        if(index >= binCount) {
            index = binCount-1;
        }
        binData[index].push(data[i]);
    }

    // plot histogram
}


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

    // Scatter plot
    var setDotColors = function (sel) {
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
            //console.log(d.uid);
        });
    };

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

    // Brush
    var brush = svgSel.append("g")
        .attr("class", "brush")
        .call(d3.svg.brush()
        .x(xScale)
        .y(yScale)
        .on("brush", brushmove)
        .on("brushend", brushend));

    function brushmove() {
        var extent = d3.event.target.extent();
        var uids = [];
        for(var key in OBJS) {
            if(OBJS[key].ra >= extent[0][0] &&
               OBJS[key].dec >= extent[0][1] &&
               OBJS[key].ra <= extent[1][0] &&
               OBJS[key].dec <= extent[1][1]) {
                uids.push(OBJS[key].uid);
            }
        }
        calculatePCA(uids);
    };

    function brushend() {
        if (d3.event.target.empty()) {
            var uids = [];
            for(var key in OBJS) {
                uids.push(OBJS[key].uid);
            }
            calculatePCA(uids);
        }
    };

    // plot PCA over all objs at first
    uids = [];
    for(var key in OBJS) {
        uids.push(OBJS[key].uid);
    }
    calculatePCA(uids);

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
            //console.log(d[2]);
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

function calculatePCA(uids) {
    if(uids.length > 0) {
        $.ajax({
            url: "/calculatepca",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(uids),
            success: function(d) {
                if(d.status == 'ok') {
                    plotPCA(d.data);
                } else {
                    console.log(d.status);
                }
            }
        });
    }
}

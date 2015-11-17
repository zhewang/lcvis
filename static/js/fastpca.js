var PATH = "/static/data_ogle/";
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
            //plotPeriodHist(data);
            plotHist(data, 'P');
            plotHist(data, 'I');

            // plot PCA over all objs at first
            uids = [];
            for(var key in OBJS) {
                uids.push(OBJS[key].uid);
            }
            calculatePCA(uids);
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

function plotHist(original_data, attr) {

    if(original_data.length <= 0) {
        return;
    }

    var values = [];
    for(var i = 0 ; i < original_data.length; i ++) {
        if(!isNaN(original_data[i][attr]))
            values.push(original_data[i][attr]);
    }

    // A formatter for counts.
    var formatCount = d3.format(",.0f");
    var xExtent = d3.extent(values, function(d){return d;});

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = 500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scale.linear()
    .domain(xExtent)
    .range([0, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
    .bins(x.ticks(10))
    (values);

    var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

    d3.select("#histogram").select("#"+attr+"_hist").remove();
    var svg = d3.select("#histogram").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", attr+"_hist")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
    .data(data)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });


    bar.append("rect")
    .attr("x", 1)
    .attr("width", x(data[0].dx) - x(0)-1)
    .attr("height", function(d) { return height - y(d.y); });

    bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", (x(data[0].dx)-x(0)) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.y); });

    bar.on("mouseover", function(d){
        var extent = [d.x, d.x+d.dx];
        var uids = [];
        var selectedData = [];
        for(var i = 0 ; i < original_data.length; i ++) {
            if(original_data[i][attr] >= extent[0] &&
               original_data[i][attr] < extent[1]) {
                uids.push(original_data[i].uid);
                selectedData.push(original_data[i]);
            }
        }
        calculatePCA(uids);
        //TODO: highlight selectedData
        //plotRaDec(selectedData);

    })

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    var yAxis = d3.svg.axis().scale(y).ticks(10);

    yAxis.orient("left");
    svg.append("g")
    //.attr("transform", "translate("+ margin.left +", 0)")
    .attr("transform", "translate(0, 0)")
    .call(yAxis);
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
        var selectedData = [];
        for(var i = 0; i < data.length; i ++) {
            if(data[i].ra >= extent[0][0] &&
               data[i].dec >= extent[0][1] &&
               data[i].ra <= extent[1][0] &&
               data[i].dec <= extent[1][1]) {
                uids.push(data[i].uid);
                selectedData.push(data[i]);
            }
        }
        calculatePCA(uids);
        plotHist(selectedData, "P");
        plotHist(selectedData, "I");
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

}


function plotPCA(data) {
    var plotWidth = 500;
    var plotHeight = 500;

    var xExtent = d3.extent(data, function(row) {
        return Number(row[0]);
    });
    var yExtent = d3.extent(data, function(row) {
        return Number(row[1]);
    });

    var xMax = d3.max(xExtent, function(d){return Math.abs(d);})
    var yMax = d3.max(yExtent, function(d){return Math.abs(d);})

    xExtent = [-xMax, xMax];
    yExtent = [-yMax, yMax];

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

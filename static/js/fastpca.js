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

            plotRaDecHeatmap(data);
            //plotPeriodHist(data);
            plotHist(data, 'P');
            plotHist(data, 'I');

            // plot PCA over all objs at first
            uids = [];
            for(var key in OBJS) {
                uids.push(OBJS[key].uid);
            }
            calculatePCA(uids);
            calculaAverageLC(uids);

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

    if(values.length == 0){
        return;
    }

    // A formatter for counts.
    var formatCount = d3.format(",.0f");
    var xExtent = d3.extent(values, function(d){return d;});

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = 300 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

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

    bar.on("mouseenter", function(d){
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
        calculaAverageLC(uids);
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
        calculaAverageLC(uids);
        plotHist(selectedData, "P");
        plotHist(selectedData, "I");
    };

    function brushend() {
        if (d3.event.target.empty()) {
            // TODO: optimise the speed
            var uids = [];
            var selectedData = []
            for(var key in OBJS) {
                uids.push(OBJS[key].uid);
                selectedData.push(OBJS[key]);
            }
            calculatePCA(uids);
            calculaAverageLC(uids);
            plotHist(selectedData, "P");
            plotHist(selectedData, "I");
        }
    };

}

function plotRaDecHeatmap(data) {
    // Prepare data for heatmap
    var xExtent = d3.extent(data, function(row) {
        return Number(row.ra);
    });
    var yExtent = d3.extent(data, function(row) {
        return Number(row.dec);
    });

    var heatmapSize = 50;

    var xStep = (xExtent[1]-xExtent[0]) / heatmapSize;
    var yStep = (yExtent[1]-yExtent[0]) / heatmapSize;

    var data_heatmap = new Array(heatmapSize);
    for(var i = 0; i < heatmapSize; i ++){
            data_heatmap[i] = new Array(heatmapSize);
            for(var j = 0; j < heatmapSize; j ++) {
                data_heatmap[i][j] = {"count":0, "uids":[]};
            }
    }

    for(var i = 0; i < data.length; i ++){
        var c = Math.floor((data[i].ra - xExtent[0]) / xStep);
        var r = Math.floor((data[i].dec - yExtent[0]) / yStep);
        if(c >= heatmapSize) {c = heatmapSize-1;}
        if(r >= heatmapSize) {r = heatmapSize-1;}
        data_heatmap[heatmapSize-1-r][c].count += 1;
        data_heatmap[heatmapSize-1-r][c].uids.push(data[i].uid);
    }

    // SVG
    var margin = { top: 0, right: 0, bottom: 30, left: 30 };
    var plotWidth = 500 - margin.left - margin.right;
    var plotHeight = 500 - margin.top - margin.bottom;

    //d3.select("#ra_dec_scatter").select('svg').remove();
    var svgSel = d3.select("#ra_dec_scatter")
        .append("svg")
        .attr("width", plotWidth+margin.left+margin.right)
        .attr("height", plotHeight+margin.top+margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.bottom+ ")");
    plotHeatmap(data_heatmap, svgSel, plotWidth, plotHeight);

    var xScale = d3.scale.linear().domain(xExtent).range([margin.left, plotWidth+10]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight+10, margin.bottom]);

    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    var svg = d3.select("#ra_dec_scatter").select('svg');
    svg.append("g")
    .attr("transform", "translate(0, "+(plotHeight+10).toString()+")")
    .call(xAxis);

    yAxis.orient("left");
    svg.append("g")
    .attr("transform", "translate("+margin.left+", 0)")
    .call(yAxis);

    // Brush
    var brush = svg.append("g")
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
        calculaAverageLC(uids);
        plotHist(selectedData, "P");
        plotHist(selectedData, "I");
    };

    function brushend() {
        if (d3.event.target.empty()) {
            // TODO: optimise the speed
            var uids = [];
            var selectedData = []
            for(var key in OBJS) {
                uids.push(OBJS[key].uid);
                selectedData.push(OBJS[key]);
            }
            calculatePCA(uids);
            calculaAverageLC(uids);
            plotHist(selectedData, "P");
            plotHist(selectedData, "I");
        }
    };
}

////////////////////////////////////////////////////////////////////////////////
// Scatter Plot for PCA
////////////////////////////////////////////////////////////////////////////////
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

function plotHeatmap(data, svgSel, plotWidth, plotHeight){
    var data_flatten = []
    for(var i = 0; i < data.length; i ++){
        data_flatten = data_flatten.concat(data[i]);
    }

    var colors = ["#ffffff"/*"#ffffd9"*/,"#edf8b1","#c7e9b4","#7fcdbb",
                  "#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];
    var colorScale = d3.scale.quantile()
        .domain([0, 9 - 1, d3.max(data_flatten, function (d) { return d; })])
        .range(colors);

    var gridSize = Math.floor(plotWidth / data[0].length);

    function setDotColors(sel) {
        sel.attr("fill", function(d) {
            return colorScale(d.count);
        })
        .attr("stroke", "#f0f0f0")
        .attr("x", function(d, i) {
            var x = (i%data[0].length)*gridSize;
            return x;
        })
        .attr("y", function(d, i) {
            var y = (Math.floor(i/data[0].length))*gridSize;
            return y;
        })
        .attr("width", gridSize)
        .attr("height", gridSize)
        .on("mouseover", function(d) {
            //console.log(d[2]);
        });
    }

    var circleSel = svgSel.selectAll("rect").data(data_flatten).enter()
        .append("rect")
        .call(setDotColors);
}

function plotPCAHeatmap(data) {
    var margin = { top: 0, right: 0, bottom: 30, left: 30 };
    var plotWidth = 500 - margin.left - margin.right;
    var plotHeight = 500 - margin.top - margin.bottom;

    d3.select("#plotPCA").select('svg').remove();
    var svgSel = d3.select("#plotPCA")
        .append("svg")
        .attr("width", plotWidth+margin.left+margin.right)
        .attr("height", plotHeight+margin.top+margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.bottom+ ")");
    plotHeatmap(data, svgSel, plotWidth, plotHeight);
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
                    plotPCAHeatmap(d.data);
                } else {
                    console.log(d.status);
                }
            }
        });
    }
}

function calculaAverageLC(uids){
    if(uids.length > 0) {
        $.ajax({
            url: "/calculate_average_lc",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(uids),
            success: function(d) {
                plotAverageLC(d);
            }
        });
    }

}

function plotAverageLC(data){

    var plotWidth = 500;
    var plotHeight = 300;

    var data_mean = [];
    var data_upper = [];
    var data_lower = [];
    var data_for_extent = [];
    for(var i = 0; i < data.phase.length; i ++){
        data_mean.push({'y':data.mean[i], 'x':data.phase[i]});
        data_upper.push({'y':data.mean[i]+data.std[i], 'x':data.phase[i]});
        data_lower.push({'y':data.mean[i]-data.std[i], 'x':data.phase[i]});
        data_for_extent.push(data.mean[i]+data.std[i]);
        data_for_extent.push(data.mean[i]-data.std[i]);
    }

    var xExtent = [0, 1]
    var yExtent = d3.extent(data_for_extent, function(row) {
        return Number(row);
    });

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight - 30, 30]);

    var xAxis = d3.svg.axis().scale(xScale).ticks(5);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);

    d3.select("#lightcurve").select('svg').remove();
    var svgSel = d3.select("#lightcurve")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    svgSel.selectAll("path").remove();


    var valueline = d3.svg.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); })
        .interpolate("basis");

    svgSel.append("path")
        .attr("d", valueline(data_mean))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    svgSel.append("path")
        .attr("d", valueline(data_upper))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    svgSel.append("path")
        .attr("d", valueline(data_lower))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);
}

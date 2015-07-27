var objs = {};
var pca_data;
var plots = {};

var path = "/static/data/";
// var path = "data_10/";

function changePlot(newPlotId) {
  if (newPlotId < 0) {
    console.log('unknown object');
    //TODO only show time vs mag plot
    return;
  }

  var period = objs[newPlotId].period;

  // plot current selection
  plotObject(newPlotId, period);
  document.getElementById("selection")
    .childNodes[0].children[objs[newPlotId].index].selected = true;
}

function simpleDot(sel) {
  sel.attr("fill", "black")
    .attr("stroke", "none")
    .attr("r", 2.5)
    .attr("fill-opacity", 0.5);
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

d3.csv(path + "object_list.csv", function(csv) {
  for (var i = 0; i < csv.length; ++i) {
    csv[i].id = Number(csv[i].id);
    csv[i].period = Number(csv[i].period);
    objs[csv[i].id] = {
      period: Number(csv[i].period),
      index: i
    };
  }
  var select = d3.select("#selection").append("select");

  select.on("change", function() {
    var id = this.options[this.selectedIndex].text.split(" ")[0];
    var period = this.options[this.selectedIndex].value;

    changePlot(id);
  });

  select.selectAll("option")
    .data(csv)
    .enter()
    .append("option")
    .attr("id", function(d) {
      return d.id;
    })
    .attr("value", function(d) {
      return d.period;
    })
    .text(function(d) {
      if (d.period > 0)
        return d.id;
      else
        return d.id + " *";
    });

  // load attributes
  d3.json(path + "PLV_LINEAR.json", function(data) {
    for (var i = 0; i < data.data.length; ++i) {
      var id = data.data[i].LINEARobjectID;
      objs[id]["LinearAttrs"] = data.data[i];
    }

    d3.json(path + "PLV_SDSS.json", function(data) {
      for (var i = 0; i < data.data.length; ++i) {
        var id = data.data[i].LINEARobjectID;
        objs[id]["SDSS"] = data.data[i];
      }

      // plot the first object when starting
      plotObject(csv[0].id, csv[0].period);

    });

  });

  // plot the result of PCA
  d3.json(path + "/pca.json", function(data) {
    pca_data = data;
    plotPCA(data);
  });
});

//////////////////////////////////////////////////////////////////////////////
// plot a periodic astro-object
function plotObject(id, period) {
  var data_file = path + id.toString() + ".dat.json";
  var error_file = path + id.toString() + ".error.json";

  d3.json(data_file, function(json) {
    // Load Data
    for (var i = 0; i < json.length; ++i) {
      json[i].time = Number(json[i].time);
      json[i].mag = Number(json[i].mag);
      json[i].error = Number(json[i].error);
    }

    // plot mag vs. time
    plotTimeMag(json, 330, 200);
    if (period > 0) {
      var curve_data_file = path + id.toString() + ".fit.json";
      var points = [];
      d3.json(curve_data_file, function(curve_data) {
        for (var i = 0; i < curve_data[0].mag.length; ++i) {
          points[i] = {
            'x': Number(curve_data[0].phase[i]),
            'y': Number(curve_data[0].mag[i])
          };
        }

        // plot mag vs. phase
        plotPhaseMag(json, period, points, 330, 200);

        // plot scaled mag vs. phase
        //plotPhaseMagScaled(json, period, points, 360, 250);

        d3.json(error_file, function(json) {
          plotErrorHistogram(json, 300, 300);
        });
      });
    } else {
      // clear previous plot
      d3.select("#right").selectAll("svg").remove();
      plots = {}
      plotTimeMag(json, 330, 200);
    }
  });

  plotLinearAttribute(id);
};

//////////////////////////////////////////////////////////////////////////////
function createLinearAttribute(id) {
  var plot = {};

  var data = objs[id].LinearAttrs;
  delete data.LINEARobjectID;
  var keys = Object.keys(data);

  var table = d3.select('#plotLinearAttribute').append('table');

  var t_header = table.append("tr")
    .selectAll("td")
    .data(keys)
    .enter()
    .append("td")
    .html(function(d) {
      return d;
    })

  var t_content = table.append("tr")
    .selectAll("td")
    .data(keys)
    .enter()
    .append("td")
    .html(function(d) {
      return data[d];
    })

  plot.table = table;
  plot.t_header = t_header;
  plot.t_content = t_content;

  return plot;
}

function plotLinearAttribute(id) {
  d3.select("#plotLinearAttribute").select("table").remove();
  createLinearAttribute(id);
}

//////////////////////////////////////////////////////////////////////////////

function createTimeMagPlot(data, width, height) {
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

  plot.setCircleProperties = function(sel) {
    sel
      .call(simpleDot)
      .attr("cx", function(d) {
        return xScale(d.time);
      })
      .attr("cy", function(d) {
        return yScale(d.mag);
      });
  };

  var svgSel = d3.select("#plotTimeMag")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  plot.svgSel = svgSel;
  plot.xAxisGroup = svgSel.append("g").attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")");
  plot.yAxisGroup = svgSel.append("g").attr("transform", "translate(50, 0)");
  return plot;
}

function plotTimeMag(data, width, height) {
  if (!plots.timeMag) {
    plots.timeMag = createTimeMagPlot(data, width, height);
  }
  var plot = plots.timeMag;

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

  var circleJoin = svgSel.selectAll("circle")
    .data(data);

  circleJoin.enter()
    .append("circle")
    .call(plot.setCircleProperties);

  circleJoin.call(plot.setCircleProperties);
  circleJoin.exit().remove();

  plot.xAxisGroup.call(plot.xAxis);
  plot.yAxisGroup.call(plot.yAxis);
};

//////////////////////////////////////////////////////////////////////////////

function createPhaseMagPlot(data, period, curve_points, width, height) {
  var plot = {};
  var plotWidth = width;
  var plotHeight = height;

  var xScale = d3.scale.linear().domain([-0.5, 1.5]).range([50, plotWidth - 30]);
  var yScale = d3.scale.linear().range([plotHeight - 30, 30]);
  var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
  var yAxis = d3.svg.axis().scale(yScale).ticks(5);

  plot.xScale = xScale;
  plot.yScale = yScale;
  plot.xAxis = xAxis;
  plot.yAxis = yAxis;
  yAxis.orient("left");

  plot.setCircleProperties = function(shift) {
    return function(sel) {
      sel.call(simpleDot)
        .attr("cx", function(d) {
          return xScale(d.phase + shift);
        })
        .attr("cy", function(d) {
          return yScale(d.mag);
        });
    };
  };

  plot.setLineProperties = function(shift) {
    return function(sel) {
      sel.call(simpleDot)
        .attr("stroke", "black")
        .attr("x1", function(d) {
          return xScale(d.phase + shift);
        })
        .attr("x2", function(d) {
          return xScale(d.phase + shift);
        })
        .attr("y1", function(d) {
          return yScale(d.mag - d.error);
        })
        .attr("y2", function(d) {
          return yScale(d.mag + d.error);
        });
    };
  };

  var svgSel = d3.select("#plotPhaseMag")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

  plot.svgSel = svgSel;
  plot.lineSel = svgSel.append("g");
  plot.circleSel = svgSel.append("g").attr("display", "none");
  plot.xAxisGroup = svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")");
  plot.yAxisGroup = svgSel.append("g")
    .attr("transform", "translate(50, 0)");
  plot.curveSel = svgSel.append("g");

  return plot;
}

function plotPhaseMag(data, period, curve_points, width, height) {
  if (!plots.phaseMag) {
    plots.phaseMag = createPhaseMagPlot(data, period, curve_points, width, height);
  }
  var plot = plots.phaseMag;
  var timeExtent = d3.extent(data, function(row) {
    return row.time;
  });
  var magExtent = d3.extent(data, function(row) {
    return row.mag;
  });
  var t;

  for (var i = 0; i < data.length; i++) {
    t = data[i].time - timeExtent[0];
    data[i].phase = t / period - Math.floor(t / period);
  }

  var yScale = plot.yScale.domain([magExtent[1], magExtent[0]]);
  var svgSel = plot.svgSel;


  plot.circleSel.selectAll("circle").remove(); // Ungh.
  var circleJoin = plot.circleSel.selectAll("circle").data(data).enter();

  circleJoin.append("circle")
    .call(plot.setCircleProperties(0));

  circleJoin.append("circle")
    .filter(function(d) {
      return d.phase - 1 >= -0.5;
    })
    .call(plot.setCircleProperties(-1));

  circleJoin.append("circle")
    .filter(function(d) {
      return d.phase + 1 <= 1.5;
    })
    .call(plot.setCircleProperties(1));

  plot.lineSel.selectAll("line").remove(); // Ungh.
  var lineJoin = plot.lineSel.selectAll("line").data(data).enter();

  lineJoin.append("line")
    .call(plot.setLineProperties(0));
  lineJoin.append("line")
    .filter(function(d) {
      return d.phase - 1 >= -0.5;
    })
    .call(plot.setLineProperties(-1));
  lineJoin.append("line")
    .filter(function(d) {
      return d.phase + 1 <= 1.5;
    })
    .call(plot.setLineProperties(1));

  plot.xAxisGroup.call(plot.xAxis);
  plot.yAxisGroup.call(plot.yAxis);

  // plot curve
  var lineFunction = d3.svg.line()
    .x(function(d) {
      return plot.xScale(d.x);
    })
    .y(function(d) {
      return yScale(d.y);
    })
    .interpolate("basis");

  var front_data = [];
  var end_data = [];
  for (var i = 0; i < curve_points.length; ++i) {
    if (curve_points[i].x > 0.5)
      front_data.push({
        'x': curve_points[i].x - 1,
        'y': curve_points[i].y
      });
    else
      end_data.push({
        'x': curve_points[i].x + 1,
        'y': curve_points[i].y
      });
  }
  curve_points = front_data.concat(curve_points, end_data);

  plot.curveSel.selectAll("path").remove();
  plot.curveSel.append('path')
    .attr('d', lineFunction(curve_points))
    .attr('stroke', 'blue')
    .attr('stroke-width', '2')
    .attr('fill', 'none');
};

//////////////////////////////////////////////////////////////////////////////

function createPhaseMagScaledPlot(data, period, curve_points, width, height) {
  var plot = {};
  var plotWidth = width;
  var plotHeight = height;

  var xScale = d3.scale.linear().domain([0, 1]).range([50, plotWidth - 30]);
  var yScale = d3.scale.linear().domain([1, -1]).range([plotHeight - 30, 30]);
  var xAxis = d3.svg.axis().scale(xScale).tickValues([-0.5, 0, 0.5, 1, 1.5]);
  var yAxis = d3.svg.axis().scale(yScale);
  yAxis.orient("left");

  var svgSel = d3.select("#plotPhaseMagScaled")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", plotHeight);
  plot.svgSel = svgSel;
  plot.circleSel = svgSel.append("g");
  plot.curveSel = svgSel.append("g");
  plot.xAxisGroup = svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")");
  plot.yAxisGroup = svgSel.append("g")
    .attr("transform", "translate(50, 0)");
  plot.xAxis = xAxis;
  plot.yAxis = yAxis;
  plot.xScale = xScale;
  plot.yScale = yScale;

  return plot;
}

function plotPhaseMagScaled(data, period, curve_points, width, height) {
  if (!plots.phaseMagScale) {
    plots.phaseMagScale = createPhaseMagScaledPlot(
      data, period, curve_points, width, height);
  }
  var plot = plots.phaseMagScale;
  var timeExtent = d3.extent(data, function(row) {
    return row.time;
  });
  var magExtent = d3.extent(data, function(row) {
    return row.mag;
  });
  var magAverage = d3.mean(data, function(row) {
    return row.mag;
  });
  var t;

  var max_peak = 100;
  var max_phase = -1;
  for (var i = 0; i < curve_points.length; i++) {
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

  for (var i = 0; i < data.length; i++) {
    t = data[i].time - timeExtent[0];
    data[i].phase = shiftFunction(t / period - Math.floor(t / period));
  }

  var plotWidth = width;
  var plotHeight = height;

  var xScale = plot.xScale;
  var yScale = plot.yScale;
  var xAxis = plot.xAxis;
  var yAxis = plot.yAxis;

  var svgSel = plot.svgSel;

  plot.circleSel.selectAll("circle").remove();
  var circleSel = plot.circleSel.selectAll("circle").data(data).enter();

  circleSel.append("circle")
    .call(simpleDot)
    .attr("cx", function(d) {
      return xScale(d.phase);
    })
    .attr("cy", function(d) {
      return yScale(d.mag - magAverage);
    });

  plot.xAxisGroup.call(plot.xAxis);
  plot.yAxisGroup.call(plot.yAxis);

  // plot curve
  for (var i = 0; i < curve_points.length; i++) {
    curve_points[i].x = shiftFunction(curve_points[i].x);
  }

  function sortFunction(a, b) {
    if (a.x == b.x) return 0;
    else
      return (a.x < b.x) ? -1 : 1;
  }

  curve_points.sort(sortFunction);

  var lineFunction = d3.svg.line()
    .x(function(d) {
      return xScale(d.x);
    })
    .y(function(d) {
      return yScale(d.y - magAverage);
    })
    .interpolate("basis");

  plot.curveSel.selectAll("path").remove();
  plot.curveSel.append('path')
    .attr('d', lineFunction(curve_points))
    .attr('stroke', 'blue')
    .attr('stroke-width', '2')
    .attr('fill', 'none');
};

//////////////////////////////////////////////////////////////////////////////

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
  var colorScale = d3.scale.ordinal().domain([1, 2, 4, 5, 6, 3, 7, 8, 9, 11, 0, -1]).range([
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#00ffff",
    "#00ffff",
    "#00ffff",
    "#00ffff",
    "#00ffff",
    "#00ffff",
    "black"
  ]);

  var namesScale = d3.scale.ordinal().domain([1, 2, 4, 5, 6, 3, 7, 8, 9, 11, 0]).range([
    "RR Lyr ab",
    "RR Lyr c",
    "Algol-like with 2 minima",
    "Contact binary",
    "delta Scu/SX Phe",
    "Algol-like with 1 minima",
    "Long-period variable",
    "heartbeat candidates",
    "BL Her",
    "anomalous Cepheids",
    "other",
    "User Added Object"
  ]);

  d3.select("#plotPCA").select('svg').remove();
  var svgSel = d3.select("#plotPCA")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

  var legendSel = svgSel.append("g").attr("transform", "translate(60,420)");
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
          changePlot(d[3]);
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
    sdss = (objs[d[3]].SDSS);
    var imgsrc = 'http://skyservice.pha.jhu.edu/DR12/ImgCutout/getjpeg.aspx?ra=' + sdss.RA + '&dec=' + sdss.Dec + '&scale=0.4&width=280&height=280&opt=L&query=&Label=on';
    d3.select("#obj_img").append("img")
      .attr('src', imgsrc);
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
          changePlot(d[3]);
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

  // plot matrix weight
  // var axesSel = svgSel.append("g");
  // var axesLegend = svgSel.append("g");
  // d3.json(path+"pca_matrix.json", function(m) {
  //     var xs = m[0], ys = m[1];
  //     axesSel.selectAll("line")
  //         .data(xs)
  //         .enter()
  //         .append("line")
  //         .attr("x1",xScale(0))
  //         .attr("y1",yScale(0))
  //         .attr("x2",function(d,i) { return xScale(m[0][i] * 20); })
  //         .attr("y2",function(d,i) { return yScale(m[1][i] * 20); })
  //         .attr("stroke", function(d, i) {
  //             return d3.hcl(i / 50 * 360, 50, 50);
  //         });
  //
  //     axesLegend.selectAll("line")
  //         .data(xs)
  //         .enter()
  //         .append("line")
  //         .attr("x1",500)
  //         .attr("y1",500)
  //         .attr("x2",function(d,i) { return 500 + 20 * Math.cos(i / 50 * Math.PI * 2); })
  //         .attr("y2",function(d,i) { return 500 + 20 * Math.sin(i / 50 * Math.PI * 2); })
  //         .attr("stroke", function(d, i) {
  //             return d3.hcl(i / 50 * 360, 50, 70);
  //         })
  //         .attr("stroke-width", 3);
  // });
}

///////////////////////////////////////////////////
var userObjCount = 0;

function plotUserObject() {
  var userData = testData;
  $.ajax({
    url: "/plotusers",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(userData),
    success: function(d) {
      userObjCount += 1;
      pca_data.push([d.x, d.y, -1, -1]);
      plotPCA(pca_data);
    }
  });
}

function clearUserObject() {
  while (userObjCount > 0) {
    pca_data.pop();
    userObjCount -= 1;
  }

  plotPCA(pca_data);
}

var testData =
{
"p":0.238812,
"lc":[
    {
        "error": 0.137,
        "mag": 16.879,
        "time": 52620.394606
    },
    {
        "error": 0.083,
        "mag": 16.756,
        "time": 52620.410454
    },
    {
        "error": 0.078,
        "mag": 16.85,
        "time": 52620.426248
    },
    {
        "error": 0.081,
        "mag": 16.895,
        "time": 52620.441541
    },
    {
        "error": 0.063,
        "mag": 16.774,
        "time": 52693.259008
    },
    {
        "error": 0.068,
        "mag": 16.883,
        "time": 52693.274301
    },
    {
        "error": 0.076,
        "mag": 16.983,
        "time": 52693.290976
    },
    {
        "error": 0.089,
        "mag": 17.144,
        "time": 52693.306543
    },
    {
        "error": 0.107,
        "mag": 17.298,
        "time": 52693.322037
    },
    {
        "error": 0.226,
        "mag": 17.052,
        "time": 52712.174364
    },
    {
        "error": 0.07,
        "mag": 16.899,
        "time": 52721.178647
    },
    {
        "error": 0.068,
        "mag": 16.813,
        "time": 52721.191469
    },
    {
        "error": 0.067,
        "mag": 16.85,
        "time": 52721.204258
    },
    {
        "error": 0.067,
        "mag": 16.88,
        "time": 52721.217029
    },
    {
        "error": 0.078,
        "mag": 17.01,
        "time": 52721.229877
    },
    {
        "error": 0.142,
        "mag": 16.861,
        "time": 52739.140042
    },
    {
        "error": 0.174,
        "mag": 17.052,
        "time": 52739.151398
    },
    {
        "error": 0.174,
        "mag": 17.06,
        "time": 52739.162797
    },
    {
        "error": 0.216,
        "mag": 17.3,
        "time": 52739.174195
    },
    {
        "error": 0.157,
        "mag": 16.968,
        "time": 52750.131415
    },
    {
        "error": 0.13,
        "mag": 17.138,
        "time": 52750.142004
    },
    {
        "error": 0.12,
        "mag": 17.343,
        "time": 52750.152612
    },
    {
        "error": 0.126,
        "mag": 17.361,
        "time": 52750.163222
    },
    {
        "error": 0.115,
        "mag": 17.232,
        "time": 52750.173829
    },
    {
        "error": 0.196,
        "mag": 16.776,
        "time": 52927.440593
    },
    {
        "error": 0.191,
        "mag": 16.75,
        "time": 52927.452532
    },
    {
        "error": 0.242,
        "mag": 17.046,
        "time": 52927.464198
    },
    {
        "error": 0.259,
        "mag": 17.119,
        "time": 52927.475626
    },
    {
        "error": 0.126,
        "mag": 17.106,
        "time": 52948.388871
    },
    {
        "error": 0.098,
        "mag": 16.885,
        "time": 52948.400942
    },
    {
        "error": 0.089,
        "mag": 16.838,
        "time": 52948.413059
    },
    {
        "error": 0.076,
        "mag": 16.763,
        "time": 52948.425043
    },
    {
        "error": 0.068,
        "mag": 16.686,
        "time": 52948.437155
    },
    {
        "error": 0.127,
        "mag": 17.446,
        "time": 52967.239958
    },
    {
        "error": 0.106,
        "mag": 17.207,
        "time": 52967.247983
    },
    {
        "error": 0.099,
        "mag": 17.126,
        "time": 52967.256745
    },
    {
        "error": 0.087,
        "mag": 16.978,
        "time": 52967.264745
    },
    {
        "error": 0.084,
        "mag": 16.962,
        "time": 52967.272681
    },
    {
        "error": 0.122,
        "mag": 16.936,
        "time": 52978.297349
    },
    {
        "error": 0.144,
        "mag": 17.066,
        "time": 52978.310583
    },
    {
        "error": 0.149,
        "mag": 17.171,
        "time": 52978.322395
    },
    {
        "error": 0.196,
        "mag": 17.491,
        "time": 52978.334467
    },
    {
        "error": 0.177,
        "mag": 17.382,
        "time": 52978.346862
    },
    {
        "error": 0.074,
        "mag": 16.78,
        "time": 52988.303551
    },
    {
        "error": 0.076,
        "mag": 16.79,
        "time": 52988.315017
    },
    {
        "error": 0.083,
        "mag": 16.894,
        "time": 52988.326529
    },
    {
        "error": 0.081,
        "mag": 16.87,
        "time": 52988.338467
    },
    {
        "error": 0.089,
        "mag": 16.999,
        "time": 52988.350057
    },
    {
        "error": 0.134,
        "mag": 17.087,
        "time": 53008.28399
    },
    {
        "error": 0.17,
        "mag": 17.356,
        "time": 53008.298407
    },
    {
        "error": 0.235,
        "mag": 17.389,
        "time": 53038.284015
    },
    {
        "error": 0.161,
        "mag": 16.955,
        "time": 53038.297603
    },
    {
        "error": 0.146,
        "mag": 17.103,
        "time": 53038.31136
    },
    {
        "error": 0.12,
        "mag": 16.848,
        "time": 53038.327491
    },
    {
        "error": 0.122,
        "mag": 16.815,
        "time": 53038.342762
    },
    {
        "error": 0.118,
        "mag": 17.272,
        "time": 53045.214424
    },
    {
        "error": 0.105,
        "mag": 17.124,
        "time": 53045.225782
    },
    {
        "error": 0.098,
        "mag": 17.006,
        "time": 53045.237158
    },
    {
        "error": 0.091,
        "mag": 16.936,
        "time": 53045.248347
    },
    {
        "error": 0.085,
        "mag": 16.848,
        "time": 53045.259871
    },
    {
        "error": 0.12,
        "mag": 16.892,
        "time": 53065.170202
    },
    {
        "error": 0.094,
        "mag": 16.885,
        "time": 53065.215938
    },
    {
        "error": 0.165,
        "mag": 17.31,
        "time": 53093.215469
    },
    {
        "error": 0.25,
        "mag": 17.063,
        "time": 53096.17574
    },
    {
        "error": 0.078,
        "mag": 16.778,
        "time": 53108.189227
    },
    {
        "error": 0.085,
        "mag": 16.801,
        "time": 53108.200423
    },
    {
        "error": 0.085,
        "mag": 16.804,
        "time": 53108.211689
    },
    {
        "error": 0.094,
        "mag": 16.919,
        "time": 53108.22298
    },
    {
        "error": 0.104,
        "mag": 16.98,
        "time": 53108.23428
    },
    {
        "error": 0.163,
        "mag": 17.125,
        "time": 53121.142168
    },
    {
        "error": 0.163,
        "mag": 17.358,
        "time": 53121.152932
    },
    {
        "error": 0.157,
        "mag": 17.069,
        "time": 53121.174489
    },
    {
        "error": 0.141,
        "mag": 16.974,
        "time": 53121.18521
    },
    {
        "error": 0.215,
        "mag": 16.813,
        "time": 53125.145028
    },
    {
        "error": 0.248,
        "mag": 17.018,
        "time": 53125.155061
    },
    {
        "error": 0.231,
        "mag": 16.916,
        "time": 53125.165775
    },
    {
        "error": 0.337,
        "mag": 17.152,
        "time": 53125.176074
    },
    {
        "error": 0.131,
        "mag": 17.059,
        "time": 53134.148592
    },
    {
        "error": 0.172,
        "mag": 17.19,
        "time": 53134.158055
    },
    {
        "error": 0.167,
        "mag": 17.329,
        "time": 53134.167532
    },
    {
        "error": 0.168,
        "mag": 17.346,
        "time": 53134.177016
    },
    {
        "error": 0.078,
        "mag": 16.871,
        "time": 53260.448604
    },
    {
        "error": 0.081,
        "mag": 16.931,
        "time": 53260.461068
    },
    {
        "error": 0.078,
        "mag": 16.873,
        "time": 53260.473251
    },
    {
        "error": 0.1,
        "mag": 16.986,
        "time": 53263.404523
    },
    {
        "error": 0.087,
        "mag": 16.867,
        "time": 53263.416248
    },
    {
        "error": 0.085,
        "mag": 16.898,
        "time": 53263.427894
    },
    {
        "error": 0.076,
        "mag": 16.819,
        "time": 53263.439542
    },
    {
        "error": 0.08,
        "mag": 16.853,
        "time": 53263.451319
    },
    {
        "error": 0.083,
        "mag": 16.867,
        "time": 53294.367732
    },
    {
        "error": 0.089,
        "mag": 16.958,
        "time": 53294.378778
    },
    {
        "error": 0.096,
        "mag": 17.052,
        "time": 53294.389818
    },
    {
        "error": 0.115,
        "mag": 17.3,
        "time": 53294.400877
    },
    {
        "error": 0.111,
        "mag": 17.301,
        "time": 53294.411953
    },
    {
        "error": 0.087,
        "mag": 16.84,
        "time": 53301.379183
    },
    {
        "error": 0.08,
        "mag": 16.737,
        "time": 53301.390987
    },
    {
        "error": 0.078,
        "mag": 16.72,
        "time": 53301.402866
    },
    {
        "error": 0.089,
        "mag": 16.844,
        "time": 53301.414806
    },
    {
        "error": 0.091,
        "mag": 16.853,
        "time": 53301.42664
    },
    {
        "error": 0.146,
        "mag": 17.006,
        "time": 53303.382325
    },
    {
        "error": 0.133,
        "mag": 16.907,
        "time": 53303.394043
    },
    {
        "error": 0.118,
        "mag": 16.807,
        "time": 53303.405777
    },
    {
        "error": 0.12,
        "mag": 16.87,
        "time": 53303.417504
    },
    {
        "error": 0.126,
        "mag": 16.815,
        "time": 53303.429261
    },
    {
        "error": 0.096,
        "mag": 17.013,
        "time": 53319.398525
    },
    {
        "error": 0.091,
        "mag": 16.95,
        "time": 53319.410619
    },
    {
        "error": 0.083,
        "mag": 16.852,
        "time": 53319.422709
    },
    {
        "error": 0.094,
        "mag": 17.017,
        "time": 53319.434815
    },
    {
        "error": 0.085,
        "mag": 16.884,
        "time": 53319.446907
    },
    {
        "error": 0.089,
        "mag": 16.949,
        "time": 53329.436375
    },
    {
        "error": 0.085,
        "mag": 16.864,
        "time": 53329.448787
    },
    {
        "error": 0.083,
        "mag": 16.843,
        "time": 53329.461614
    },
    {
        "error": 0.085,
        "mag": 16.873,
        "time": 53329.473986
    },
    {
        "error": 0.093,
        "mag": 16.97,
        "time": 53329.486343
    },
    {
        "error": 0.155,
        "mag": 16.676,
        "time": 53340.313637
    },
    {
        "error": 0.202,
        "mag": 16.898,
        "time": 53340.350316
    },
    {
        "error": 0.093,
        "mag": 16.853,
        "time": 53349.395294
    },
    {
        "error": 0.091,
        "mag": 16.819,
        "time": 53349.407392
    },
    {
        "error": 0.096,
        "mag": 16.847,
        "time": 53349.421277
    },
    {
        "error": 0.122,
        "mag": 17.099,
        "time": 53349.433805
    },
    {
        "error": 0.155,
        "mag": 17.337,
        "time": 53349.445944
    },
    {
        "error": 0.109,
        "mag": 17.287,
        "time": 53355.429337
    },
    {
        "error": 0.093,
        "mag": 17.13,
        "time": 53355.442223
    },
    {
        "error": 0.102,
        "mag": 17.005,
        "time": 53359.32407
    },
    {
        "error": 0.122,
        "mag": 17.287,
        "time": 53359.340219
    },
    {
        "error": 0.155,
        "mag": 17.533,
        "time": 53359.356235
    },
    {
        "error": 0.134,
        "mag": 17.516,
        "time": 53359.37228
    },
    {
        "error": 0.107,
        "mag": 17.164,
        "time": 53359.388392
    },
    {
        "error": 0.333,
        "mag": 17.525,
        "time": 53362.359461
    },
    {
        "error": 0.353,
        "mag": 17.538,
        "time": 53362.373835
    },
    {
        "error": 0.152,
        "mag": 17.01,
        "time": 53362.401426
    },
    {
        "error": 0.161,
        "mag": 17.451,
        "time": 53379.421951
    },
    {
        "error": 0.078,
        "mag": 16.858,
        "time": 53389.414967
    },
    {
        "error": 0.102,
        "mag": 17.056,
        "time": 53389.428029
    },
    {
        "error": 0.115,
        "mag": 17.24,
        "time": 53389.441002
    },
    {
        "error": 0.133,
        "mag": 17.37,
        "time": 53389.454042
    },
    {
        "error": 0.105,
        "mag": 17.079,
        "time": 53389.467055
    },
    {
        "error": 0.085,
        "mag": 16.909,
        "time": 53461.177311
    },
    {
        "error": 0.091,
        "mag": 16.952,
        "time": 53461.187713
    },
    {
        "error": 0.098,
        "mag": 17.044,
        "time": 53461.198013
    },
    {
        "error": 0.117,
        "mag": 17.216,
        "time": 53461.20852
    },
    {
        "error": 0.148,
        "mag": 17.45,
        "time": 53461.218783
    },
    {
        "error": 0.109,
        "mag": 17.105,
        "time": 53489.144463
    },
    {
        "error": 0.155,
        "mag": 17.38,
        "time": 53489.154823
    },
    {
        "error": 0.183,
        "mag": 17.419,
        "time": 53489.165188
    },
    {
        "error": 0.22,
        "mag": 16.977,
        "time": 53635.420507
    },
    {
        "error": 0.416,
        "mag": 17.688,
        "time": 53635.430941
    },
    {
        "error": 0.326,
        "mag": 17.385,
        "time": 53635.441362
    },
    {
        "error": 0.302,
        "mag": 17.228,
        "time": 53635.451794
    },
    {
        "error": 0.098,
        "mag": 16.961,
        "time": 53686.387374
    },
    {
        "error": 0.113,
        "mag": 17.168,
        "time": 53686.399945
    },
    {
        "error": 0.126,
        "mag": 17.438,
        "time": 53686.412535
    },
    {
        "error": 0.102,
        "mag": 17.32,
        "time": 53686.425152
    },
    {
        "error": 0.087,
        "mag": 17.16,
        "time": 53686.437655
    },
    {
        "error": 0.105,
        "mag": 16.826,
        "time": 53696.389754
    },
    {
        "error": 0.087,
        "mag": 16.64,
        "time": 53696.402867
    },
    {
        "error": 0.104,
        "mag": 16.838,
        "time": 53696.416079
    },
    {
        "error": 0.148,
        "mag": 17.284,
        "time": 53725.333894
    },
    {
        "error": 0.165,
        "mag": 17.504,
        "time": 53725.347164
    },
    {
        "error": 0.113,
        "mag": 17.138,
        "time": 53725.360208
    },
    {
        "error": 0.098,
        "mag": 16.965,
        "time": 53725.373318
    },
    {
        "error": 0.089,
        "mag": 16.82,
        "time": 53725.386327
    },
    {
        "error": 0.107,
        "mag": 17.04,
        "time": 53755.287903
    },
    {
        "error": 0.141,
        "mag": 17.34,
        "time": 53755.30062
    },
    {
        "error": 0.167,
        "mag": 17.513,
        "time": 53755.313543
    },
    {
        "error": 0.128,
        "mag": 17.211,
        "time": 53755.326206
    },
    {
        "error": 0.17,
        "mag": 16.879,
        "time": 53774.229191
    },
    {
        "error": 0.165,
        "mag": 16.893,
        "time": 53774.242192
    },
    {
        "error": 0.144,
        "mag": 16.901,
        "time": 53774.255111
    },
    {
        "error": 0.137,
        "mag": 16.964,
        "time": 53774.268727
    },
    {
        "error": 0.178,
        "mag": 17.102,
        "time": 53774.281643
    },
    {
        "error": 0.498,
        "mag": 17.892,
        "time": 53807.263345
    },
    {
        "error": 0.152,
        "mag": 17.001,
        "time": 54051.42542
    },
    {
        "error": 0.203,
        "mag": 17.222,
        "time": 54051.437612
    },
    {
        "error": 0.152,
        "mag": 17.401,
        "time": 54051.449795
    },
    {
        "error": 0.2,
        "mag": 16.977,
        "time": 54072.319947
    },
    {
        "error": 0.266,
        "mag": 17.351,
        "time": 54072.336373
    },
    {
        "error": 0.218,
        "mag": 17.168,
        "time": 54072.351217
    },
    {
        "error": 0.17,
        "mag": 16.879,
        "time": 54072.365115
    },
    {
        "error": 0.16,
        "mag": 16.797,
        "time": 54072.378307
    },
    {
        "error": 0.13,
        "mag": 17.017,
        "time": 54079.302082
    },
    {
        "error": 0.12,
        "mag": 16.921,
        "time": 54079.314047
    },
    {
        "error": 0.113,
        "mag": 16.852,
        "time": 54079.325949
    },
    {
        "error": 0.124,
        "mag": 16.962,
        "time": 54079.337841
    },
    {
        "error": 0.139,
        "mag": 17.05,
        "time": 54079.349746
    },
    {
        "error": 0.161,
        "mag": 17.441,
        "time": 54108.26665
    },
    {
        "error": 0.163,
        "mag": 17.48,
        "time": 54108.279236
    },
    {
        "error": 0.13,
        "mag": 17.214,
        "time": 54108.291835
    },
    {
        "error": 0.102,
        "mag": 16.955,
        "time": 54108.304514
    },
    {
        "error": 0.105,
        "mag": 16.999,
        "time": 54108.317189
    },
    {
        "error": 0.089,
        "mag": 16.944,
        "time": 54125.260511
    },
    {
        "error": 0.083,
        "mag": 16.816,
        "time": 54125.272189
    },
    {
        "error": 0.079,
        "mag": 16.834,
        "time": 54125.284645
    },
    {
        "error": 0.083,
        "mag": 16.887,
        "time": 54125.296238
    },
    {
        "error": 0.084,
        "mag": 16.933,
        "time": 54125.307757
    },
    {
        "error": 0.12,
        "mag": 17.433,
        "time": 54139.217637
    },
    {
        "error": 0.109,
        "mag": 17.257,
        "time": 54139.229673
    },
    {
        "error": 0.086,
        "mag": 17.053,
        "time": 54139.241524
    },
    {
        "error": 0.084,
        "mag": 17.02,
        "time": 54139.253196
    },
    {
        "error": 0.083,
        "mag": 16.94,
        "time": 54139.264843
    },
    {
        "error": 0.19,
        "mag": 17.481,
        "time": 54167.237726
    },
    {
        "error": 0.099,
        "mag": 17.399,
        "time": 54418.383929
    },
    {
        "error": 0.074,
        "mag": 17.073,
        "time": 54418.396034
    },
    {
        "error": 0.081,
        "mag": 17.107,
        "time": 54418.408209
    },
    {
        "error": 0.071,
        "mag": 16.996,
        "time": 54418.420182
    },
    {
        "error": 0.063,
        "mag": 16.882,
        "time": 54418.432176
    },
    {
        "error": 0.124,
        "mag": 17.184,
        "time": 54465.320119
    },
    {
        "error": 0.094,
        "mag": 16.899,
        "time": 54465.332615
    },
    {
        "error": 0.094,
        "mag": 16.908,
        "time": 54465.34508
    },
    {
        "error": 0.101,
        "mag": 16.946,
        "time": 54465.357472
    },
    {
        "error": 0.114,
        "mag": 17.051,
        "time": 54465.369935
    },
    {
        "error": 0.104,
        "mag": 17.081,
        "time": 54524.216626
    },
    {
        "error": 0.119,
        "mag": 17.216,
        "time": 54524.229701
    },
    {
        "error": 0.099,
        "mag": 17.097,
        "time": 54524.241189
    },
    {
        "error": 0.125,
        "mag": 17.178,
        "time": 54524.252828
    },
    {
        "error": 0.13,
        "mag": 17.221,
        "time": 54524.264445
    },
    {
        "error": 0.104,
        "mag": 16.646,
        "time": 54539.16186
    },
    {
        "error": 0.116,
        "mag": 16.764,
        "time": 54539.172258
    },
    {
        "error": 0.111,
        "mag": 16.733,
        "time": 54539.182645
    },
    {
        "error": 0.12,
        "mag": 16.885,
        "time": 54539.19306
    },
    {
        "error": 0.14,
        "mag": 17.065,
        "time": 54539.203648
    },
    {
        "error": 0.137,
        "mag": 16.778,
        "time": 54571.13796
    },
    {
        "error": 0.144,
        "mag": 16.801,
        "time": 54571.148647
    },
    {
        "error": 0.104,
        "mag": 17.257,
        "time": 54587.164953
    },
    {
        "error": 0.109,
        "mag": 17.193,
        "time": 54587.17646
    }
]}

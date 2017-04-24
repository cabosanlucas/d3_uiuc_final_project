"use strict";

/* Boilerplate jQuery */
$(function() {
  $.get("res/students-by-state.csv")
   .done(function (csvData) {
     var data = d3.csvParse(csvData);
     visualize(data);
   })
   .fail(function (e) {
     alert("Failed to load CSV data!");
   });
});

/* Visualize the data in the visualize function */
var visualize = function(data) {
  console.log(data);

  // == BOILERPLATE ==
  var margin = { top: 50, right: 50, bottom: 50, left: 75 },
     width = 1000,
     height = 1000;

  var svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .style("width", width + margin.left + margin.right)
              .style("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



  // == Your code! :) ==
var projection = d3.geoAlbers(),
    path = d3.geoPath(projection);

var studentsScale = d3.scaleLog()
    .domain([1,30320])
    .range([0,100]);

var legendScale = d3.scaleLog()
    .domain([1,30320])
    .range(["hsla(190,0%,50%,1)", "hsla(190,100%,50%,1)"]);

svg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(20,500)");

var legendLinear = d3.legendColor()
    .shapeWidth(30)
    .cells([10,100,1000,10000])
    .label(["low enrollment","","","high enrollment"]);
    .shape("circle")
    .shapePadding(20)
    .orient("horizontal")
    .scale(legendScale);
         

svg.select(".legendLinear")
    .call(legendLinear);

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
        var htmlString = "<div align=\"center\">";
        htmlString += d.properties.name + "<br>";
        htmlString += String(d.properties.numStudents) + " students";
        htmlString += "</div>";
        return htmlString;
    });

svg.call(tip);

d3.json("res/us-states.json", function(error, statesData) {
    console.log(statesData);
    // add # of students data to states json
    for (var state = 0; state < statesData.features.length; state++) {
        var currentState = statesData.features[state].properties.name;
        for (var i = 0; i < data.length; i++) {
            if (data[i].name == currentState) {
                statesData.features[state].properties.numStudents = data[i].number;
                break;
            }
        }
    }
    console.log(statesData);

  // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll("path")
       .data(statesData.features)
       .enter()
       .append("path")
       .attr("d", path)
       .style("stroke", "#fff")
       .style("stroke-width", "1")
       .style("fill", function(d) {
            // Get data value
            var numStudents = d.properties.numStudents;

            if (numStudents) {
                //If value exists…
                var color = "hsla(190," + Math.round(studentsScale(numStudents)) + "%,50%,1)";
                return color;
            } else {
                //If value is undefined…
                return "hsla(190,0%,0%,1)";
            }
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);
    });
};

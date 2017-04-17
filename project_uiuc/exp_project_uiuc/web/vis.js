"use strict";

/* Boilerplate jQuery */
$(function() {
  $.get("res/stateslived.csv")
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
     width = 800 - margin.left - margin.right,
     height = (data.length * 1);

  var svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .style("width", width + margin.left + margin.right)
              .style("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



  // == Your code! :) ==
  // D3 Projection
var projection = d3.geo.albersUsa()
           .translate([width/2, height/2])    // translate to center of screen
           .scale([1000]);          // scale things down so see entire US
        
// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
         .projection(projection);  // tell path generator to use albersUsa projection

    
// Define linear scale for output
var color = d3.scale.linear()
        .range(["rgb(213,222,217)","rgb(69,173,168)","rgb(84,36,55)","rgb(217,91,67)"]);


  // Bind the data to the SVG and create one path per GeoJSON feature
svg.selectAll("path")
  .data(json.features)
  .enter()
  .append("path")
  .attr("d", path)
  .style("stroke", "#fff")
  .style("stroke-width", "1")
  .style("fill", function(d) {

  // Get data value
  var value = d.properties.visited;

  if (value) {
  //If value exists…
  return color(value);
  } else {
  //If value is undefined…
  return "rgb(213,222,217)";
  }
});
};

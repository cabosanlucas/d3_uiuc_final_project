"use strict";


var data;
var currentYearIndex = 1;
var years = ["2008","2016"];
/* Boilerplate jQuery */
$(function () {
  $.get("res/students-state-2008-2016.csv")
   .done(function (csvData) {
      data = d3.csvParse(csvData);
      console.log(data);
      visualize(data);
   })
   .fail(function (e) {
     alert("Failed to load CSV data!");
   });
});


/* Visualize the data in the visualize function */
var visualize = function(data) {

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
    .domain([1,35000])
    .range([0,100]);

var colorScale = d3.scaleLog()
    .domain([1,35000])
    .range(["hsla(190,0%,50%,1)", "hsla(190,100%,50%,1)"]);

svg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(20,500)");

var legendLinear = d3.legendColor()
    .shapeWidth(30)
    .cells([10,100,1000,10000])
    .labels(["low enrollment","","","high enrollment"])
    .shape("circle")
    .shapePadding(20)
    .orient("horizontal")
    .scale(colorScale);
         
svg.select(".legendLinear")
    .call(legendLinear);

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
        var htmlString = "<div align=\"center\">";
        htmlString += d.properties.name + "<br>";
        htmlString += String(d.properties[years[currentYearIndex]]) + " students";
        htmlString += "</div>";
        return htmlString;
    });
svg.call(tip);

var x = d3.scaleLinear()
    .domain([0,1])
    .range([0,width/10])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + (width - 7*margin.right) + "," + 0 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", 0)
    .attr("x2", x.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { 
          hue(x.invert(d3.event.x)); 
        }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
  .selectAll("text")
  .data(x.ticks(1))
  .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d*8 + 2008});

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);
slider.transition() // Gratuitous intro!
    .duration(750)
    .tween("hue", function() {
      var i = d3.interpolate(0, 1);
      return function(t) { hue(i(t)); };
    });
function hue(h) {
      handle.attr("cx", x(h));
      if(h < 0.5 && currentYearIndex == 1) {
      currentYearIndex = 0;
        var newData = data;
        bind(newData);
      }
      if(h>=0.5 && currentYearIndex == 0){
        currentYearIndex = 1; 
        var newData = data;
        bind(newData);
      }
      //svg.select(".legendLinear").call(colorScale);
}

function bind(studentData) {
    d3.json("res/us-states.json", function(error, statesData) {
        console.log("a");
        for (var state = 0; state < statesData.features.length; state++) {
            var currentState = statesData.features[state].properties.name;
            for (var i = 0; i < data.length; i++) {
                if (data[i].name == currentState) {
                    statesData.features[state].properties["2008"] = studentData[i]["2008"];
                    statesData.features[state].properties["2016"] = studentData[i]["2016"];
                    break;
                }
            }
        }
        console.log("b");
    svg.selectAll("path")
       .data(statesData.features, function(d){ return d;})
       .enter()
       .append("path")
       .attr("class","states")
       .attr("d", path)
       .style("stroke", "#fff")
       .style("stroke-width", "1")
       .style("fill", function(d) {
            // Get data value
        console.log("c");
            console.log(colorScale(d.properties[years[currentYearIndex]]));   
            return colorScale(d.properties[years[currentYearIndex]]);
       })
       .on("mouseover", tip.show)
       .on("mouseout", tip.hide);
    });
}
};




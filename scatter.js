// https://www.d3-graph-gallery.com/graph/scatter_basic.html

var figw = 900
var figh = 750
var popl = 3_000_000
var popu = 22_000_000
var deathl = 2_500
var deathu = 65_000

var map = {}
var data = []
var loaded = false

$( document ).ready(function() {
  d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/cbsa.csv", function(raw) {
    // CBSA,Metro,State
    // 10100,Aberdeen,SD
    raw.forEach(function(x) {
      map[x['CBSA']] = x['Metro'] + ', ' + x['State']
    });
  })

  d3.csv("https://api.covidactnow.org/v2/cbsas.csv?apiKey=448c8a7cc13d43a7b8b0740570b74dda", function(raw){
    raw.forEach(function(x) {
      if (x['population'] > popl)
      { data.push([map[x['fips']], x['population'], x['actuals.deaths']]) }
    });
    console.log(`inside: ${data.length}`) // runs later
    loaded = true
  })

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 30, left: 60},
      width = figw - margin.left - margin.right,
      height = figh - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#my_dataviz")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  //$.getScript("load.js", function(){
  var x = d3.scaleLog()
    .domain([popl, popu])
    .range([ 0, width ]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  //var y = d3.scaleLinear()
  var y = d3.scaleLog()
    .domain([deathl, deathu])
    .range([ height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  console.log(`outside1: ${data.length}`) // runs later
  //while (loaded == false) {}
  console.log(`outside2: ${data.length}`) // runs later

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", function (d) { console.log(x(d[1])); return x(d[1]) } )
      .attr("cy", function (d) { return y(d[2]) } )
      .attr("r", 3)
      .style("fill", "red")

  // Add dots
  svg.append('g')
    .selectAll("label")
    .data(data)
    .enter()
    .append("text")
      .attr("x", function (d) { return x(d[1]) + 5 } )
      .attr("y", function (d) { return y(d[2]) + 5 } )
      .attr("font-size","big")
      .text(function (d) { return d[0].split("-")[0]+"+" })
})

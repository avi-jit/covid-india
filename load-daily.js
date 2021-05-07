
var figw = 900
var figh = 700
var popl = 7_000_000
var popu = 1_350_000_000
var deathl = 1
var deathu = 1_000_000
var undercount = 30

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

  svg.append("text")
    .attr("x",width * 0.8)
    .attr("y",height-(margin.bottom * 0.95))
    .text("Population (log scale)")

  svg.append("text")
    .attr("x",margin.left*3)
    .attr("y",height/20)
    .attr("text-anchor","middle")
    //.attr("transform",`translate(${margin.left/2},${height/2}) rotate(270)`)
    .text("Peak Daily Deaths (7 day avg) (log scale)")


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

var p_metro = new Promise(function(passfn, failfn)
{
  d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/cbsa.csv", function(raw) {
    var map = {}
    // CBSA,Metro,State
    // 10100,Aberdeen,SD
    raw.forEach(function(x) {
      map[x['CBSA']] = x['Metro'] + ', ' + x['State']
    });
    //console.log(`level 1: ${map['10100']}`) // runs later
    //return map
    d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/metro_daily.csv", function(raw){
      console.log(raw[0])
      // CBSA,NewDeaths,Population
      // 10100,2,42668
      var data = []
      raw.forEach(function(x) {
        if (parseInt(x['Population'])>popl)
        { data.push( [
            map[x['CBSA']].split("-")[0]+"+",
            parseInt(x['Population']),
            parseInt(x['NewDeaths'])
          ]) }
        else {console.log([
            map[x['CBSA']].split("-")[0]+"+",
            parseInt(x['Population']),
            parseInt(x['NewDeaths'])
          ])}
      });
      console.log('metro:')
      console.log(data)
      passfn(data)
    })
  })
})

var p_us = new Promise(function(passfn, failfn)
{
    var data = [['US', 331_486_822, 3_329]]
    console.log(data[0])
    passfn(data)
  })
})

var p_state = new Promise(function(passfn, failfn)
{
  d3.json("https://api.covidactnow.org/v2/states.json?apiKey=448c8a7cc13d43a7b8b0740570b74dda", function(raw){
    var data = []
    raw.forEach(function(row) {
      if (parseInt(row['population'])>popl)
      { data.push([row['state'], row['population'], row['actuals']['deaths']])}
    })
    console.log(data[0])
    passfn(data)
  })
})

var p_istate = new Promise(function(passfn, failfn)
{
  d3.csv("https://api.covid19india.org/csv/latest/state_wise.csv", function(raw){ // also has Delta_Deaths
    var deaths = {}
    raw.forEach(function(row) {
      deaths[row['State']] = parseInt(row['Deaths']) * undercount
    })
    deaths['India'] = deaths['Total']
    console.log(`India: ${deaths['India']}`)

    d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/state_pop.csv", function(raw){
      // 0	State	Population	Increase	Area Density SexRatio	Literacy
      // 1	Uttar Pradesh	199812341	20.23 %	240928	829	912	67.68
      // https://www.census2011.co.in/states.php
      console.log(raw[0])
      var data = []
      raw.forEach(function(x) {
        if (typeof deaths[x['State']]==="undefined") {console.log(x['State'])}
        else
        {
          d = parseInt(deaths[x['State']])
          if (parseInt(x['Population']) > popl && d > deathl)
          { data.push( [ x['State'],//+', '+x['State'],
            parseInt(x['Population']), d ])
            //console.log(data[data.length-1])
          }
        }

      });
      console.log(data[0])
      passfn(data)
    })
  })
})

var p_idistrict = new Promise(function(passfn, failfn)
{
  d3.csv("https://api.covid19india.org/csv/latest/district_wise.csv", function(raw){
    var deaths = {}
    //console.log(raw[1])
    raw.forEach(function(row) {
      if (isNaN(row['Deceased'])){ console.log(row['District']+':'+row['Deceased']) }
      deaths[row['District']+', '+row['State']] = parseInt(row['Deceased']) * undercount
    })
    deaths['Bangalore, Karnataka'] = deaths['Bengaluru Urban, Karnataka'] + deaths['Bengaluru Rural, Karnataka']
    //console.log(`Lucknow: ${deaths['Lucknow, Uttar Pradesh']}`)

    d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/district_pop.csv", function(raw){
      // 0	District	State	Population	Growth	SexRatio	Literacy
      // 1	Thane	Maharashtra	11,060,148	36.01 %	886	84.53
      // https://www.census2011.co.in/district.php
      console.log(raw[0])
      var data = []
      raw.forEach(function(x) {
        if (typeof deaths[x['District']+', '+x['State']] === "undefined")
        {
          if (x['Population'] > popl)
          { console.log(x['District']+', '+x['State']) }
        }
        else {
          d = parseInt(deaths[x['District']+', '+x['State']])
        if (parseInt(x['Population']) > popl && d>deathl)
        { data.push( [ x['District'],//+', '+x['State'],
            parseInt(x['Population']), d ])
          //console.log(data[data.length-1])
        }}

      });
      console.log(data[0])
      passfn(data)
    })
  })
})

Promise.all([p_metro, p_us, p_state, p_istate, p_idistrict]).then(raw => {
	//const data1 = raw[0]
  data = []
  raw.forEach(function(rows) {
    rows.forEach(function(row) {
      if (row[1] > popl && row[1] < popu && row[2] > deathl && row[2] < deathu)
        { data.push(row)}
      else {console.log(row)}
    })
  })

  console.log(data)

  var bspace = d3.select('#bspace')
  //bspace.append('button').text("Button 2")
  bspace.selectAll('b')
        .data(data)
        .enter()
        .append('button')
        .text(function(d){return d[0]})
        .attr('class', 'buttons m-1')
        .attr('data',function(d){return d[0]+'@'+d[1]+'@'+d[2]})
        //.attr('onclick','clickfn()')

  data1 = []
  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data1)
    .enter()
    .append("circle")
      .attr("cx", function (d) { return x(d[1]) } )
      .attr("cy", function (d) { return y(d[2]) } )
      .attr("r", 3)
      .style("fill", "red")

  // Add labels
  svg.append('g')
    .selectAll("label")
    .data(data1)
    .enter()
    .append("text")
      .attr("x", function (d) { return x(d[1]) + 5 } )
      .attr("y", function (d) { return y(d[2]) + 5 } )
      .attr("font-size","big")
      .text(function (d) { return d[0] })

  $('.buttons').click(function(){
    console.log('button clicked')
    var d = $(this).attr('data').split('@')
    d[1] = parseInt(d[1])
    d[2] = parseInt(d[2])
    console.log(d)

    svg.append('circle')
      .attr("cx", x(d[1]) )
      .attr("cy", y(d[2]) )
      .attr("r", 3)
      .style("fill", "red")

    svg.append("text")
      .attr("x", x(d[1]) + 5 )
      .attr("y", y(d[2]) + 5 )
      .attr("font-size","big")
      .text(d[0])
  })
})


//p_metro.then(
//  function(data){
//    console.log("after metro")
//    console.log(data.length)
//  }, // passfn
//  function(){console.log("error")} // failfn
//)


const figw = 900
const figh = 720
const popl = 7_000_000
const popu = 350_000_000
const deathl = -1_000
const deathu = 15_000
const undercount = 10

const dotcolors = {'India':'red', 'US':'blue'}
const dotsize = {'city':3, 'state':5, 'nation':10}
const btncolor = {'none':'light', 'block':'secondary'}

// set the dimensions and margins of the graph
var margin = {top: 10, right: 50, bottom: 60, left: 60},
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

  // text label for the x axis
  svg.append("text")
      .attr("transform",
            "translate(" + (width/2) + " ," + (height + margin.top + 40) + ")")
      .style("text-anchor", "middle")
      .style('font-size','18')
      .text("Population (log scale)");

  // text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style('font-size','18')
    .text("Peak Daily Deaths (7 day avg)");

//$.getScript("load.js", function(){
var x = d3.scaleLog()
  .domain([popl, popu])
  .range([ 0, width ]);

const m = 1_000_000
var xAxis = d3.axisBottom(x)
              .tickFormat(d3.format(".2s"))
              .tickValues([7.5*m, 10*m, 20*m, 40*m, 100*m, 200*m, 300*m]);
//xAxis = d3.svg.axis().orient("bottom").scale(x)

svg.append("g")
  .style('font-size','18')
  .attr('class','grid')
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis)
  //.call(function make_x_gridlines() { return d3.axisBottom(x).ticks(5)}()
  //        .tickSize(-height).tickFormat(""))

// Add Y axis
var y = d3.scaleLinear()
//var y = d3.scaleLog()
  .domain([deathl, deathu])
  .range([ height, 0]);

const ks = 1_000
var yAxis = d3.axisLeft(y)
              .tickFormat(d3.format(".1s"))
              .tickValues([0, 2*ks, 5*ks, 10*ks, 15*ks, 20*ks, 30*ks, 50*ks])
svg.append("g")
  .style('font-size','18')
  .call(yAxis);

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
      //console.log(raw[0])
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
      });
      console.log(data[0])
      passfn(data)
    })
  })
})

var p_us = new Promise(function(passfn, failfn)
{
    var data = [['USA', 331_486_822, 3_329]]
    console.log(data[0])
    passfn(data)
})

var p_state = new Promise(function(passfn, failfn)
{
  d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/us_state_daily.csv", function(raw){
    // State,NewDeaths,Population
    // AK,5,731545
    var data = []
    raw.forEach(function(row) {
      if (parseInt(row['Population'])>popl)
      { data.push([row['State'], parseInt(row['Population']), parseInt(row['NewDeaths']) ] ) }
    })
    console.log(data[0])
    passfn(data)
  })
})

var p_istate = new Promise(function(passfn, failfn)
{
  d3.csv("https://api.covid19india.org/csv/latest/state_wise_daily.csv", function(raw){
    //Date,Date_YMD,Status,TT,AN,AP,AR,AS,BR,CH,CT,DN,DD,DL,GA,GJ,HR,HP,JK,JH,KA,KL,LA,LD,MP,MH,MN,ML,MZ,NL,OR,PY,PB,RJ,SK,TN,TG,TR,UP,UT,WB,UN
    var deaths = {}
    //deaths['India'] = 0
    for (var [key, value] of Object.entries(raw[0])) {
      if (key.length != 2) { continue }
      deaths[key] = parseInt(value) * undercount
      //deaths['India'] = deaths['India'] + deaths[key]
    }
    raw.forEach(function(row) {
      if (row['Status'] == 'Deceased') {
        //var sum = 0;
        for (var [key, value] of Object.entries(row)) {
          if (key.length != 2) { continue }
          value = parseInt(value) * undercount
          //console.log(`${key}: ${value}`)
          //sum = sum + value
          deaths[key] = Math.max(value, deaths[key])
        }
        //deaths['India'] = Math.max(sum, deaths['India'])
        //deaths[row['State']] = parseInt(row['Deaths']) * undercount
      }
    })
    //console.log(`Goa: ${deaths['GA']}`)
    console.log('India: '+ deaths['TT'])

    d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/state_pop.csv", function(raw){
      // 0	Code State	Population	Increase	Area Density SexRatio	Literacy
      // 1	UP Uttar Pradesh	199812341	20.23 %	240928	829	912	67.68
      // https://www.census2011.co.in/states.php
      //console.log(raw[0])
      var data = []
      raw.forEach(function(x) {
        if (typeof deaths[x['Code']]==="undefined") {console.log(x['State'])}
        else
        {
          d = parseInt(deaths[x['Code']])
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
  d3.csv("https://api.covid19india.org/csv/latest/districts.csv",function(raw){
    // Date,State,District,Confirmed,Recovered,Deceased,Other,Tested
    // 2020-04-26,Andaman and Nicobar Islands,Unknown,33,11,0,0,2679
    var previous = {} // previous, to compare against
    var deaths = {} // max so far
    //console.log(raw[1])
    raw.forEach(function(row) {
      k = row['District']+', '+row['State']
      v = parseInt(row['Deceased']) * undercount
      if (previous[k] === undefined)
      { deaths[k] = v }
      else
      { //deaths[k] = v-previous[k] // most recent
        deaths[k] = Math.max( deaths[k], v-previous[k] )
      }
      previous[k] = v
    })
    console.log(deaths)
    deaths['Bangalore, Karnataka'] = deaths['Bengaluru Urban, Karnataka'] + deaths['Bengaluru Rural, Karnataka']
    deaths['Hyderabad, Andhra Pradesh'] = deaths['Hyderabad, Telangana']
    deaths['Ahmadabad, Gujarat'] = deaths['Ahmedabad, Gujarat']
    deaths['Mumbai Suburban, Maharashtra'] = deaths['Mumbai, Maharashtra']
    //deaths['North Twenty Four Parganas, West Bengal'] = deaths['North 24 Parganas, West Bengal']
    //deaths['South Twenty Four Parganas, West Bengal'] = deaths['South 24 Parganas, West Bengal']
    deaths['Barddhaman'] = deaths['Paschim Bardhaman'] + deaths['Purba Barddhaman']
    console.log(`Lucknow: ${deaths['Lucknow, Uttar Pradesh']}`)

    d3.csv("https://raw.githubusercontent.com/avi-jit/covid-india/main/district_pop.csv", function(raw){
      // 0	District	State	Population	Growth	SexRatio	Literacy
      // 1	Thane	Maharashtra	11,060,148	36.01 %	886	84.53
      // https://www.census2011.co.in/district.php
      //console.log(raw[0])
      var data = []
      raw.forEach(function(x) {
        key = x['District']+', '+x['State']
        if (typeof deaths[key] === "undefined")
        {
          //if (parseInt(x['Population']) > popl)
          //{ console.log('Missing: '+ key) }
        }
        else {
          d = parseInt(deaths[key])
          if (parseInt(x['Population']) > popl && d > deathl)
          {
            data.push( [ x['District'].split(' ')[0],//+', '+x['State'],
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

Promise.all([p_state, p_metro, p_us, p_idistrict, p_istate]).then(raw => {
	//const data1 = raw[0]
  data = []
  defaults = ['CA', 'USA', 'Delhi', 'Maharashtra', 'Mumbai', 'WA', 'Bangalore', 'Chicago+', 'Tamil Nadu', 'Uttar Pradesh', 'New York+']
  ignores = ['Murshidabad', 'Purba', 'Paschim', 'East', 'West', 'Nadia',
            //'Bihar', 'Patna',
            ]
  raw.forEach(function(rows, i) {
    rows.forEach(function(row) {
      if (row[1] > popl && row[1] < popu && row[2] > deathl && row[2] < deathu && !ignores.includes(row[0]) )
        {
          if (defaults.includes(row[0])) { row.push('block') }
          else {row.push('none')}
          if (i <= 2) { row.push('US') } else { row.push('India')}
          if (i%2==1) { row.push('city') }
          else { if (i == 2) { row.push('nation') } else { row.push('state') }}
          data.push(row)
        }
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
        .attr('class', function(d){ return 'btn m-1 btn-'+btncolor[d[3]] } )
        .attr('data',function(d){return d[0].split('+')[0].split(' ')[0] +'@'+d[1]+'@'+d[2]+'@'+d[3]})
        //.style("background-color", function(d) {
        //  if (d[3] == 'block') { return 'yellow'}
        //  else { return 'white'}
        //  } );
        //.attr('onclick','clickfn()')

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr('class', function(d) { return d[0].split('+')[0].split(' ')[0]} )
      .attr("cx", function (d) { return x(d[1]) } )
      .attr("cy", function (d) { return y(d[2]) } )
      .attr("r", function(d) { return dotsize[d[5]] } )
      .style("fill", function (d) { return dotcolors[d[4]] } )
      .style("display", function(d) { return d[3]} );

  // Add labels
  svg.append('g')
    .selectAll("label")
    .data(data)
    .enter()
    .append("text")
      .attr('class', function(d) { return d[0].split('+')[0].split(' ')[0] } )
      .attr("x", function (d) { return x(d[1]) + dotsize[d[5]] } )
      .attr("y", function (d) { return y(d[2]) + 5 } )
      .attr("font-size","18")
      .text(function (d) { return d[0] })
      .style("display", function(d) { return d[3]} );

  $('.btn').click(function(){
    var d = $(this).attr('data').split('@')
    //console.log('button: '+d)
    //d[1] = parseInt(d[1])
    //d[2] = parseInt(d[2])

    var color
    if (d[3] == 'block') { d[3] = 'none'} else { d[3] = 'block'}
    //console.log(d.join('@'))

    //$('.'+d[0]).style.display = d[3]
    $('.'+d[0]).css("display", d[3])
    $(this).attr('data', d.join('@'))
    //$(this).css('background-color', color)
    $(this).attr('class', 'btn m-1 btn-'+btncolor[d[3]])

  })
})


//p_metro.then(
//  function(data){
//    console.log("after metro")
//    console.log(data.length)
//  }, // passfn
//  function(){console.log("error")} // failfn
//)

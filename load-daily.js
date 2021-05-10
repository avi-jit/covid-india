const figw = screen.width * 0.6 //900
const figh = screen.height * 0.8 //720
const popl = 7_000_000
const popu = 350_000_000
const deathl = -1_000
const deathu = 15_000
const undercount = 10
var wait = 500
var transit = 200
var skip = false
const K = 1_000
var started = false

function write(text){
  d3.select("#text").html("") // start from scratch
  d3.select('#text').append('p')
                    .style('opacity',0).attr('id','temp').attr('class','h3')
  d3.select('#temp').html(text)
  d3.select('#temp').transition().duration(transit).style('opacity',1)
}

$('#skip').click(function(){
  skip = true;
  transit = 1;
  $('#start').click()
  // switch to restart
  text = "Hope that helped. Continue to toggle the buttons below to add or remove more regions from the plot on the left. <br><br>Disclaimer: We also account for Indian undercounting. Learn <a href='#' style='color:grey' data-toggle='modal' data-target='#more'><u>about</u></a> the crisis and this website."
  write(text)

})

const dotcolors = {'India':'red', 'US':'blue'}
const dotsize = {'city':5, 'state':5, 'nation':5}
//const btncolor = {'none':'light', 'block':'secondary'}
const btncolor = ['light','secondary']

// set the dimensions and margins of the graph
var margin = {top: 10, right: 50, bottom: 60, left: 60},
    width = figw - margin.left - margin.right,
    height = figh - margin.top - margin.bottom;

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

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
  svg.append('text')
      .attr("y", height/2)
      .attr("x", width/2 - 200)
      .text('Start Visualization')
      .style('font-size','40')
      //.attr('onclick','Start')
      .attr('id','start')
      .attr('fill','grey')
      .attr('text-decoration','underline')
      //.attr('class',"link-primary")
      .style('cursor','pointer')
      .style('opacity',1)

$('#start').click(async function()
{
  if (started) { return; }
  started = true
  console.log('starting...')

  //d3.select('#start').transition().duration(transit).style('opacity',0)
  d3.select('#start').transition().duration(transit).style('opacity',0)
  //$(this).css('display','none')
  //await new Promise(r => setTimeout(r, 2000));


  //////////////////////////////////////////////////////////////////////////
  // Add Intro
  //////////////////////////////////////////////////////////////////////////

  if (!skip)
  {
    text = "This website helps Americans relate to the mind-boggling statistics of the latest Covid-19 wave in India.<br><br>Let's begin."
    write(text)
    await new Promise(r => setTimeout(r, 3*K));
    d3.select('#temp').transition().duration(transit).style('opacity',0)
  }
  $("#start").remove();

  //////////////////////////////////////////////////////////////////////////
  // Add Y axis
  //////////////////////////////////////////////////////////////////////////

  // text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style('font-size','18')
    .text("Peak Daily Deaths (7 day avg)");

    if (!skip)
    {
      text = "The most reliant metric for pandemic severity is the Daily Death Rate (averaged over 7 days). <br><br>We will show these on the Y axis."
      write(text)
      await new Promise(r => setTimeout(r, 6*K));
    }

  //$.getScript("load.js", function(){
  var x = d3.scaleLog()
    .domain([popl, popu])
    .range([ 0, width ]);

  const m = 1_000_000
  var xAxis = d3.axisBottom(x)
                .tickFormat(d3.format(".2s"))
                .tickValues([7.5*m, 10*m, 20*m, 40*m, 100*m, 200*m, 300*m]);
  //xAxis = d3.svg.axis().orient("bottom").scale(x)

  var y = d3.scaleLinear()
  //var y = d3.scaleLog()
    .domain([deathl, deathu])
    .range([ height, 0]);

  var yAxis = d3.axisLeft(y)
                .tickFormat(d3.format(".1s"))
                .tickValues([0, 1*K, 2*K, 5*K, 10*K, 15*K, 20*K, 30*K, 50*K])

  svg.append("g")
    .style('opacity',0)
    .style('font-size','18')
    .call(yAxis)
    .attr('id','yaxis')


    d3.select('#yaxis').transition().duration(transit).style('opacity',1)
    if (!skip) { await new Promise(r => setTimeout(r, 4*K)); }
    else {}

  Promise.all([p_state, p_metro, p_us, p_idistrict, p_istate]).then(async function(raw){
  	//const data1 = raw[0]
    data = []
    defaults = ['Bangalore']
    //defaults = ['CA', 'USA', 'Delhi', 'Maharashtra', 'Mumbai', 'WA', 'Bangalore', 'Chicago+', 'Tamil Nadu', 'Uttar Pradesh', 'New York+']
    ignores = ['Murshidabad', 'Purba', 'Paschim', 'East', 'West', 'Nadia',
              //'Bihar', 'Patna',
              ]
    raw.forEach(function(rows, i) {
      rows.forEach(function(row) {
        if (row[1] > popl && row[1] < popu && row[2] > deathl && row[2] < deathu && !ignores.includes(row[0]) )
          {
            if (defaults.includes(row[0])) { row.push(1) } //opacity
            else {row.push(0)}
            if (i <= 2) { row.push('US') } else { row.push('India')}
            if (i%2==1) { row.push('city') }
            else { if (i == 2) { row.push('nation') } else { row.push('state') }}
            data.push(row)
          }
      })
    })

    console.log(data)

    if (!skip)
    {
      text = "Let's see how bad things are in Bangalore, India's Silicon Valley."
      write(text)
      await new Promise(r => setTimeout(r, 5*K));
    }

    // Add dots
    svg.append('g')
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
        .attr('class', function(d) { return d[0].split('+')[0].split(' ')[0] + ' dot'} )
        .attr("cx", function (d) { return x(d[1]) } )
        .attr("cy", function (d) { return y(d[2]) } )
        .attr("r", function(d) { return dotsize[d[5]] } )
        .style("fill", function (d) { return dotcolors[d[4]] } )
        .style('opacity', function(d) { return parseInt(d[3]) } )
        //.style("display", function(d) { return d[3]} )

    // Add labels
    svg.append('g')
      .attr('id','labels')
      .selectAll("label")
      .data(data)
      .enter()
      .append("text")
        .attr('class', function(d) {return d[0].split('+')[0].split(' ')[0] + ' label' })
        .attr("x", function (d) { return x(d[1]) + dotsize[d[5]] } )
        .attr("y", function (d) { return y(d[2]) + 5 } )
        .attr("font-size", "18")
        .text(function (d) { return d[0] })
        .style("opacity", function(d) { return parseInt(d[3]) } )
        //.style("display", function(d) { return d[3]} );

    padding = 2
    $(".label").each(function() {
      //console.log( index + ": " + $(this)[0] )
      bbox = $(this)[0].getBBox()
      //console.log(bbox)
      d3.select("#labels")
        .insert('rect', `.${$(this).attr('class').split(' ')[0]}`)
        .attr('class',$(this).attr('class').split(' ')[0]+' bbox')
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + (padding*2))
        .attr('height', bbox.height + (padding*2))
        .style('opacity',$(this).css('opacity'))
        .style('fill','white')
        .style('stroke','black')
        .style('stroke-width',1)
    });


    //////////////////////////////////////////////////////////////////////////
    // Add Bangalore
    //////////////////////////////////////////////////////////////////////////

    if (!skip)
    {
      text = "Hmmm ... so we have a number. But we <u><a style='color:grey' href='https://g.co/kgs/5GBev9'>should never leave a number alone</a></u>. <br><br>Let's use our X axis now to add another dimension."
      write(text)
      await new Promise(r => setTimeout(r, 9*K));
    }

    //////////////////////////////////////////////////////////////////////////
    // Add X axis
    //////////////////////////////////////////////////////////////////////////

    svg.append("g")
      .style('font-size','18')
      .attr('class','grid')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      //.call(function make_x_gridlines() { return d3.axisBottom(x).ticks(5)}()
      //        .tickSize(-height).tickFormat(""))

    if (!skip)
    {
      text = "Better! We now see the population of Bangalore on a log scale. <br><br>But wouldn't it be better to compare these figures to cities from the US which we know better?"
      write(text)
      await new Promise(r => setTimeout(r, 9*K));
    }

    // text label for the x axis
    svg.append("text")
        .attr("transform",
              "translate(" + (width/2) + " ," + (height + margin.top + 40) + ")")
        .style("text-anchor", "middle")
        .style('font-size','18')
        .text("Population (log scale)");

    //////////////////////////////////////////////////////////////////////////
    // Add LA
    //////////////////////////////////////////////////////////////////////////

    data.forEach(function(d)
    {
      if (d[0] == 'Los Angeles+')
      {
        d[3] = 1 // helps in activating button later
        d3.select('.Los').transition().duration(transit).style("opacity",1)
        d3.select('text.Los').transition().duration(transit).style("opacity",1)
        d3.select('rect.Los').transition().duration(transit).style("opacity",1)
      }
    })
    if (!skip)
    {
      text = "Oh there's the LA metropolitan area! Bangalore seems to be a little smaller than LA's worst day, yet has more cases. <br><br>Note: LA (and all of US) peaked around new year while India is peaking mid May."
      write(text)
      await new Promise(r => setTimeout(r, 9*K));
    }

    //////////////////////////////////////////////////////////////////////////
    // Add Mumbai
    //////////////////////////////////////////////////////////////////////////

    data.forEach(function(d)
    {
      if (d[0] == 'Mumbai')
      {
        d[3] = 1 // helps in activating button later
        d3.select('.Mumbai').transition().duration(transit).style("opacity",1)
        d3.select('text.Mumbai').transition().duration(transit).style("opacity",1)
        d3.select('rect.Mumbai').transition().duration(transit).style("opacity",1)
      }
    })

    if (!skip)
    {
      text = "Uh oh. Mumbai is way way worse, despite also having roughly the same population as LA or Bangalore. <br><br>Mumbai is both India's financial capital as well as the home to Bollywood: think LA and NYC in one."
      write(text)
      await new Promise(r => setTimeout(r, 9*K));
    }

    //////////////////////////////////////////////////////////////////////////
    // Add CA
    //////////////////////////////////////////////////////////////////////////

    data.forEach(function(d)
    {
      if (d[0] == 'CA')
      {
        d[3] = 1 // helps in activating button later
        d3.select('.CA').transition().duration(transit).style("opacity",1)
        d3.select('text.CA').transition().duration(transit).style("opacity",1)
        d3.select('rect.CA').transition().duration(transit).style("opacity",1)
      }
    })

    if (!skip)
    {
      text = "Let's also see stats at the state level. There's California. Wonder how the most populous states of India are doing."
      write(text)
      await new Promise(r => setTimeout(r, 7*K));
    }

    //////////////////////////////////////////////////////////////////////////
    // Add Maharashtra
    //////////////////////////////////////////////////////////////////////////

    data.forEach(function(d)
    {
      if (d[0] == 'Maharashtra')
      {
        d[3] = 1 // helps in activating button later
        d3.select('.Maharashtra').transition().duration(transit).style("opacity",1)
        d3.select('text.Maharashtra').transition().duration(transit).style("opacity",1)
        d3.select('rect.Maharashtra').transition().duration(transit).style("opacity",1)
      }
    })

    if (!skip)
    {
      text = "India's worst faring state is Maharashtra, home to both Mumbai - the largest epicenter - but also ironically to Serum Institute - world's largest Covid-19 vacccine manufacturer."
      write(text)
      await new Promise(r => setTimeout(r, 9*K));
    }

    //////////////////////////////////////////////////////////////////////////
    // Add US
    //////////////////////////////////////////////////////////////////////////

    data.forEach(function(d)
    {
      if (d[0] == 'USA')
      {
        d[3] = 1 // helps in activating button later
        d3.select('.USA').transition().duration(transit).style("opacity",1)
        d3.select('text.USA').transition().duration(transit).style("opacity",1)
        d3.select('rect.USA').transition().duration(transit).style("opacity",1)
      }
    })

    if (!skip)
    {
      text = "The situtaion looks worse when we plot all of US. Mumbai has been seeing more (estimated) daily deaths than all of America combined! <br><br>Unfortunately, we could not show all of India here because it lies outside the graph."
      write(text)
      await new Promise(r => setTimeout(r, 10*K));
    }
    text = "Continue to toggle the buttons below to add or remove more regions from the plot on the left. <br><br>Disclaimer: We also account for Indian undercounting. Learn <a href='#' style='color:grey' data-toggle='modal' data-target='#more'><u>about</u></a> the crisis and this website."
    write(text)
    if (!skip) { await new Promise(r => setTimeout(r, 5*K)); }

    var bspace = d3.select('#bspace')
    //bspace.append('button').text("Button 2")
    bspace.selectAll('b')
          .data(data)
          .enter()
          .append('button')
          .text(function(d){return d[0]})
          .attr('class', function(d){ return 'btn m-1 btn-'+btncolor[d[3]] } )
          .attr('data',function(d){return d[0].split('+')[0].split(' ')[0] +'@'+d[1]+'@'+d[2]+'@'+d[3]})

    $('#skip').text("Restart Interactive")
    $('#skip').attr('id','restart')
    //$(this).attr('href','./scatter.html') // reloads
    $('#restart').click(function(){ window.location.reload(); })

    $('.btn').click(function(){
      var d = $(this).attr('data').split('@')
      console.log('button: '+d)

      d[3] = 1 - parseInt(d[3])
      //if (d[3] == 'block') { d[3] = 'none'} else { d[3] = 'block'}
      //console.log(d.join('@'))

      //$('.'+d[0]).css("display", d[3]) // jQuery
      d3.select('.'+d[0]).transition().duration(1000).style("opacity",d[3])
      d3.select('text.'+d[0]).transition().duration(1000).style("opacity",d[3])
      d3.select('rect.'+d[0]).transition().duration(1000).style("opacity",d[3])

      $(this).attr('data', d.join('@'))
      $(this).attr('class', 'btn m-1 btn-'+btncolor[d[3]])
    })

  })

})

var anchors = [
  [250,   'Max daily Covid19 deaths in LA'],
  [2200,  'Number of students at Annenberg USC'],
  [2977,  'Number of victims in 9/11'],
  [3352,  'Max daily Covid19 deaths in the US'],
  [23872, 'Total Covid19 deaths in LA till date'],
  [25771, 'Population of University Park, LA'],
  [44000, 'Number of USC students'],
  [60000, 'Annual deaths in LA county (2019 data)'],
  [61661, 'Total Covid19 deaths in CA till date'],
  [78467, 'Capacity of LA Coliseum'],
  [88000, 'Number of USC & UCLA students']
]

var data;
$.getJSON('https://www.mohfw.gov.in/data/datanew.json', function(temp) {
  console.log(temp)
  data = {};
  for (const value of Object.values(temp)) {
      //console.log(value)
      data[value['state_name']] = value['new_death'] - value['death']
  }
  data['Jammu and Kashmir'] = data['Jammu and Kashmir'] + data['Ladakh']
  data['India'] = data['']
});

$("path, circle").mouseenter(function(e) {
  $('#hover-box').css('visibility','visible');
  //$('#hover-box').html($(this).data('info'));
  $('#hover-box').html($(this).attr('name'));
});

$("#how").click(function (e){
  //console.log("instructions")
  $("#choose").toggle()
});

$("path, circle").click(function(e) {

  $('#choose').css('display','none')
  id = $(this).attr('id')
  name = $(this).attr('name')
  img = 'img/'+id+'.jpg'
  console.log(`${name}: ${data[name]}`);
  console.log(`${img}`)
  //console.log(`${(data[name]*25/2200).toPrecision(4)}`)
  $('#img').attr('src',img);
  html = "<b>State</b>: " + name
  html = html + " ("+id+")"
  est = data[name]*25
  html = html + "<br><b>Deaths</b>: " + data[name] + " official; " + est + " estimated."
  //html = html + "<br>" + (data[name]*est*100/44000).toPrecision(2) + "% of all USC students.<br>" + (data[name]*est*100/2200).toPrecision(2) + "% of all Annenberg students.<br>" + (data[name]*est*100/8600).toPrecision(2) + "% of all Viterbi students."
  $('#text').html(html)
  var index = 0;
  for (const [idx, element] of anchors.entries()) {
    //console.log(index, element);
    if (est < element[0]) {index=idx; break;}
  }
  console.log(index, anchors[index])
  v_big = anchors[index][0]
  t_big = anchors[index][1] + `: ${v_big}`
  v_sml = anchors[index-1][0]
  t_sml = anchors[index-1][1] + `: ${v_sml}`

  // what if index is 0?
  $('.circle1').attr('r','10vh')
  $('.circle1').attr('cx','12vh')
  $('.circle1').attr('cy','12vh')
  console.log(`text1: ${t_big}`)
  $('.text1').html(t_big)

  r2 = est*10/v_big
  console.log(`r2: ${r2}`)
  $('.circle2').attr('r', r2+'vh')
  $('.circle2').attr('cx','12vh')
  $('.circle2').attr('cy', 22-r2+'vh')
  $('.text2').html(`Estimated Deaths in ${name} yesterday: ${est}`)

  r3 = v_sml*10/v_big
  console.log(`r3: ${r3}`)
  $('.circle3').attr('r', r3+'vh')
  $('.circle3').attr('cx','12vh')
  $('.circle3').attr('cy', 22-r3+'vh')
  console.log(`text3: ${t_sml}`)
  $('.text3').html(t_sml)

  //$('#info-box').html(data[name])
  //$('#info-box').css('visibility','visible')
  //$('#info-box').children().css('visibility','visible')
  // State
  //$('#state').html("<b>State</b>: " + name + " (" + id + ")")

});

$("path, circle").mouseleave(function(e) {
  $('#hover-box').css('visibility','hidden');
});
$(document).mousemove(function(e) {
  $('#hover-box').css('top',e.pageY-$('#hover-box').height()-30);
  $('#hover-box').css('left',e.pageX-($('#hover-box').width())/2);
}).mouseover();

var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if(ios) {
  $('a').on('click touchend', function() {
    var link = $(this).attr('href');
    window.open(link,'_blank');
    return false;
  });
}

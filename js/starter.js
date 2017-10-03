var ds;
var totalEntries;
var allData = [];

var width = parseInt(d3.select('#graphic').style('width')),
	height = parseInt(d3.select('#graphic').style('height')),
	svg = d3.select('#graphic'),
	container = d3.select('#container');

var tooltip = container.append('div')
	.attr('id','tooltip');	

var colors = {"red": {"001": "#6D2415","002": "#A23623","003": "#D8472A","004": "#E27660","005": "#EBA295","006": "#F3D0CA"
   },"blue": {"001": "#28566F","002": "#3E7FA5","003": "#53A9DC","004": "#80BEE4","005": "#A8D4EE","006": "#D2E8F5"},
   "green": {"001": "#4A5E40","002": "#6E8E5E","003": "#D8472A","004": "#91BC7F","005": "#C9DDBE","006": "#E2EDDE"},"purple": {"001": "#35203B","002": "#503058","003": "#6A4177","004": "#8D7097","005": "#B49FB9","006": "#DACFDD"},"yellow": {"001": "#776428","002": "#B19330","003": "#EEC535","004": "#F3D469","005": "#F7E299","006": "#FAF0CD"},"black": {"001": "#000000","002": "#4D4D4D","003": "#807F7F","004": "#C0C0C0","005": "#DBDBDA","006": "#F7F7F7"}};


	

function init() {
	//console.log("ready");
	loadData(1);	

}


function loadData(which) {

	//LOAD DATA WITH MISO
	ds = new Miso.Dataset({
  		importer : Miso.Dataset.Importers.GoogleSpreadsheet,
  		parser : Miso.Dataset.Parsers.GoogleSpreadsheet,
  		key : "1MAT5GMK7QzBdUVr73ten0tzjpJRfMCafwOxN7fp0qTw", //CHANGE TO YOUR KEY HERE
  		worksheet : which
	});

	ds.fetch({ 
	  success : function() {
	     console.log("So say we all!");
	     parseData();
	  },
	  error : function() {
	   //console.log("What the frak?");
	  }
	});

}


function parseData() {
	var $len = ds.column("Index").data.length;
	totalEntries = $len;
	
	//LOOP THRU GOOGLE DATA AND PUT INTO OBJECT
	for (var j=0; j<$len; j++) {
		var counter = ds.column("Index").data[j];
		allData[counter] = [ {
								index: ds.column("Index").data[j],
								date: ds.column("Date").data[j],
								loc: ds.column("Location").data[j],
								desc: ds.column("Description").data[j],
								killed: ds.column("Killed").data[j],
								injured: ds.column("Injured").data[j],
								total: ds.column("Total victims").data[j],
								longitude: ds.column("Longitude").data[j],
								latitude: ds.column("Latitude").data[j]
						    }];
	}
	render();
	
}	

function render(){
	d3.json("data/ustopo.json", (error, us) => {
		if (error) throw error;	
		console.log(us);


		var projection = d3.geoAlbersUsa()
			.fitSize([width,height],topojson.feature(us, us.objects.states));

		var path = d3.geoPath()
			.projection(projection);

		var parser = d3.timeParse('%b %d, %Y');

		allData.forEach(d=>{
			d[0]['year'] = d3.timeFormat('%Y')(parser(d[0]['date']));
		})

		console.log(allData);

		var circleScale = d3.scaleLinear()
			.domain([3, 57])
			.range([3, 25]);

		svg.append('g')
			.attr('class','states')
			.selectAll('path')
			.data(topojson.feature(us, us.objects.states).features)
			.enter()
			.append('path')
			.attr('d',path)
			.attr('fill',colors['black']['005']);

		svg.append("path")
			.datum(topojson.mesh(us, us.objects.states))
		    .attr("class", "state-borders")
		    .attr("d", path)
		    .style('stroke-width',1)
		    .style('stroke','#fff')
		    .style('fill','none');

		var legend = d3.select('#legend')
		    .style('width','250px')
		    .style('height','80px');

		var legendsvg = legend.append('svg')
		    .attr('width',250)
		    .attr('height',80)
		    .attr('id','legendsvg');

		legendsvg
		    .append('circle')
		    .style('stroke-width',1)
		    .style('stroke',colors['red']['003'])
		    .style('fill',colors['red']['005'])
		    .attr('cy',40)
		    .attr('cx',50)
		    .attr('r',25);

		legendsvg
		    .append('circle')
		    .style('stroke-width',1)
		    .style('stroke',colors['red']['003'])
		    .style('fill',colors['red']['005'])
		    .attr('cy',40)
		    .attr('cx',150)
		    .attr('r',4);

		legendsvg
		    .append('text')
		    .text('59 killed')
		    .attr('x',50)
		    .attr('y',45);

		legendsvg
		    .append('text')
		    .text('3 killed')
		    .attr('x',157)
		    .attr('y',45);


		allData.forEach((d, i) => {
		      		var circles = svg.append('circle')
		      			.attr('cx',() => {return projection([d[0]['longitude'], d[0]['latitude']])[0]})
		      			.attr('cy',() => {return projection([d[0]['longitude'], d[0]['latitude']])[1]})
		      			.attr('r',() => {return circleScale(d[0]['killed'])})
		      			.attr('class',()=>{return 'dp y-' + d[0]['year']})
		      			.style('stroke-width',1)
		      			.style('display','none')
		      			.style('stroke',colors['red']['003'])
		      			.attr('fill',colors['red']['005'])
		      			.on('mouseover',()=>{
		      				tooltip
		      					.transition()
		      					.style('display','block')
		      					.style('top',() => {
		      						var yPos = projection([d[0]['longitude'], d[0]['latitude']])[1];
		      						var defaultY = d3.select("#tooltip").style('height') + yPos;
		      						if (defaultY >= height)
		      							{return height - 250 + 'px';}
		      						else
		      						{return yPos + 'px';}
		      						
		      					})
		      					.style('left',() => {
		      						var xPos = projection([d[0]['longitude'], d[0]['latitude']])[0];
		      						if (xPos >= width - 250)
		      							{return width - 250 + 'px';}
		      						else
		      							{return xPos + 'px'}
		      					});
		      				tooltip
		      					.html(()=>{
		      						return '<strong>' + d[0]['loc'] + '</strong>' + '<br>' + 
		      							d[0]['date'] + '<br>' + 
		      							d[0]['killed'] + ' killed, '+ d[0]['injured'] + ' injured<br>' +
		      							d[0]['desc']
		      				})
		      			.on('mouseout',()=>{
		      				tooltip
		      					.style("display",'none');
		      			})
		      		});
		})

		var timer = container.append('div')
			.attr('id','timer')
			.style('left',width / 2 + 'px')
			.style('top', height / 2 + 'px')
			.style("position","absolute")
			.text();

		var years = [1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017];
					
		years = years.sort((a,b)=>{
				return a - b;
		})

		var count = 0;

		var timing = d3.interval(()=>{
			draw(years[count++ % years.length])
		}, 500)

		function draw(year){
			d3.selectAll('.dp')
				.style('display','none');

			d3.selectAll('.y-'+year).style('display','block');

			d3.select('#timer').text(year);
		}
		d3.select('.start')
			.classed('selected',true);
		d3.select('.stop')
			.classed('nonselected',true);
		d3.select('.stop')
			.on('click',()=>{

				d3.selectAll('.spbutton')
					.classed('selected',false)
					.classed('nonselected',true);
				d3.select('.stop')
					.classed('nonselected',false)
					.classed('selected',true);

				timing.stop();

				d3.select('#timer')
					.style("display",'none');

				d3.selectAll('.dp')
					.style('display','block');
			})	

		d3.select('.start')
			.on('click',()=>{

				d3.selectAll('.spbutton')
					.classed('selected',false)
					.classed('nonselected',true);
				d3.select('.start')
					.classed('nonselected',false)
					.classed('selected',true);

				d3.selectAll('.dp')
					.style('display','none')

				d3.select('#timer')
					.style("display",'block');

				timing = d3.interval(()=>{
					draw(years[count++ % years.length])
				}, 500)
			});
	})
}
init();
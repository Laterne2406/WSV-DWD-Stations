let loc = [54.1906, 9.9547]
let map = L.map('mymap', {tap:false }).setView(loc, 8);

let ourData1 = [];
let ourData2 =[]
let wetterdata = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 20,
    minZoom: 2
}).addTo(map);




let iconOption = {
    iconUrl: './assets/DWDStations-or.png',
    iconSize: [30, 30]
};
let ourCustomIcon = L.icon(iconOption);
let station_url = './assets/DWDStations.json';

let iconOption2 = {
    iconUrl: './assets/WSVPegel-kl.png',
    iconSize: [30, 30]
};
let ourCustomIcon2 = L.icon(iconOption2);

// Alternative Abfrage-url per WSV REST-API
//let WSV_API ='https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json'
//let SH_url = '?waters=EIDER,ELK,NOK,NORDSEE,OSTSEE,PINNAU,TRAVE,KRÜCKAU,STÖR,ELBE'
//let WSV_url = WSV_API + SH_url

// Lokale gefilterte Stationen aus der WSV-Liste
let WSV_url = './assets/WSV-Nord-Output.json'

// Gefilterte Stationen nach DWD Regionalkennung
let regional = ["SH", "NI" , "MV" , "HH"]

function closeInfobox() {
   document.getElementById("infobox").innerHTML = "Wetterdaten aktuell";
};
function closeHistorybox() {
   document.getElementById("tester").innerHTML = "Wetterdaten Zeitreihe";
};


// Aktuelle DWD Messwertdatenabfrage
function messwert(obj)
{
	let präfix = 'https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/current_measurement_';
	let suffix = '.json';
	let st_id = obj.st_id;
	let url = präfix + st_id + suffix;
	let station = obj.text;
	fetch(url)
		.then(response => response.json())
		.then (data => {
			wetterdata = data
			/*console.log(st_id,wetterdata);*/
			var zeitstempel =new Date(wetterdata.time).toLocaleString("de-DE");
			var temper = wetterdata.temperature /10;
            if (temper > 100)                
				temper = "--";
			var feuchte = wetterdata.humidity /10;
            if (feuchte > 100)                
				feuchte = "--";
			var dewpoint = wetterdata.dewpoint /10;
            if (dewpoint > 100)                
				dewpoint = "--";
			var precip = wetterdata.precipitation /10;
            if (precip > 300)
				precip = "--";

            var snow = wetterdata.totalsnow
            if (snow > 200)                
				snow = "--";
            
			var pressure = wetterdata.pressure /10;
            if (pressure > 2000)                
				pressure = "--";
			var meanwind = wetterdata.meanwind /10;
            if (meanwind > 200)                
				meanwind = "--";
            var maxwind = wetterdata.maxwind /10;
            if (maxwind > 300)                
				maxwind = "--";
			
            
            var winddir = wetterdata.winddirection /10;
			if (winddir >= 0 && winddir <= 180) 
            	windzug = winddir + 180;
        	else if (winddir > 180 && winddir <= 360)
            	windzug = winddir - 180;
			else
				{
				winddir = "--";
				windzug = "--";
				}
			
				
                
            var sunshine = wetterdata.sunshine;
            if (sunshine > 60)
                sunshine = "--";
            
            var cloud = wetterdata.cloud_cover_total;
            if (cloud > 100)
                cloud = "--";
			/*console.log(zeitstempel, station, wetterdata.winddirection);*/
			
			var result =
            `<button onclick='closeInfobox()'> clear box</button> <h5>Stündliche Wetterdaten <br/>Aktuell: ${zeitstempel} <br/>Station: ${station} </h5><p style="font-size: 12px; text-align: center"> 
			Temperatur: &ensp; ${temper} Grad<br/> Feuchte: &ensp; ${feuchte} %
			<br/> Taupunkt: &ensp; ${dewpoint} Grad<br/> Niederschlag: &ensp; ${precip} mm/h
			<br/> Schneehöhe: &ensp; ${snow} mm<br/> Luftdruck: &ensp; ${pressure} hPa
			<br/> Sonne: &ensp; ${sunshine} min<br/> Wolken: &ensp; ${cloud} %
			<br/> Wind: &ensp; ${meanwind} km/h
			<br/> Windböen: &ensp; ${maxwind} km/h
			<br/> Wind aus: &ensp; ${winddir} Grad
			<br/> <img src="./assets/wind80.png" style="transform:rotate(${winddir}deg)">
			<br/><br/> Windzugrichtung: &ensp; ${windzug} Grad
			<br/> <img src="./assets/windzug.png" style="transform:rotate(${windzug}deg)">
			</p>`;
			document.getElementById("infobox").innerHTML = result;
			
			
		})
		.catch(error => console.log(`This is error: ${error}`))
		    
			
}

//History DWD Diagrammerstellung
function diagram_plot(idX)
{
let id = idX.st_id;
let station = idX.text;
let test_url = 'https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/current_measurement_'+id+'.json'
//let test_url = 'https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/current_measurement_10150.json'
fetch(test_url)
	.then(response => response.json())
	.then(data => {
	    test_data = data;
		//console.log(`Test  `, test_data)
		
		let x_value_temp_start = test_data.history.temperature.start ;
		let x_step = test_data.history.temperature.timeStep ;
		let x_time =[];
		let j = 0;
		let y_temp_history = [];
		let y_wind_history = [];
		let y_direction_history =[];
		let diagram_data ={}
		
		while (j < test_data.history.temperature.data.length) {
			let f = j * x_step + x_value_temp_start
			//var zeitstempel =new Date(f).toLocaleString("de-DE",{day:'2-digit',month:'2-digit',hour:'numeric'});
			x_time.push(f);
			
			if (test_data.history.temperature.data[j] < 1000)
				y_temp_history.push(test_data.history.temperature.data[j]/10)
			else
				y_temp_history.push(null)
			
			if (test_data.history.windSpeed.data[j] < 2000)
				y_wind_history.push(test_data.history.windSpeed.data[j]/10)
			else
				y_wind_history.push(null)
				
			if (test_data.history.windDirection.data[j] <3600)
				y_direction_history.push(test_data.history.windDirection.data[j]/10)
			else
				y_direction_history.push(null)
			
			j++ ;
		}
		//diagram_data = {x_time , y_temp_history , y_wind_history , y_direction_history}
		
		//console.log('Zeit ' , x_time)
		//console.log(`history Temperatur  `, y_temp_history)
		//console.log(`history Wind  `, y_wind_history)
		//console.log(`history Windrichtung  `, y_direction_history)
		
		
		var trace1 = {
		  type: "scatter",
		  mode: "lines",
			name: 'Temperatur',
			yaxis: 'y1',
		  x: x_time,
		  y: y_temp_history,
			line: {color: '#ff6347'},
			//line: {color: '#17BECF'}
		
		};

		var trace2 = {
		  type: "scatter",
		  mode: "lines",
			name: 'Wind',
			yaxis: 'y2',
		  x: x_time,
		  y: y_wind_history,
		  line: {color: '#009cb8'},
		  //line: {color: '#7F7F7F'}
		};
		
		var trace3 = {
		  type: "scatter",
		  mode: "lines",
			name: 'Windrichtung',
			yaxis: 'y3',
		  x: x_time,
		  y: y_direction_history,
		  line: {color: '#8a8a8a'},
		  //line: {color: '#7F7F7F'}
		};

		var data_p = [trace1,trace2,trace3];
		var time_l = x_time.length-1
		var range_p = [x_time[0],x_time[time_l]];
		
		var layout_p = {
			width: 350,
			height: 350,
			margin:{b: 40, l: 50, r:50, t:30, pad:5},
			//margin: 'autoexpand',
			title: {text: id+'  '+ station, font:{size: 12}},
			showlegend: false,
			//paper_bgcolor: '#ADD8E6',
			//plot_bgcolor: '#ADD8E6',
			grid:{rows: '3', columns: '1', pattern: 'coupled' , roworder: 'bottom to top'},
			xaxis:{
				type: 'date',
				tickfont:{size: '9'},
				tickangle: '0',
				tickformat: '%d-%m \n %H:%M',
				
			},
			yaxis1:{
				title:{text: 'Temperatur °C', font:{color:'#ff6347'}},
				tickfont: {color: '#ff6347'},
				zeroline: true,
				zerolinecolor: '#8a8a8a',
				
			},
			yaxis2:{
				title:{text: 'Wind km/h', font:{color:'#009cb8'}},
				tickfont: {color: '#009cb8'},
				//overlaying: 'y',
				side: 'right',
				
			},
			yaxis3:{
				title:{text: 'Windrichtung', font:{color:'#8a8a8a'}},
				tickfont: {color: '#8a8a8a'},
				dtick: 5,
				tickmode: 'array',
				tickvals: [0,90,180,270,360],
				ticktext: ['N','O','S','W','N'],
				//overlaying: 'y',
				side: 'left',
			},
			
		};
		
		//console.log(range_p);
		//console.log(data_p);
		var result2 = `<button onclick='closeHistorybox()'> clear box</button><br/>`
		document.getElementById('tester').innerHTML = result2
		Plotly.newPlot('tester', data_p, layout_p)
		})

		
		
		
	.catch(error => console.log(`This is the error: ${error}`))
}



// main-Routine Kartendarstellung mit DWD-Stationsmarker
fetch(station_url)
	.then(response => response.json())
	.then(data => {
	    ourData1 = data;
		/*console.log(`f-station  `, data)*/
	    for(let i=0;i<data.length;i++) {
			
			if (regional.includes(data[i].regio) && (data[i].latitude) > 53.3700)
			{
				/*console.log(`f-station  `, data[i].name)*/
				let option = document.createElement("option");
	        	option.value = i+1;
	        	option.text = data[i].name;
	        	document.querySelector(".select-dropdown1").appendChild(option);
				let station = data[i].name							
				
			
				
				
				
				let marker = L.marker([data[i].latitude, data[i].longitude], {icon: ourCustomIcon}).bindPopup(`<h3> ${data[i].id} ${data[i].name}</h3> <button onclick='messwert({st_id:${data[i].id}, text:"${station}"})'> Wetterdaten aktuell </button>
				<br/><br/><button onclick='diagram_plot({st_id:${data[i].id}, text:"${station}"})'> Wetter-Zeitreihe</button>`,
				{maxWidth: "auto"}).on('click', () => {map.flyTo([data[i].latitude, data[i].longitude], 12, {duration:0.5, easeLinearity:0.8});
	        	}).addTo(map);
			}
		}						
    })
		
	.catch(error => console.log(`This is the error: ${error}`))
	
// main-Routine Kartendarstellung mit WSV-Stationsmarker	
fetch(WSV_url)
	.then(response => response.json())
	.then(data => {
	    ourData2 = data;
	    for(let i=0;i<data.length;i++) {
	        let option = document.createElement("option");
	        option.value = i+1;
	        option.text = data[i].shortname;
	        document.querySelector(".select-dropdown2").appendChild(option);
			if (data[i].longitude)
	        {
				let diagram_id = 'src="https://www.pegelonline.wsv.de/charts/OnlineVisualisierungGanglinie?pegeluuid=' + data[i].uuid +
					'&pegelkennwerte=NW,HW,MNW,MHW,MW&dauer=24;2&imgLinien=2&anordnung=block&imgBreite=500&imgHoehe=200&schriftPegelname=11&schriftAchse=11&anzeigeUeberschrift=false\
					&anzeigeDatenquelle=true&schriftLetzterWert=15"scrolling="no"marginheight="0"marginwidth="0"frameborder="0"width="540"height="340"'
				
				
				let diagram_link = 'https://www.pegelonline.wsv.de/webservices/zeitreihe/visualisierung?pegeluuid=' + data[i].uuid
				
				
				let marker = L.marker([data[i].latitude, data[i].longitude], {icon: ourCustomIcon2}).bindPopup(`<a href= ${diagram_link} target="_blank"> ${data[i].shortname} </a> 
				<iframe
					${diagram_id}
					>
				</iframe>
					`,{maxWidth: "auto"}).on('click', () => {
	            map.flyTo([data[i].latitude , data[i].longitude], 12, {duration:0.5, easeLinearity:0.8});
	        	}).addTo(map);
			}
			else
				continue
		}						
    })
		
	.catch(error => console.log(`This is the error: ${error}`))
	




	
document.querySelector(".map-zoom-out-btn").addEventListener('click', () => {
    map.flyTo(loc, 8, {duration:0.8, easeLinearity:0.8});
});

document.querySelector(".search-btn1").addEventListener('click', () => {
    let select = document.querySelector(".select-dropdown1");
    let value = select.options[select.selectedIndex].value;
    map.flyTo([ourData1[value-1].latitude, ourData1[value-1].longitude], 12, {duration:0.8, easeLinearity:0.8});
});

document.querySelector(".search-btn2").addEventListener('click', () => {
    let select = document.querySelector(".select-dropdown2");
    let value = select.options[select.selectedIndex].value;
    map.flyTo([ourData2[value-1].latitude, ourData2[value-1].longitude], 12, {duration:0.8, easeLinearity:0.8});
});

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

/*const locationData = JSON.parse(`
    {
        "locations": [{"name": "Location A", "latitude": 54.0000, "longitude": 10.0000}]
    }`);*/



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

// Abfrage-url per WSV REST-API
//let WSV_API ='https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json'
//let SH_url = '?waters=EIDER,ELK,NOK,NORDSEE,OSTSEE,PINNAU,TRAVE,KRÜCKAU,STÖR,ELBE'
//let WSV_url = WSV_API + SH_url

// Lokale gefilterte Stationen aus der WSV-Liste
let WSV_url = './assets/WSV-Nord-Output.json'


// Gefilterte Stationen nach DWD Regionalkennung
let regional = ["SH", "NI" , "MV" , "HH"]

function closeInfobox() {
   document.getElementById("infobox").innerHTML = "Wetterdaten";
}

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
            if (winddir > 361)
				{
					winddir = "--";
					windzug = "--";
				}
			else
				if (winddir <= 180 && winddir >= 0) 
                	windzug = winddir + 180;
            	else (winddir > 180 && winddir <= 360)
                	windzug = winddir - 180;
                
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
			<br/> Wind aus: &ensp; ${winddir} Grad
			<br/><br/> <img src="./assets/wind80.png" style="transform:rotate(${winddir}deg);">
			<br/><br/> Windzugrichtung: &ensp; ${windzug} Grad
			<br/> <img src="./assets/windzug.png" style="transform:rotate(${windzug}deg);">
			</p>`;
			document.getElementById("infobox").innerHTML = result;
			
			
		})
		.catch(error => console.log(`This is error: ${error}`))
		    
			
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
				
			
				
				
				
				let marker = L.marker([data[i].latitude, data[i].longitude], {icon: ourCustomIcon}).bindPopup(`<h3> ${data[i].id} ${data[i].name}</h3> <button onclick='messwert({st_id:${data[i].id}, text:"${station}"})'> Wetterdaten</button>`,
				{maxWidth: "auto"}).on('click', () => {map.flyTo([data[i].latitude, data[i].longitude], 12);
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
				
				let marker = L.marker([data[i].latitude, data[i].longitude], {icon: ourCustomIcon2}).bindPopup(`${data[i].shortname} 
				<iframe
					${diagram_id}
					>
				</iframe>
					`,{maxWidth: "auto"}).on('click', () => {
	            map.flyTo([data[i].latitude , data[i].longitude], 12);
	        	}).addTo(map);
			}
			else
				continue
		}						
    })
		
	.catch(error => console.log(`This is the error: ${error}`))
	
	
	
document.querySelector(".map-zoom-out-btn").addEventListener('click', () => {
    map.flyTo(loc, 8);
});

document.querySelector(".search-btn1").addEventListener('click', () => {
    let select = document.querySelector(".select-dropdown1");
    let value = select.options[select.selectedIndex].value;
    map.flyTo([ourData1[value-1].latitude, ourData1[value-1].longitude], 12);
});

document.querySelector(".search-btn2").addEventListener('click', () => {
    let select = document.querySelector(".select-dropdown2");
    let value = select.options[select.selectedIndex].value;
    map.flyTo([ourData2[value-1].latitude, ourData2[value-1].longitude], 12);
});
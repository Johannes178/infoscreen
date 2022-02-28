'use strict';



let url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
let markerCollection = {
    "type": "FeatureCollection",
    "features": []
};;

let map = undefined;
function switchThemes(theme){
    if(theme === "dark"){
        map = new mapboxgl.Map({
            container: 'map',
            style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',  // Style URL; see our documentation for more options
            center: [24.93, 60.19],  // Initial focus coordinate
            zoom: 10
        });
        map.addControl(new mapboxgl.NavigationControl());
        drawMarkers()
    }else if(theme === "light"){
        map = new mapboxgl.Map({
            container: 'map',
            style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',  // Style URL; see our documentation for more options
            center: [24.93, 60.19],  // Initial focus coordinate
            zoom: 10
        });
        map.addControl(new mapboxgl.NavigationControl());
        drawMarkers()

    }
    window.removeEventListener("click", showInfo)
    window.addEventListener("click", showInfo)
}

fetchStations()
// Mapbox GL JS has a bug in it's handling of RTL, so we have to grab this dependency as well until they
// combine it with the main library
mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.1/mapbox-gl-rtl-text.js');

// Add zoom and rotation controls to the map.


const pyoraTulostus = document.querySelector('#pyoraHaku');
async function fetchStations(){
//fetch information of bikes from digitransit.fi api
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `
    {
  bikeRentalStations {
    name
    stationId
    bikesAvailable
    spacesAvailable
    lat
    lon
    allowDropoff
  }
}
      `,
        }),
    })

    const res = await response.json();


    //we need to tell mapboxgl what kind of collection of markers is this
    //so we initialize the collection with the necessary info

    //loop through the info we collected from the api
    for await (let i of res["data"]["bikeRentalStations"]) {
        //then we parse the info from the api to the correct form for mapboxgl
        let collection = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [i.lon, i.lat]
            },
            "properties": {
                "title": i.name,
                "stationId": i.stationId,
                "bikesAvailable": i.bikesAvailable,
                "spacesAvailable": i.spacesAvailable,
                "allowDropoff": i.allowDropoff
            }
        }

        //then we push collection now in the correct form into markerCollection
        markerCollection.features.push((collection))

    }//console.log(markerCollection);

    drawMarkers()
//event listener checks if the user clicks somewhere on the map

}

function drawMarkers(){
    //console.log("beginning to draw")
    let z = 0;
    // Next, we can add markers to the map
    markerCollection.features.forEach(function(point) {

        // Since these are HTML markers, we create a DOM element first, which we will later
        // pass to the Marker constructor.
        let elem = document.createElement('div');
        elem.className = 'marker';
        //we add a data-id attribute with a unique value to the marker so we can later grab info from the right marker
        elem.setAttribute("data-id", z)

        // Now, we construct a marker and set it's coordinates from the GeoJSON. Note the coordinate order.
        let marker = new mapboxgl.Marker(elem);
        marker.setLngLat(point.geometry.coordinates);

        // You can also create a popup that gets shown when you click on a marker. You can style this using
        // CSS as well if you so desire. A minimal example is shown. The offset will depend on the height of your image.
        let popup = new mapboxgl.Popup({ offset: 24, closeButton: false });
        popup.setHTML('<div>' + point.properties.title + '</div>');

        // Set the marker's popup.
        marker.setPopup(popup);

        // Finally, we add the marker to the map.
        marker.addTo(map);
        z++;

    });
}

function showInfo(event) {
    //then we check if the user clicked on a marker
    if(event.target.classList.contains("mapboxgl-marker")){
        //console.log("clicked")
        //we grab the unique value from data-id attribute
        const itemKey = event.target.dataset.id;
        console.log(markerCollection.features[itemKey])
        //now with the unique id we can print it on to DOM
        let html = `
                <h3 id="name">Station name: ${markerCollection.features[itemKey].properties.title}</h3>
    <h4 id="stationid">Station number: ${markerCollection.features[itemKey].properties.stationId}</h4>
    <p id="bikes">Bikes available: ${markerCollection.features[itemKey].properties.bikesAvailable}</p>
    <p id="spaces">Spaces available: ${markerCollection.features[itemKey].properties.spacesAvailable}</p>
    <p id="allow">Drop off allowed: ${markerCollection.features[itemKey].properties.allowDropoff ? "yes" : "no"}</p>
            `
        pyoraTulostus.innerHTML = html;
    }else{//console.log("error")
    }
}


let checkbox = document.querySelector('.checkbox');
let chk = document.querySelector('#chk');

chk.addEventListener('change', () => {
    //console.log("checkbox clicked")
    document.body.classList.toggle('dark');
    document.querySelector("#pyoraHaku").classList.toggle('dark');
    document.querySelector(".navbarContent").classList.toggle('dark');
    if(document.body.classList.contains('dark')){ //when the body has the class 'dark' currently
        localStorage.setItem('darkMode', 'enabled'); //store this data if dark mode is on
        switchThemes("dark")
    }else{
        localStorage.setItem('darkMode', 'disabled'); //store this data if dark mode is off
        switchThemes("light")
    }

});

if(localStorage.getItem('darkMode') === 'enabled'){
    checkbox.checked = true;
    switchThemes("dark")
    document.body.classList.toggle('dark');
    document.querySelector("#pyoraHaku").classList.toggle('dark');
    document.querySelector(".navbarContent").classList.toggle('dark');
    if(document.body.classList.contains('dark')){ //when the body has the class 'dark' currently
        localStorage.setItem('darkMode', 'enabled'); //store this data if dark mode is on
    }else{
        localStorage.setItem('darkMode', 'disabled'); //store this data if dark mode is off
    }
}
if(localStorage.getItem('darkMode') === "disabled"){
    checkbox.checked = false;
    switchThemes("light");
}
if(localStorage.getItem('darkMode') === null){
    checkbox.checked = false;
    localStorage.setItem('darkMode', 'disabled'); //store this data if dark mode is off
    switchThemes("light");
}


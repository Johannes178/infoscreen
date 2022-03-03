'use strict';



let url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
let markerCollection = {
    "type": "FeatureCollection",
    "features": []
};;

let map = undefined;
function switchThemes(theme){
    if(theme === "light"){
        map = new mapboxgl.Map({
            container: 'map',
            style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',  // Style URL; see our documentation for more options
            center: [24.97647089113386, 60.20995013106471],
            // Initial focus coordinate
            zoom: 14.16
        });
        map.addControl(new mapboxgl.NavigationControl());
        drawMarkers()
}}

fetchStations()
// Mapbox GL JS has a bug in it's handling of RTL, so we have to grab this dependency as well until they
// combine it with the main library
mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.1/mapbox-gl-rtl-text.js');

// Add zoom and rotation controls to the map.

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
    bikesAvailable
    lat
    lon
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
                "bikesAvailable": i.bikesAvailable,
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
        popup.setHTML('<div>' + point.properties.bikesAvailable + '</div>');

        // Set the marker's popup.
        marker.setPopup(popup);

        // Finally, we add the marker to the map.
        marker.addTo(map);
        z++;

    });
}

let checkbox = document.querySelector('.checkbox');
let chk = document.querySelector('#chk');

chk.addEventListener('change', () => {
    //console.log("checkbox clicked")
    document.querySelector("#pyoraHaku").classList.toggle('dark');
    document.querySelector(".navbarContent").classList.toggle('dark');
});
if(localStorage.getItem('darkMode') === "disabled"){
    checkbox.checked = false;
    switchThemes("light");
}



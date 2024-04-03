let manhattanPolygon, brooklynPolygon, statenIslandPolygon;
let markerData = [];
let people_markers = [];
let people_coordinates = [];
let tornado;

let map = L.map('map', {
    maxBounds: [
        [40.98096762416953, -73.67364618257551], // South-West coordinates of New York City
        [40.44698013459168, -74.24768182710676]  // North-East coordinates of New York City
    ]
});

let city_coordinates = [[40.59096762416953, -74.14364618257551], [40.63096762416953, -73.95364618257551],
                    [40.85096762416953, -73.88364618257551], [40.9396762416953, -73.81364618257551],
                    [40.7096762416953, -73.80364618257551]]

let next_city_index_dict_if_tornado_above = {0:0,
                                            1:0,
                                            2:1,
                                            3:4,
                                            4:1};

let next_city_index_dict_if_tornado_below = {0:1,
                                            1:4,
                                            2:3,
                                            3:3,
                                            4:3};

let people_nearest_cities = [];
let people_speeds = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
let people_step_sizes = [[], [], [], [], [], [], [], [], [], []];
let people_moving = [false, false, false, false, false,
                     false, false, false, false, false]

const markerHtmlStyles = (color) => `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`;

const cityHtmlStyles = (color) => `
    background-color: ${color};
    width: 3rem;
    height: 3rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`;

// Create custom marker icons with predefined color names
const greenIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('green')}"></span>`
});

const blueIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${cityHtmlStyles('blue')}"></span>`
});

const redIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('red')}"></span>`
});

const greyIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('grey')}"></span>`
});

const blackIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${cityHtmlStyles('black')}"></span>`
});

function initializeVirusMap() {
    clearMap();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    
    map.fitBounds([
        [40.98096762416953, -73.67364618257551],
        [40.44698013459168, -74.24768182710676] 
    ]);
    
    map.setMinZoom(map.getBoundsZoom(map.options.maxBounds));

    var manhattanCoordinates = [
        [40.97278146829103, -73.8706581072941],
        [40.96915383694315, -73.70516416745767],
        [40.85348349961324, -73.83220308392961],
        [40.81869100145499, -73.8102287848642],
        [40.822326892778534, -73.91048652435019],
        [40.72096680604096, -73.99701032692029],
        [40.74853125898153, -74.00044381114927],
        [40.968635587611566, -73.87615168206047]
    ];

    manhattanPolygon = L.polygon(manhattanCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map);

    var brooklynCoordinates = [
        [40.77972251660068, -73.9091131306586],
        [40.75373081845422, -73.84662371769132],
        [40.78647869292305, -73.8232760249343],
        [40.7807619730752, -73.7868810921072],
        [40.73188993644669, -73.72919855706046],
        [40.672050822262214, -73.72988525390628],
        [40.65903520615225, -73.84731041453709],
        [40.6288291951031, -73.89537919374271],
        [40.591834263521115, -73.90224616220065],
        [40.576717766803554, -73.98396308685018],
        [40.61372106357173, -74.02791168498104],
        [40.67985897266432, -73.99289014584551],
        [40.74489132542966, -73.95031494140626]
    ];

    brooklynPolygon = L.polygon(brooklynCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map); // Add the polygon to the map

    var statenIslandCoordinates = [
        [40.63872577325326, -74.0801006452614],
        [40.62153604099451, -74.0807873421072],
        [40.60173632268016, -74.05881304304178],
        [40.54751762266808, -74.12473594023804],
        [40.50525916508194, -74.2387276166399],
        [40.53656428476727, -74.2414744040231],
        [40.558990626986024, -74.19958589642962],
        [40.6324754735059, -74.18653865635952]
    ];

    statenIslandPolygon = L.polygon(statenIslandCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map); // Add the polygon to the map

    // Simulation initializes as virus model with 9 susceptible (green) and 1 infected (red) agents
    placeAgents(9, 'green');
    placeAgents(1, 'red');

    socket.emit('simulation_points', {agent_points: markerData});
}

function initializeTornadoMap(){
    clearMap();
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    
    map.fitBounds([
        [40.98096762416953, -73.67364618257551],
        [40.44698013459168, -74.24768182710676] 
    ]);
    
    map.setMinZoom(map.getBoundsZoom(map.options.maxBounds));

    var manhattanCoordinates = [
        [40.97278146829103, -73.8706581072941],
        [40.96915383694315, -73.70516416745767],
        [40.85348349961324, -73.83220308392961],
        [40.81869100145499, -73.8102287848642],
        [40.822326892778534, -73.91048652435019],
        [40.72096680604096, -73.99701032692029],
        [40.74853125898153, -74.00044381114927],
        [40.968635587611566, -73.87615168206047]
    ];

    manhattanPolygon = L.polygon(manhattanCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map);

    var brooklynCoordinates = [
        [40.77972251660068, -73.9091131306586],
        [40.75373081845422, -73.84662371769132],
        [40.78647869292305, -73.8232760249343],
        [40.7807619730752, -73.7868810921072],
        [40.73188993644669, -73.72919855706046],
        [40.672050822262214, -73.72988525390628],
        [40.65903520615225, -73.84731041453709],
        [40.6288291951031, -73.89537919374271],
        [40.591834263521115, -73.90224616220065],
        [40.576717766803554, -73.98396308685018],
        [40.61372106357173, -74.02791168498104],
        [40.67985897266432, -73.99289014584551],
        [40.74489132542966, -73.95031494140626]
    ];

    brooklynPolygon = L.polygon(brooklynCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map); // Add the polygon to the map

    var statenIslandCoordinates = [
        [40.63872577325326, -74.0801006452614],
        [40.62153604099451, -74.0807873421072],
        [40.60173632268016, -74.05881304304178],
        [40.54751762266808, -74.12473594023804],
        [40.50525916508194, -74.2387276166399],
        [40.53656428476727, -74.2414744040231],
        [40.558990626986024, -74.19958589642962],
        [40.6324754735059, -74.18653865635952]
    ];

    statenIslandPolygon = L.polygon(statenIslandCoordinates, {
        color: 'none', // Set the border color to none
        fillColor: 'none', // Set the fill color
    }).addTo(map); // Add the polygon to the map

    placeAgents(10, 'green');

    defineTornadoAndCities();
}


// Function to generate a random point within a polygon
function generateRandomPointInPolygon(polygon) {
    var bounds = polygon.getBounds();
    var xMin = bounds.getSouthWest().lng;
    var xMax = bounds.getNorthEast().lng;
    var yMin = bounds.getSouthWest().lat;
    var yMax = bounds.getNorthEast().lat;

    var point;
    var isInside = false;

    while (!isInside) {
        var randomX = Math.random() * (xMax - xMin) + xMin;
        var randomY = Math.random() * (yMax - yMin) + yMin;
        point = L.latLng(randomY, randomX);

        isInside = isPointInsidePolygon(point, polygon);
    }

    return point;
}

// Function to check if a point is within the bounds of a polygon
function isPointInsidePolygon(point, polygon) {
    var polyPoints = polygon.getLatLngs()[0];
    var x = point.lng, y = point.lat;
    var inside = false;
    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
        var xi = polyPoints[i].lng, yi = polyPoints[i].lat;
        var xj = polyPoints[j].lng, yj = polyPoints[j].lat;
        var intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function placeAgents(numMarkers, color) {
    // Population Density Coefficients for each polygon. Each is normalized to sum to 1
    var manhattanCoefficient = 0.3253012048192771;
    var brooklynCoefficient = 0.6144578313253012;
    var statenIslandCoefficient = 0.060240963855421686;

    for (var i = 0; i < numMarkers; i++) {
        // Generate a random number between 0 and 1
        var random = Math.random();

        if (random < manhattanCoefficient) { 
            point = generateRandomPointInPolygon(manhattanPolygon);
        }
        
        else if (random < manhattanCoefficient + brooklynCoefficient) { 
            point = generateRandomPointInPolygon(brooklynPolygon);
        }
        
        else {
            point = generateRandomPointInPolygon(statenIslandPolygon);
        }

        var icon_type = getColorIcon(color);
        let person = L.marker(point, {icon: icon_type}).addTo(map);
        people_coordinates.push([point.lat, point.lng])
        people_markers.push(person);
        markerData.push({coordinates: [point.lat, point.lng], color: color});
    }
}

function getColorIcon(color) {
    switch (color) {
        case 'green':
            return greenIcon;
        case 'red':
            return redIcon;
        case 'grey':
            return greyIcon;
        case 'black':
            return blackIcon;
        case 'blue':
            return blueIcon;
        default:
            return null;
    }
}

function clearMap() {
    // Remove all layers except the tile layer (base map)
    map.eachLayer(function(layer) {
        if (!layer._url) { // If it's not the tile layer
            map.removeLayer(layer);
        }
    });

    // You might also want to reset any global variables used by simulations here
    markerData = [];
    people_markers = [];
    people_coordinates = [];
    // Add any other necessary resets
}

function updateMarkers(agent_states) {
    // Clear existing markers
    resetMap();

    // Assume agent_states is an array like [0, 1, 2, 0, 1], where 0: Safe (Green), 1: Infected (Red), 2: Dead (Black)
    agent_states.forEach((state, index) => {
        const agentInfo = markerData[index];
        const icon_type = getIconByAgentState(state);
        L.marker([agentInfo.coordinates[0], agentInfo.coordinates[1]], {icon: icon_type}).addTo(map);
    });
}

function getIconByAgentState(state) {
    switch (state) {
        case 0: // SAFE
            return greenIcon;
        case 1: // INFECTED
            return redIcon;
        case 2: // DEAD
            return greyIcon;
        case 3:
            return blackIcon;
        default:
            return greenIcon; // For any other state, if applicable
    }
}

function resetMap(){
    map.eachLayer(function(layer) {
        if (!!layer.toGeoJSON) {
            map.removeLayer(layer);
        }
    });

    // Add polygons back after clearing
    manhattanPolygon.addTo(map);
    brooklynPolygon.addTo(map);
    statenIslandPolygon.addTo(map);
}

function resetMarkers(){
    markerData = [];
    people_markers = [];
    people_coordinates = [];
}


let executed = false;

function evacuate() {
    let tornadoLatLng = tornado.getLatLng();
    let tornadoLat = tornadoLatLng.lat;
    let tornadoLng = tornadoLatLng.lng;
    const evacuationDistance = 0.1; // Set the distance threshold for evacuation

    for (let i = 0; i < people_markers.length; i++) {
        let person = people_markers[i];
        let personLatLng = person.getLatLng();
        let personLat = personLatLng.lat;
        let personLng = personLatLng.lng;

        // Calculate the distance between the person and the tornado
        let distance = Math.sqrt(Math.pow(tornadoLat - personLat, 2) + Math.pow(tornadoLng - personLng, 2));
        

        if (distance < evacuationDistance) {
            if (!people_moving[i]) {
                people_moving[i] = true;
                let next_city_index = next_city_index_dict_if_tornado_below[people_nearest_cities[i]];
                const random_city_offset = (Math.random() - 0.5) * 0.1;
                let next_city_coordinates = [city_coordinates[next_city_index][0]+random_city_offset, city_coordinates[next_city_index][1]+random_city_offset];
                
                let step_size_x = (next_city_coordinates[0] - people_coordinates[i][0]) / people_speeds[i];
                let step_size_y = (next_city_coordinates[1] - people_coordinates[i][1]) / people_speeds[i];
                people_step_sizes[i] = [step_size_x, step_size_y];

            }
        }
        if (people_speeds[i] > 0 && people_moving[i]){
            // Move the person away from the tornado (adjust latitude and longitude)
            let newPersonLat = personLat + people_step_sizes[i][0]; // Move person's latitude away from tornado
            let newPersonLng = personLng + people_step_sizes[i][1]; // Move person's longitude away from tornado
            
            people_coordinates[i][0] = newPersonLat;
            people_coordinates[i][1] = newPersonLng;

            // display updated marker on the map
            person.setLatLng({ lat: people_coordinates[i][0], lng: people_coordinates[i][1] });
            people_speeds[i]--;
        }
        if (people_speeds[i] == 0){
            people_moving[i] = false;
            people_speeds[i] = 100;
        }
    }
}

function assign_people_to_city() {
    for (let person = 0; person < people_coordinates.length; person++) {
        
        // setting to 100 just because it is a number that will always be higher than the first distance calculation
        let minimum_distance_to_city = 100;
        let minimum_city_index = 100;
        for (let city = 0; city < city_coordinates.length; city++){
            let current_distance_to_city = Math.sqrt(Math.pow(Math.abs(people_coordinates[person][0] - city_coordinates[city][0]), 2) + Math.pow(Math.abs(people_coordinates[person][1] - city_coordinates[city][1]), 2));
            
            if (current_distance_to_city < minimum_distance_to_city) {
                minimum_distance_to_city = current_distance_to_city;
                minimum_city_index = city;
            }
        }
        
        people_nearest_cities.push(minimum_city_index)
    }
}

function defineTornadoAndCities(){
    tornado = tornado = L.marker({lat: 40.614509227686754, lng: -74.43066400484114}, {icon: blackIcon}).addTo(map);
    city0 = L.latLng(city_coordinates[0][0], city_coordinates[0][1]);
    city1 = L.latLng(city_coordinates[1][0], city_coordinates[1][1]);
    city2 = L.latLng(city_coordinates[2][0], city_coordinates[2][1]);
    city3 = L.latLng(city_coordinates[3][0], city_coordinates[3][1]);
    city4 = L.latLng(city_coordinates[4][0], city_coordinates[4][1]);

    var icon_type = getColorIcon('blue');
    L.marker(city0, {icon: icon_type}).addTo(map);
    markerData.push({coordinates: [city0.lat, city0.lng], color: 'blue'});

    L.marker(city1, {icon: icon_type}).addTo(map);
    markerData.push({coordinates: [city1.lat, city1.lng], color: 'blue'});

    L.marker(city2, {icon: icon_type}).addTo(map);
    markerData.push({coordinates: [city2.lat, city2.lng], color: 'blue'});

    L.marker(city3, {icon: icon_type}).addTo(map);
    markerData.push({coordinates: [city3.lat, city3.lng], color: 'blue'});

    L.marker(city4, {icon: icon_type}).addTo(map);
    markerData.push({coordinates: [city4.lat, city4.lng], color: 'blue'});
}

function testFunction() {
    assign_people_to_city()
    console.log(people_nearest_cities)
    if (executed) {
        map.removeLayer(polyline);
    }

    let final_x_tornado_position = -73.44768182710676;
    let current_lat = 40.614509227686754;
    let current_lng = -74.43066400484114;
    let tornadoPath = []; // Array to store tornado path coordinates

    let x_step = (final_x_tornado_position - current_lng) / 500;

    let interval = setInterval(() => {
        if (current_lng < final_x_tornado_position) {

            // move tornado ------------------------
            const lngIncrement = (Math.random() - 0.5) * 0.01; // Random value between -0.005 and 0.005
            current_lat += lngIncrement;
            current_lng += x_step;
            tornado.setLatLng({ lat: current_lat, lng: current_lng });
            lat = tornado.getLatLng().lat;
            lng = tornado.getLatLng().lng;
            tornadoPath.push([current_lat, current_lng]); // Store current position in tornadoPath
            // -----------------------------------------

            // Clear existing polyline and create a new one with updated path
            if (tornadoPath.length > 1) {
                map.removeLayer(polyline); // Remove previous polyline
            }
            polyline = L.polyline(tornadoPath, { color: 'black' }).addTo(map); // Add updated polyline
            evacuate()

        } else {
            clearInterval(interval);
            executed = true;
        }
    }, 10);    
}

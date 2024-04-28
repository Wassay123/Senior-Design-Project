// Define polygons for major areas in New York City to be used in simulations
let manhattanPolygon, brooklynPolygon, statenIslandPolygon;

// Array to store data related to each marker on the map for simulation tracking
let markerData = [];

// Array to hold marker objects that represent people in the simulation
let people_markers = [];

// Array to store coordinates of each person marker
let people_coordinates = [];

// Declare variables surrounding the tornado marker
let tornado;  
let initial_tornado_lat; 
let initial_tornado_lng; 
let tornado_lat;  
let tornado_lng; 

// Define the bounds within which the tornado can start its path
let tornado_top_bound_start_point = 40.98096762416953;  // Northernmost point for tornado start
let tornado_bottom_bound_start_point = 40.48096762416953;  // Southernmost point for tornado start
let tornado_start;  // Stores initial starting point of the tornado

// Initialize the map with specific bounds for New York City
let map = L.map('map', {
    maxBounds: [
        [40.98096762416953, -73.67364618257551], // North-East coordinates of the bounding box
        [40.44698013459168, -74.24768182710676]  // South-West coordinates of the bounding box
    ]
});

// Array of coordinates representing safe haven cities or locations within the tornado simulation area
let city_coordinates = [
    [40.59096762416953, -74.14364618257551],  
    [40.63096762416953, -73.95364618257551],  
    [40.85096762416953, -73.88364618257551],  
    [40.9396762416953, -73.81364618257551],   
    [40.7096762416953, -73.80364618257551] 
];

/**
 * Initializes the map specifically for the virus simulation model.
 * This function clears the map, sets up base layers, defines regions as polygons,
 * and initializes the simulation with default agent states.
 */
function initializeVirusMap() {
    // Remove all existing layers and markers to prepare for a new simulation setup.
    clearMap();

    // Add OpenStreetMap tiles as the base layer of the map.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Set the map's view to fit the predefined bounds, focusing on New York City.
    map.fitBounds([
        [40.98096762416953, -73.67364618257551], // North-East corner
        [40.44698013459168, -74.24768182710676]  // South-West corner
    ]);
    
    // Ensure the zoom level does not go beyond what is specified for these bounds.
    map.setMinZoom(map.getBoundsZoom(map.options.maxBounds));

    // Define coordinates for a polygon representing Manhattan.
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

    // Create and add the polygon for Manhattan without any visible border or fill color.
    manhattanPolygon = L.polygon(manhattanCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Define coordinates for a polygon representing Brooklyn.
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

    // Create and add the polygon for Brooklyn.
    brooklynPolygon = L.polygon(brooklynCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Define coordinates for a polygon representing Staten Island.
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

    // Create and add the polygon for Staten Island.
    statenIslandPolygon = L.polygon(statenIslandCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Start the simulation with 9 susceptible agents (green) and 1 infected agent (red).
    placeAgents(9, 'green');
    placeAgents(1, 'red');

    // Emit the initial setup of agent positions to the backend to initialize the simulation's map of agents
    socket.emit('simulation_points', {agent_points: markerData});
}

/**
 * Initializes the map specifically for the tornado simulation model.
 * Clears existing map data, sets up base layers, defines geographic regions,
 * and places initial agents and tornado elements.
 */
function initializeTornadoMap(){
    // Clear any existing markers or layers to prepare for new simulation setup.
    clearMap();
    
    // Add OpenStreetMap tiles as the base layer of the map.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Set the map's view to encompass the predefined bounds, focusing on New York City.
    map.fitBounds([
        [40.98096762416953, -73.67364618257551], // North-East corner
        [40.44698013459168, -74.24768182710676]  // South-West corner
    ]);
    
    // Ensure the zoom level is appropriately set to show the entire specified area.
    map.setMinZoom(map.getBoundsZoom(map.options.maxBounds));

    // Define coordinates for the Manhattan region, to be represented as a polygon.
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

    // Add the polygon for Manhattan to the map with no visible borders or fill color.
    manhattanPolygon = L.polygon(manhattanCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Define coordinates and create a polygon for Brooklyn.
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

    // Add the polygon for Brooklyn to the map.
    brooklynPolygon = L.polygon(brooklynCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Define coordinates and create a polygon for Staten Island.
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

    // Add the polygon for Staten Island to the map.
    statenIslandPolygon = L.polygon(statenIslandCoordinates, {
        color: 'none',
        fillColor: 'none',
    }).addTo(map);

    // Place initial agents (all 'green' for safe) on the map for the tornado simulation.
    placeAgents(10, 'green');

    // Initialize additional elements specific to the tornado simulation like the tornado itself and city markers.
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

        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

// Function to place agents according to the population distributions of NYC Burroughs
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

        var icon_type = getIconByColor(color);
        let person = L.marker(point, {icon: icon_type}).addTo(map);
        people_coordinates.push([point.lat, point.lng])
        people_markers.push(person);
        markerData.push({coordinates: [point.lat, point.lng], color: color});
    }
}

// Clears all non-tile layers from the map and resets related data structures.
function clearMap() {
    map.eachLayer(function(layer) {
        if (!layer._url) { // The tile layer has a URL property
            map.removeLayer(layer);
        }
    });

    // Reset simulation data and variables.
    markerData = [];
    people_markers = [];
    people_coordinates = [];
    people_nearest_cities = [];
    city_populations = Array(city_coordinates.length).fill(0);
    after_animation = 200;
}

// Updates markers on the map to reflect changes in agent states.
function updateMarkers(agent_states) {
    resetMap(); // Clear existing markers before updating

    agent_states.forEach((state, index) => {
        const agentInfo = markerData[index];
        const icon_type = getIconByAgentState(state);
        L.marker([agentInfo.coordinates[0], agentInfo.coordinates[1]], {icon: icon_type}).addTo(map);
    });
}

// Resets the map by removing all feature layers and re-adding necessary polygons.
function resetMap(){
    map.eachLayer(function(layer) {
        if (!!layer.toGeoJSON) {
            map.removeLayer(layer);
        }
    });

    // Re-add essential polygons for simulation context.
    manhattanPolygon.addTo(map);
    brooklynPolygon.addTo(map);
    statenIslandPolygon.addTo(map);
}

// Resets marker arrays and reinitializes simulation variables for tornado settings.
function resetMarkers(){
    markerData = [];
    people_markers = [];
    people_coordinates = [];
    people_speeds = Array(num_of_agents).fill(200);
    people_step_sizes = Array(num_of_agents).fill([]);
    people_moving = Array(num_of_agents).fill(false);
    people_alive = Array(num_of_agents).fill(true);

    // Recalculate starting positions for the tornado based on random boundaries.
    tornado_start = Math.random() * (tornado_top_bound_start_point - tornado_bottom_bound_start_point) + tornado_bottom_bound_start_point;
    tornado_lat = tornado_start;
    tornado_lng = initial_tornado_lng;
}

// Initializes tornado and city markers on the map for the tornado simulation.
function defineTornadoAndCities() {
    // Determine random starting position for the tornado within defined bounds.
    tornado_start = Math.random() * (tornado_top_bound_start_point - tornado_bottom_bound_start_point) + tornado_bottom_bound_start_point;

    // Initialize tornado position if the simulation hasn't started yet.
    if (!simulation_started) {
        tornado_lat = tornado_start;
        tornado_lng = -74.43066400484114;
        initial_tornado_lat = tornado_lat;
        initial_tornado_lng = tornado_lng;
    }

    // Create and add a draggable tornado marker to the map.
    tornado = L.marker({lat: tornado_lat, lng: tornado_lng}, {icon: tornadoIcon, draggable: true}).addTo(map);
    tornado.on('dragend', tornado_drag_function);

    // Place markers for cities using predefined coordinates.
    city0 = L.latLng(city_coordinates[0][0], city_coordinates[0][1]);
    city1 = L.latLng(city_coordinates[1][0], city_coordinates[1][1]);
    city2 = L.latLng(city_coordinates[2][0], city_coordinates[2][1]);
    city3 = L.latLng(city_coordinates[3][0], city_coordinates[3][1]);
    city4 = L.latLng(city_coordinates[4][0], city_coordinates[4][1]);

    var icon_type = getIconByColor('blue');
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

// Updates the visual representation of agents based on their current states in the virus simulation.
function updateVirusVisuals(data) {
    // Extract agent states from data and update markers accordingly.
    var agent_states = data.agent_states;
    updateMarkers(agent_states);
}

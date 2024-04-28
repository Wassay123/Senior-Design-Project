// initial variables
let tornadoInterval;
let evacuation_radius = 0.1;
let death_distance = 0.05;
let injury_distance = 0.10;
let death_rate = 1;
let max_people_in_a_city = 30;
let after_animation = 200;
let simulation_started = false;

let num_of_agents = 10;

let people_nearest_cities = [];
let people_speeds = Array(num_of_agents).fill(200);
let people_step_sizes = Array(num_of_agents).fill([]);
let people_moving = Array(num_of_agents).fill(false);
let people_alive = Array(num_of_agents).fill(true)
let city_populations = Array(city_coordinates.length).fill(0)
let executed = false;

// dictionary to map what the next destination city is for a person at said city, when the tornado is above the person
let next_city_index_dict_if_tornado_above = {0:[0, 1, 4, 2, 3],
    1:[0, 1, 4, 2, 3],
    2:[4, 1, 0, 3, 0],
    3:[4, 2, 1, 0, 1],
    4:[1, 0, 4, 2, 3]};

// dictionary to map what the next destination city is for a person at said city, when the tornado is below the person
let next_city_index_dict_if_tornado_below = {0:[1, 4, 2, 3, 0],
    1:[4, 2 ,0, 1, 3],
    2:[3, 4, 2, 1, 0],
    3:[3, 4, 2, 1, 0],
    4:[1, 1, 0, 2, 4]};

// function to move person when tornado gets too close
function evacuate(evacuation_distance, injury_and_death_rate, safe, injured, dead) {

    // gets the tornado's latitude and longitude
    let tornadoLatLng = tornado.getLatLng();
    let tornadoLat = tornadoLatLng.lat;
    let tornadoLng = tornadoLatLng.lng;

    // iterate through all the people on the map
    for (let i = 0; i < people_markers.length; i++) {
        
        // get the person's latitude and longitude
        let person = people_markers[i];
        let personLatLng = person.getLatLng();
        let personLat = personLatLng.lat;
        let personLng = personLatLng.lng; 

        // Calculate the distance between the person and the tornado
        let distance = Math.sqrt(Math.pow(tornadoLat - personLat, 2) + Math.pow(tornadoLng - personLng, 2));

        //  If too close the tornado might kill the person
        if (distance < death_distance && people_alive[i]) {

            let random_number = Math.random();
            if (random_number < injury_and_death_rate) {
                person.setIcon(getIconByColor('red'));
                people_alive[i] = false;
                dead[i] = 1;
                safe[i] = 0;
                injured[i] = 0;
            }
        }
        
        //  If too close the tornado might injure the person
        if (distance < injury_distance && people_alive[i]) {
            let random_number = Math.random();

            // injury rate should be a little higher than death rate
            if (random_number < injury_and_death_rate * 1.15) {
                person.setIcon(getIconByColor('grey'));
                injured[i] = 1;
                safe[i] = 0;
                dead[i] = 0;
            }
        }
        
        // if tornado is within evacuation distance to person
        if (distance < evacuation_distance && people_alive[i]) {

            // only activate if the person is not already moving
            if (!people_moving[i]) {
                people_moving[i] = true;

                // assign next city index to the person
                let next_city_index;

                // if tornado is above person
                if ((tornadoLng - personLng) >= 0){
                    
                    // iterate through the possible next cities based on what city the person is currently at
                    for (j = 0; j < next_city_index_dict_if_tornado_above[people_nearest_cities[i]].length-1; j++){
                        
                        // if the potential city has less than the maximum amount of people in the city
                        if (city_populations[next_city_index_dict_if_tornado_above[people_nearest_cities[i][j]]] < max_people_in_a_city){
                            
                            // subtract one from previous city population
                            let person_previous_city_index = people_nearest_cities[i]
                            city_populations[person_previous_city_index]--

                            // find new city index and add one to new city index population
                            next_city_index = next_city_index_dict_if_tornado_above[people_nearest_cities[i]][j];
                            city_populations[next_city_index]++;

                            // change the current city that the person is in
                            people_nearest_cities[i] = next_city_index
                            break
                        }
                    }

                    // if no city has space then go to the last possible city
                    if (typeof next_city_index === 'undefined'){
                        next_city_index = next_city_index_dict_if_tornado_above[people_nearest_cities[i]][4];
                    }
                }

                // if tornado is below person
                else{

                    // iterate through the possible next cities based on what city the person is currently at
                    for (j = 0; j < next_city_index_dict_if_tornado_below[people_nearest_cities[i]].length-1; j++){

                        // if the potential city has less than the maximum amount of people in the city
                        if (city_populations[next_city_index_dict_if_tornado_below[people_nearest_cities[i]][j]] < max_people_in_a_city){
                            
                            // subtract one from previous city population
                            let person_previous_city_index = people_nearest_cities[i]
                            city_populations[person_previous_city_index]--

                            // find new city index and add one to new city index population
                            next_city_index = next_city_index_dict_if_tornado_below[people_nearest_cities[i]][j];
                            city_populations[next_city_index]++;

                            // change the current city that the person is in
                            people_nearest_cities[i] = next_city_index
                            break
                        }
                    }

                    // if no city has space then go to the last possible city
                    if (typeof next_city_index === 'undefined'){
                        next_city_index = next_city_index_dict_if_tornado_below[people_nearest_cities[i]][4];
                    }
                }
                // get a random offset so all new city inhabitants do not go in the same spot
                let random_city_offset_x = (Math.random() - 0.5) * 0.1;
                let random_city_offset_y = (Math.random() - 0.5) * 0.1;

                // coordinates of the next city
                let next_city_coordinates = [city_coordinates[next_city_index][0]-0.03+random_city_offset_x, city_coordinates[next_city_index][1]+0.005+random_city_offset_y];
                
                // calculate step size for the person to move each iteration
                let step_size_x = (next_city_coordinates[0] - people_coordinates[i][0]) / people_speeds[i];
                let step_size_y = (next_city_coordinates[1] - people_coordinates[i][1]) / people_speeds[i];
                people_step_sizes[i] = [step_size_x, step_size_y];

            }
        }

        // if the person still has to travel to the next city and they are moving and alive
        if (people_speeds[i] > 0 && people_moving[i] && people_alive[i]){

            // move the person towards the next city
            let newPersonLat = personLat + people_step_sizes[i][0];
            let newPersonLng = personLng + people_step_sizes[i][1];
            
            // update the person's coordinates
            people_coordinates[i][0] = newPersonLat;
            people_coordinates[i][1] = newPersonLng;

            // display updated marker on the map
            person.setLatLng({ lat: people_coordinates[i][0], lng: people_coordinates[i][1] });

            // decrease the remaining amount of steps that the person needs to take
            people_speeds[i]--;
        }

        // if the person has no more steps remaining and is alive
        if (people_speeds[i] == 0 && people_alive[i]){

            people_moving[i] = false;

            // assign a new random amount of steps between 150 and 250
            let random_speed = Math.floor(Math.random() * (250 - 150 + 1)) + 150;
            people_speeds[i] = random_speed;

        }
    }

    // update injured, dead, and safe stats on the user interface
    let injured_count = injured.reduce((acc, cur) => acc + cur, 0);
    let dead_count = dead.reduce((acc, cur) => acc + cur, 0);
    let safe_count = safe.reduce((acc, cur) => acc + cur, 0);
    
    updateTornadoSimulationCharts(safe_count, dead_count, injured_count);
    updateTornadoSimulationStats(safe_count, dead_count, injured_count);
}

// function to assign every person to their nearest city
function assign_people_to_city() {

    // iterate through every person
    for (let person = 0; person < people_coordinates.length; person++) {
        
        // setting to 100 just because it is a number that will always be higher than the first distance calculation
        let minimum_distance_to_city = 100;
        let minimum_city_index = 100;

        // iterate through every city
        for (let city = 0; city < city_coordinates.length; city++){

            // find the distance to the current city
            let current_distance_to_city = Math.sqrt(Math.pow(Math.abs(people_coordinates[person][0] - city_coordinates[city][0]), 2) + Math.pow(Math.abs(people_coordinates[person][1] - city_coordinates[city][1]), 2));
            
            // if it is a new minimum distance than assign it as such
            if (current_distance_to_city < minimum_distance_to_city) {
                minimum_distance_to_city = current_distance_to_city;
                minimum_city_index = city;
            }
        }
        
        // add to the array
        people_nearest_cities.push(minimum_city_index);

        // add to the population of the minimum distance city
        city_populations[people_nearest_cities[person]]++;
        
    }
}

// function that runs the tornado simulation
function runTornadoSimulation(simulationParams) {
    // gets the stats from the sliders on the user interface
    let [num_of_agents, tornadoMoveChance, tornadoRadius, tornadoIntensity, injury_and_death_rate, simulation_speed] = simulationParams;

    // initialize arrays
    people_speeds = Array(num_of_agents).fill(200);
    people_step_sizes = Array(num_of_agents).fill([]);
    people_moving = Array(num_of_agents).fill(false);
    people_alive = Array(num_of_agents).fill(true)

    // scale evacuation radius
    evacuation_radius = tornadoIntensity * 0.5;

    // Initialize injured and dead arrays
    let injured = new Array(people_markers.length).fill(0);
    let dead = new Array(people_markers.length).fill(0);
    let safe = new Array(people_markers.length).fill(1);

    // scale death_rate to account for large amount of computer calculations per second
    if (injury_and_death_rate !== 1){
        injury_and_death_rate = 0.1 * injury_and_death_rate;
    }

    // assign the people to their nearest cities
    assign_people_to_city()

    // if the simualtion has been executed and run again, delete the previous tornado path
    if (executed) {
        map.removeLayer(polyline);
    }

    let final_x_tornado_position = -73.48768182710676;
    
    let current_lat = tornado.getLatLng().lat;
    let current_lng = tornado.getLatLng().lng;
    let tornadoPath = [];

    // make it so the tornado has to take 500 iterations to make its way across the map
    let x_step = (final_x_tornado_position - current_lng) / 500;

    // animation
    tornadoInterval = setInterval(() => {

        // if the tornado is not in its final position
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

            // call evacuation function
            evacuate(evacuation_radius, injury_and_death_rate, safe, injured, dead);
        
        }

        // if the tornado is done moving, finish moving the people to their next city
        else if (after_animation > 0){
            evacuate(evacuation_radius, injury_and_death_rate, safe, injured, dead);
            after_animation--;
            }
        
        // if everything is done moving stop the animation
        else {

            clearInterval(tornadoInterval);
            executed = true;
        }
        // alters how fast the simulation moves with the simulation_speed variable
    }, 40 - (simulation_speed * 10));    
}

// function to stop the tornado simulation
function stopTornadoSimulation() {
    if (tornadoInterval !== undefined) {
        clearInterval(tornadoInterval);
        tornadoInterval = undefined; // Reset the ID
    }

    resetMarkers();
}

// function to be able to drag the tornado to any place the user wants
function tornado_drag_function(event) {

    // make sure initial tornado position stays the same after dragging it
    var tornadoLatLng = event.target.getLatLng();
    tornado_lat = tornadoLatLng.lat;
    tornado_lng = tornadoLatLng.lng;
}

// function to update the tornado simulation stats
function updateTornadoSimulationStats(safeCount, injuredCount, deadCount){
    document.getElementById("simulationStep").innerHTML = "Safe: " + safeCount;
    document.getElementById("statistic1").innerHTML = "Injured: " + injuredCount;
    document.getElementById("statistic2").innerHTML = "Dead: " + deadCount;
}
// Define web socket at local port (Must be changed if running on different URL)
var socket = io.connect("http://127.0.0.1:5000");

// Define global variables
var virusSimulationInterval;
var modelType; // values can be "virus" or "tornado"
var simulationState = "idle";  // Possible simulationStates: "idle", "sending"
var mapState = "idle"; // Possible simulationStates: "idle", "populated" 

// on initialization, select virus model as current modelType
document.addEventListener("DOMContentLoaded", function() {
    var virusModelBtn = document.getElementById("virusModelBtn");
    selectModel(virusModelBtn);
});

// Update the HTML elements with the virus model data
socket.on("update_event", function (data) {
    if (modelType == "virus"){
        updateStatisticsWebSocket(data);
        updateVirusSimulationCharts(data);
        updateVirusVisuals(data);
    }     
});

// Code to place agents according to the Virus Model Needs (Where some agents are initialized as infected)
function placeVirusAgents(){
    clearMap();

    const numAgents = parseFloat(document.getElementById("slider2").value);
    const numInfected = parseFloat(document.getElementById("slider3").value);
    const numSusceptible = numAgents - numInfected;

    placeAgents(numSusceptible, "green");
    placeAgents(numInfected, "red");
    mapState = "populated";
}

// Code to place agents according to the Tornado Model Needs (Where all agents are initialized as healthy)
function placeTornadoAgents(){
    clearMap();
    defineTornadoAndCities();

    const numAgents = parseFloat(document.getElementById("slider2").value);

    placeAgents(numAgents, "green");
    mapState = "populated";
}

function startSimulation() {
    // If the simulation is already running, then do nothing
    if (simulationState == "sending") {
        return;
    }

    // Enter Virus WorkFlow (Communication w/ Python Mesa Model via WebSockets)
    if (modelType == "virus") {

        // If there are no agents on the map, place them. then send the agent locations through web socket for Mesa Model Initialization
        if (mapState == "idle"){
            placeVirusAgents();
        }
        mapState = "populated";
        socket.emit('simulation_points', {agent_points: markerData});

        // Disable start button, to make sure users dont spam Start button
        disableStartButton();

        // Get Slider Values and send them to Mesa Simulation to Initialize Mesa Model w/ proper parameters
        let values = []; 
        const sliders = document.querySelectorAll(".simulationSliders");

        sliders.forEach(slider => {
            const sliderValue = parseFloat(slider.value);
            values.push(sliderValue);
        });

        socket.emit("start_simulation", {slider_values: values});

        // Get Simulation High Level parameters like number of steps and simulation speed
        var current_step = 1;
        const maxSteps = parseFloat(document.getElementById("slider1").value);
        const simulationSpeed = parseFloat(document.getElementById("slider8").value);


        // Function to communicate w. Mesa Model
        virusSimulationInterval = setInterval(function () {
            // If the State is idle then the Stop button was pressed and the simulation should end
            if (simulationState == "idle") {
                stopSimulation();
                return;
            }

            // New step, tell the Mesa model to run another step
            socket.emit("simulation_step", {step: current_step});
            current_step++;

            // Stop the simulation when all steps are simulated (values[1] holds the total numSteps for the model to take)
            if (current_step > maxSteps) {
                stopSimulation();
            }

        }, Math.floor(2500 / simulationSpeed));

        simulationState = "sending";
    }

    // Enter Tornado Model Workflow
    if (modelType == "tornado") {
        simulation_started = true;

        // If there are no agents on the map, place them. Don't need to use WebSockets as Tornado Model is handled in JS Frontend
        if (mapState == "idle"){
            placeTornadoAgents();
        }

        // Get Slider Values for Tornado Model, this model uses only a select number of the sliders
        let values = []; 
        const sliderIDs = ["slider2", "slider4", "slider5", "slider6", "slider7", "slider8"];

        sliderIDs.forEach(sliderID => {
            const sliderElement = document.getElementById(sliderID);
            const sliderValue = parseFloat(sliderElement.value);
            values.push(sliderValue);
        });

        // Run the Tornado Model with the appropriate parameters
        runTornadoSimulation(values); 
    }
}

// Function to reset the simulation (Remove webpage info of the current simulation and set slider values to their default)
function resetSimulation() {
    // If Simulation is already in action, Users should press Stop Simulation. Not Reset Simulation
    if (simulationState == "sending"){
        return;
    }

    // Remove all markers and lines from the map
    resetMap();
    resetMarkers();

    // Reset Slider values to Virus Model Defaults if the Virus Model is in use
    if (modelType == "virus"){
        resetVirusSliders();
        placeVirusAgents();

        // reset meta data about the simulation
        document.getElementById("simulationStep").innerHTML = "Steps: ";
        document.getElementById("statistic1").innerHTML = "Infected: ";
        document.getElementById("statistic2").innerHTML = "Susceptible: ";
        document.getElementById("statistic3").innerHTML = "Resistant: ";
        document.getElementById("statistic4").innerHTML = "Dead: ";

        // code to initialize the charts to the Virus Model (Where an agent is initially infected)
        setDefaultVirusGraphs();
    }

    // Reset Slider values to Tornado Model Defaults if the Tornado Model is in use
    if (modelType == "tornado"){
        resetTornadoSliders();
        placeTornadoAgents();

        // reset meta data about the simulation
        document.getElementById("simulationStep").innerHTML = "Steps: ";
        document.getElementById("statistic1").innerHTML = "Safe: ";
        document.getElementById("statistic2").innerHTML = "Injured: ";
        document.getElementById("statistic3").innerHTML = "Dead: ";

        // code to initialize the charts to the Tornado Model (Where all agents are initially healthy)
        setDefaultTornadoGraphs();
    }
}

// Function to stop the simulation
function stopSimulation() {
    // If the simulation is not running return as theres nothing to stop
    if (simulationState == "idle") {
        return;
    }

    // Enable Start Button (Start Simulation Button Disables Start Button)
    enableStartButton();
    simulationState = "idle";

    // Clear Virus Simulation Interval, Stopping communication w/ Mesa Model
    if (modelType == "virus") {
        clearInterval(virusSimulationInterval);
    }

    // Stop Tornado Simulation Function
    else if (modelType == "tornado"){
        stopTornadoSimulation();
    }
}

// Function to update the HTML elements with the simulation information from the Virus Mesa WebSocket
function updateStatisticsWebSocket(result) {
    document.getElementById("simulationStep").innerHTML = "Step: " + result.step;

    if (modelType == "virus") {
        document.getElementById("statistic4").style.display = "flex";

        document.getElementById("statistic1").innerHTML = "Infected: " + result.infected;
        document.getElementById("statistic2").innerHTML = "Susceptible: " + result.susceptible;
        document.getElementById("statistic3").innerHTML = "Resistant: " + result.resistant;
        document.getElementById("statistic4").innerHTML = "Dead: " + result.dead;
    }
}

// Function to Handle Logic for which Simulation is currently in use
function selectModel(button) {
    var buttons = document.querySelectorAll(".simulationButtons");

    // Find which disaster simulation button has been selected by user (virus by default)
    buttons.forEach(function(btn) {btn.classList.remove("selected");});
    button.classList.add("selected");

    if (button.id === "virusModelBtn") {
        selectVirusModel();
        modelType = "virus";
    } 
    else if (button.id === "tornadoModelBtn") {
        selectTornadoModel();
        modelType = "tornado";
    }
}

// Function to adjust all HTML elements and map elements to those in the Virus Workflow
function selectVirusModel() {
    // Update slider names and labels for Virus Model
    updateSliderText("slider2Name", "Number of Agents");
    updateSliderRange("slider2", 1, 100, 10, 1);

    updateSliderText("slider4Name", "Virus Spread Radius");
    updateSliderRange("slider4", 1, 10, 1, 1);

    updateSliderText("slider5Name", "Virus Spread Chance");
    updateSliderRange("slider5", 0.0, 1.0, 0.4, 0.1);

    updateSliderText("slider6Name", "Recovery Chance");
    updateSliderRange("slider6", 0.0, 1.0, 0.3, 0.1);

    updateSliderText("slider7Name", "Death Rate");
    updateSliderRange("slider7", 0.0, 1.0, 0.2, 0.1);

    updateSliderText("slider8Name", "Simulation Speed");
    updateSliderRange("slider8", 1, 3, 3, 1);

    // Ensure Sliders that were hidden in the Tornado Model Workflow are visible
    document.getElementById("slider1Name").style.display = 'flex';
    document.getElementById("slider1Value").style.display = 'flex';
    document.getElementById("slider1").style.display = 'flex';

    document.getElementById("slider3Name").style.display = 'flex';
    document.getElementById("slider3Value").style.display = 'flex';
    document.getElementById("slider3").style.display = 'flex';

    // Ensure simulation statistics show the Virus Model information
    document.getElementById("statistic3").style.display = "flex";
    document.getElementById("statistic4").style.display = "flex";

    document.getElementById("simulationStep").innerText = "Steps:";
    document.getElementById("statistic1").innerText = "Infected:";
    document.getElementById("statistic2").innerText = "Susceptible:";
    document.getElementById("statistic3").innerText = "Resistant:";
    document.getElementById("statistic4").innerText = "Dead:";

    // Make the Dead Label Visible as this element is not used in the Tornado Model
    document.getElementById("deadRectangle").style.display = "flex";
    document.getElementById("deadLabel").style.display = "flex";

    document.getElementById("susceptibleLabel").innerText = "Susceptible";
    document.getElementById("resistantLabel").innerText = "Resistant";
    document.getElementById("infectedLabel").innerText = "Infected";
    document.getElementById("deadLabel").innerHTML = "Dead";

    // Ensure graphs, slider values, and map show virus model defaults
    setDefaultVirusGraphs();
    resetVirusSliders();
    initializeVirusMap();
    mapState = "populated";
}

// Function to adjust all HTML elements and map elements to those in the Tornado Workflow
function selectTornadoModel() {
    // Update slider names and labels for Tornado Model
    updateSliderText("slider2Name", "Number of Agents");
    updateSliderRange("slider2", 1, 100, 10, 1);

    updateSliderText("slider4Name", "Tornado Move Chance");
    updateSliderRange("slider4", 0.0, 1, 0.8, 0.1);

    updateSliderText("slider5Name", "Tornado Radius");
    updateSliderRange("slider5", 0.0, 1, 0.5, 1);

    updateSliderText("slider6Name", "Tornado Intensity");
    updateSliderRange("slider6", 0.0, 1, 0.3, 0.1);

    updateSliderText("slider7Name", "Death Rate");
    updateSliderRange("slider7", 0.0, 1, 0.3, 0.1);

    updateSliderText("slider8Name", "Simulation Speed");
    updateSliderRange("slider8", 1, 3, 3, 1);

    // Ensure Sliders that are shown in the Virus Model Workflow are hidden
    document.getElementById("slider1Name").style.display = 'none';
    document.getElementById("slider1Value").style.display = 'none';
    document.getElementById("slider1").style.display = 'none';
    
    document.getElementById("slider3Name").style.display = 'none';
    document.getElementById("slider3Value").style.display = 'none';
    document.getElementById("slider3").style.display = 'none';

    // Ensure simulation statistics show the Tornado Model information, need to hide one box as Tornado agents have 1 less state than Virus agents do
    document.getElementById("statistic3").style.display = "none";
    document.getElementById("statistic4").style.display = "none";

    document.getElementById("simulationStep").innerText = "Safe:";
    document.getElementById("statistic1").innerText = "Injured:";
    document.getElementById("statistic2").innerText = "Dead:";

    // Make the Dead Label Hidden as this element is not used in the Tornado Model
    document.getElementById("deadRectangle").style.display = "none";
    document.getElementById("deadLabel").style.display = "none";

    document.getElementById("susceptibleLabel").innerText = "Safe";
    document.getElementById("resistantLabel").innerText = "Injured";
    document.getElementById("infectedLabel").innerText = "Dead";

    // Ensure graphs, slider values, and map show tornado model defaults
    setDefaultTornadoGraphs();
    resetTornadoSliders();
    initializeTornadoMap();
    mapState = "populated";
}
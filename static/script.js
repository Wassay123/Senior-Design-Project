//Define web socket at local port (Must be changed if running on different URL)
var socket = io.connect('http://127.0.0.1:5000');
var simulationInterval; //global variable for simulationInterval
var simulationState = "idle";  //Possible simulationStates: "idle", "sending"

// Update the HTML elements with the simulation model data
socket.on('update_event', function (data) {
    updateSimulationInfo(data);
    updateSimulationCharts(data);
});

// Function to start the simulation
function startSimulation() {
    // If the simulation is already running, then do nothing
    if (simulationState == "sending") {
        return;
    }

    var current_step = 1;
    var startSimulationButton = document.getElementById("startSimulationButton");
    startSimulationButton.disabled = true;

    const sliderNames = ["numSteps", "numAgents", "avgNodeDegree", "initialOutbreak", "virusSpreadRadius", "virusSpreadChance", "virusCheckFrequency", "recoveryChance", "gainResistanceChance", "deathRate"];
    let values = [];

    for (const name of sliderNames) {
        const sliderValue = parseFloat(document.getElementById(`${name}Slider`).value);
        values.push(sliderValue);
    }

    const simulationSpeed = parseFloat(document.getElementById(`simulationSpeedSlider`).value);
    socket.emit('start_simulation', {values: values});

    // Define an interval function which will be repeated every Math.floor(1000 / simulationSpeed)) milliseconds
    simulationInterval = setInterval(function () {
        // If the State is idle then the Stop button was pressed and the simulation should end
        if (simulationState == "idle") {
            stopSimulation();
            return;
        }

        socket.emit('simulation_update_request', {step: current_step});
        current_step++;

        // Stop the simulation when all steps are simulated (values[0] holds the total numSteps for the model to take)
        if (current_step > values[0]) {
            stopSimulation();
        }

    }, Math.floor(1000 / simulationSpeed));

    simulationState = "sending";
}


// Function to reset the simulation (Remove webpage info of the current simulation and set slider values to their default)
function resetSimulation() {
    if (simulationState == "sending"){
        return;
    }

    const sliderNames = ["numSteps", "numAgents", "avgNodeDegree", "initialOutbreak", "virusSpreadRadius", "virusSpreadChance", "virusCheckFrequency", "recoveryChance", "gainResistanceChance", "simulationSpeed", "deathRate"];
    const defaultValues = [10, 10, 3, 1, 1, 0.4, 0.4, 0.3, 0.5, 3, 0.2];

    for (let i = 0; i < sliderNames.length; i++) {
        const sliderName = sliderNames[i];
        const slider = document.getElementById(`${sliderName}Slider`);
        slider.value = defaultValues[i];
        updateValue(sliderName, defaultValues[i]);
    }

    document.getElementById("simulationStep").innerHTML = "Step: ";
    document.getElementById("infectedCount").innerHTML = "Infected: ";
    document.getElementById("susceptibleCount").innerHTML = "Susceptible: ";
    document.getElementById("resistantCount").innerHTML = "Resistant: ";
    document.getElementById("deathCount").innerHTML = "Dead: ";
}


// Function to stop the simulation
function stopSimulation() {
    // If the simulation is not running return
    if (simulationState == "idle") {
        return;
    }

    // Else Reset the Interval function and set the simulation to idle
    var startSimulationButton = document.getElementById("startSimulationButton");
    startSimulationButton.disabled = false;

    clearInterval(simulationInterval);
    simulationState = "idle";
}

function updateValue(sliderName, sliderValue) {
    document.getElementById(sliderName).innerText = sliderValue;
}

function makeParameterTitleBold(message) {
    parameterName = message.parentElement.previousElementSibling;
    sliderValue = message.nextElementSibling;
    sliderValue.style.opacity = '1'
    parameterName.style.opacity = '1';
    parameterName.style.textShadow = sliderValue.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.4)';
    sliderValue.style.transition = parameterName.style.transition = '0.2s';
}

function revertParameterTitle(message) {
    parameterName = message.parentElement.previousElementSibling;
    sliderValue = message.nextElementSibling;
    parameterName.style.opacity = '';
    sliderValue.style.opacity = '';
    parameterName.style.textShadow = '';
}

// Function to update the HTML elements with the simulation information
function updateSimulationInfo(result) {
    document.getElementById("simulationStep").innerHTML = "Step: " + result.step;
    document.getElementById("infectedCount").innerHTML = "Infected: " + result.infected;
    document.getElementById("susceptibleCount").innerHTML = "Susceptible: " + result.susceptible;
    document.getElementById("resistantCount").innerHTML = "Resistant: " + result.resistant;
    document.getElementById("deathCount").innerHTML = "Dead: " + result.dead;
}

function updateSimulationCharts(result){
    infectedCount = result.infected
    susceptibleCount = result.susceptible
    resistantCount = result.resistant

    pieChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    pieChart.update();

    polarAreaChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    polarAreaChart.update();

    lineChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    lineChart.update();

    barChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    barChart.update();
}

function updateChartsBySliders(sliderValue){
    const totalAgents = document.getElementById(`numAgentsSlider`).value;

    infectedCount = sliderValue
    susceptibleCount = totalAgents - sliderValue
    resistantCount = 0

    pieChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    pieChart.update();

    polarAreaChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    polarAreaChart.update();

    lineChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    lineChart.update();

    barChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount];
    barChart.update();
}

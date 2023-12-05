//Define web socket at local port (Must be changed if running on different URL)
var socket = io.connect('http://127.0.0.1:5000');

// Update the HTML elements with the simulation model data
socket.on('update_event', function (data) {
    updateSimulationInfo(data);
});

// Function to start the simulation
function startSimulation() {
    var current_step = 0;

    // Get the slider values
    const sliderNames = ["numSteps", "numAgents", "avgNodeDegree", "initialOutbreak", "virusSpreadRadius", "virusSpreadChance", "virusCheckFrequency", "recoveryChance", "gainResistanceChance"];
    let values = [];

    for (const name of sliderNames) {
        const sliderValue = parseFloat(document.getElementById(`${name}Slider`).value);
        values.push(sliderValue);
    }

    const simulationSpeed = parseFloat(document.getElementById(`simulationSpeedSlider`).value);

    // Send the slider values to the server
    socket.emit('start_simulation', { values: values });

    // Set up an interval to request updates every second
    var simulationInterval = setInterval(function () {
        socket.emit('simulation_update_request', { step: current_step });
        current_step++;

        if (current_step >= values[0]) {
            clearInterval(simulationInterval);  // Stop the interval when all steps are simulated
        }
    }, Math.floor(1000 / simulationSpeed));

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
}

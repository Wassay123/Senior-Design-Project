//Define web socket at local port (Must be changed if running on different URL)
const socket = io.connect('http://127.0.0.1:5000');

// Update the HTML elements with the simulation model data
socket.on('simulation_update', function (data) {
    updateSimulationInfo(data);
});

socket.on('simulation_finished', function(){
    document.getElementById("startButton").disabled = false
});

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

//Get the Simulation Parameters from each slider and send them to app.py
function sendSimulationParameters() {
    document.getElementById("startButton").disabled = true;
    const sliderNames = ["numSteps", "numAgents", "avgNodeDegree", "initialOutbreak", "virusSpreadRadius", "virusSpreadChance", "virusCheckFrequency", "recoveryChance", "gainResistanceChance"];
    let values = [];

    //Get the slider values in an array
    for (const name of sliderNames) {
        const sliderValue = parseFloat(document.getElementById(`${name}Slider`).value);
        values.push(sliderValue);
    }

    //Send out an HTTPS POST request titled updateValue (triggers the @app.route(/updateValue) code in app.py)
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/updateValue", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({values: values}));
}

// Update the HTML elements with the simulation information
function updateSimulationInfo(result) {
    document.getElementById("simulationStep").innerHTML = "Step: " + result.step;
    document.getElementById("infectedCount").innerHTML = "Infected: " + result.infected;
    document.getElementById("susceptibleCount").innerHTML = "Susceptible: " + result.susceptible;
    document.getElementById("resistantCount").innerHTML = "Resistant: " + result.resistant;
}


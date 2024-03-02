// Define web socket at local port (Must be changed if running on different URL)
var socket = io.connect('http://127.0.0.1:5000');

// Define global variables
var simulationState = "idle";  // Possible simulationStates: "idle", "sending"
var simulationInterval;
var modelType; // values can be "virus" or "tornado"

// on initialization, select virus model as current modelType
document.addEventListener("DOMContentLoaded", function() {
    var virusModelBtn = document.getElementById("virusModelBtn");
    selectModel(virusModelBtn);
});

// Update the HTML elements with the simulation model data
socket.on('update_event', function (data) {
    if (modelType == "virus"){
        updateSimulationInfo(data);
        updateSimulationCharts(data);
        updateVisualization();

    } else if (modelType == "tornado"){
        updateSimulationInfo(data);
        //add more here for visualization
    } 
});

function startSimulation() {
    // If the simulation is already running, then do nothing
    if (simulationState == "sending") {
        return;
    }

    var current_step = 1;

    var startSimulationButton = document.getElementById("startSimulationButton");
    startSimulationButton.disabled = true;
    startSimulationButton.style.color = "grey";

    const sliders = document.querySelectorAll('.allTheSliders');
    
    // append model type to values list
    let values = []; 

    // Loop through all sliders and get their values
    sliders.forEach(slider => {
        const sliderValue = parseFloat(slider.value);
        values.push(sliderValue);
    });

    const simulationSpeed = parseFloat(sliders[sliders.length - 1].value);
    const densityRange = document.getElementById("densityRangeDropdown").value;  // Get selected density range

    socket.emit('start_simulation', {model_type: modelType, values: values, density_range: densityRange});

    // Define an interval function which will be repeated every Math.floor(1000 / simulationSpeed)) milliseconds
    simulationInterval = setInterval(function () {
        // If the State is idle then the Stop button was pressed and the simulation should end
        if (simulationState == "idle") {
            stopSimulation();
            return;
        }

        socket.emit('simulation_update_request', {step: current_step});
        current_step++;

        // Stop the simulation when all steps are simulated (values[1] holds the total numSteps for the model to take)
        if (current_step > values[1]) {
            stopSimulation();
        }

    }, Math.floor(5000 / simulationSpeed));

    simulationState = "sending";
}



// Function to reset the simulation (Remove webpage info of the current simulation and set slider values to their default)
function resetSimulation() {
    if (simulationState == "sending"){
        return;
    }

    // Reset NYC map to be blank
    var imgElement = document.getElementById("simulationMap");
    imgElement.src = 'static/images/nyc_basemap_empty.png?' + new Date().getTime();

    let defaultValues;

    if (modelType == "virus") {
        // default slider values
        const defaultValues = [10, 10, 1, 1, 0.4, 0.3, 0.2, 3];

        // reset meta data about the simulation
        document.getElementById("simulationStep").innerHTML = "Step: ";
        document.getElementById("statistic1").innerHTML = "Infected: ";
        document.getElementById("statistic2").innerHTML = "Susceptible: ";
        document.getElementById("statistic3").innerHTML = "Resistant: ";
        document.getElementById("statistic4").innerHTML = "Dead: ";

        // code to initialize the charts
        const numInfected = document.getElementById(`slider3`).value;

        statistic1 = numInfected
        statistic2 = 10 - statistic1
        statistic3 = 0
        deadCount = 0
    
        pieChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        pieChart.update();
    
        polarAreaChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        polarAreaChart.update();
    
        lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        lineChart.update();
    
        barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        barChart.update();
    }

    if (modelType == "tornado") {
        // default slider values
        const defaultValues = [10, 10, 1, 0.5, 1, 0.5, 0.1, 3];

        // reset meta data about the simulation
        document.getElementById("simulationStep").innerHTML = "Step: ";
        document.getElementById("statistic1").innerHTML = "Safe: ";
        document.getElementById("statistic2").innerHTML = "Injured: ";
        document.getElementById("statistic3").innerHTML = "Dead: ";

        // Add chart functionality here
    }

    const sliders = document.querySelectorAll('.allTheSliders');

    sliders.forEach((slider, i) => {
        slider.value = defaultValues[i];
    });
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
    startSimulationButton.style.color = "white";

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
    
    if (modelType == "tornado") {
        document.getElementById("statistic1").innerHTML = "Safe: " + result.safe;
        document.getElementById("statistic2").innerHTML = "Injured: " + result.injured;
        document.getElementById("statistic3").innerHTML = "Dead: " + result.dead;
        document.getElementById("statistic4").style.display = "none";

    } else if (modelType == "virus") {
        document.getElementById("statistic1").innerHTML = "Infected: " + result.infected;
        document.getElementById("statistic2").innerHTML = "Susceptible: " + result.susceptible;
        document.getElementById("statistic3").innerHTML = "Resistant: " + result.resistant;
        document.getElementById("statistic4").style.display = "flex";
        document.getElementById("statistic4").innerHTML = "Dead: " + result.dead;
    }
}


// Function to update the visualization
function updateVisualization() {
    var imgElement = document.getElementById("simulationMap");

    // Update the image source directly
    imgElement.src = 'static/images/nyc_basemap.png?' + new Date().getTime();
}

function updateSimulationCharts(result){
    statistic1 = result.infected
    statistic2 = result.susceptible
    statistic3 = result.resistant
    deadCount = result.dead

    pieChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    pieChart.update();

    polarAreaChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    polarAreaChart.update();

    lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    barChart.update();
}

function updateChartsBySliders(sliderValue){
    const totalAgents = document.getElementById(`numAgentsSlider`).value;

    statistic1 = sliderValue
    statistic2 = totalAgents - sliderValue
    statistic3 = 0
    deadCount = 0

    pieChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    pieChart.update();

    polarAreaChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    polarAreaChart.update();

    lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    barChart.update();
}

function selectModel(button) {
    var buttons = document.querySelectorAll('.simulationButtons');

    buttons.forEach(function(btn) {
        btn.classList.remove('selected');
    });

    button.classList.add('selected');

    if (button.id === "virusModelBtn") {
        selectVirusModel();
        modelType = "virus";
    } 
    
    if (button.id === "tornadoModelBtn") {
        selectTornadoModel();
        modelType = "tornado";
    }
}

function updateSliderText(sliderName, Title) {
    document.getElementById(sliderName).innerText = Title;
}

function updateSliderRange(sliderID, minValue, maxValue, defaultValue, step) {
    document.getElementById(sliderID).min = minValue;
    document.getElementById(sliderID).max = maxValue;
    document.getElementById(sliderID).value = defaultValue;
    document.getElementById(sliderID).step = step;

    var sliderValueText = document.getElementById(sliderID + "Value");
    sliderValueText.textContent = defaultValue.toString();
}


function selectTornadoModel() {
    // Update slider names and labels for Tornado Model
    updateSliderText("slider1Name", "Number of Steps");
    updateSliderRange("slider1", 1, 100, 10, 1);

    updateSliderText("slider2Name", "Number of Agents");
    updateSliderRange("slider2", 1, 100, 10, 1);

    updateSliderText("slider3Name", "Initial Safe Size");
    updateSliderRange("slider3", 1, 10, 1, 1);

    updateSliderText("slider4Name", "Tornado Move Chance");
    updateSliderRange("slider4", 0, 1, 0.5, 0.1);

    updateSliderText("slider5Name", "Tornado Radius");
    updateSliderRange("slider5", 1, 5, 1, 1);

    updateSliderText("slider6Name", "Tornado Intensity");
    updateSliderRange("slider6", 0, 1, 0.5, 0.1);

    updateSliderText("slider7Name", "Death Rate");
    updateSliderRange("slider7", 0, 1, 0.1, 1);

    updateSliderText("slider8Name", "Simulation Speed");
    updateSliderRange("slider8", 1, 3, 3, 1);


    document.getElementById("statistic1").innerText = "Safe";
    document.getElementById("statistic2").innerText = "Injured";
    document.getElementById("statistic3").innerText = "Dead";
    document.getElementById("statistic4").style.display = "none";
}

function selectVirusModel() {
    // Update slider names and labels for Virus Model
    updateSliderText("slider1Name", "Number of Steps");
    updateSliderRange("slider1", 1, 100, 10, 1);

    updateSliderText("slider2Name", "Number of Agents");
    updateSliderRange("slider2", 1, 100, 10, 1);

    updateSliderText("slider3Name", "Initial Outbreak");
    updateSliderRange("slider3", 1, 10, 1, 1);

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


    document.getElementById("statistic1").innerText = "Infected";
    document.getElementById("statistic2").innerText = "Susceptible";
    document.getElementById("statistic3").innerText = "Resistant";
    document.getElementById("statistic4").style.display = "flex";
    document.getElementById("statistic4").innerText = "Dead";
}

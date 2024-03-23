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
    switchDensityImage();
});

// Update the HTML elements with the simulation model data
socket.on('update_event', function (data) {
    if (modelType == "virus"){
        updateSimulationInfo(data);
        updateVirusSimulationCharts(data);
        updateVisualization();

    } else if (modelType == "tornado"){

        updateSimulationInfo(data);
        updateTornadoSimulationCharts(data);
        //add more here for visualization through other function
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
        document.getElementById("simulationStep").innerHTML = "Days: ";
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
    
        lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        lineChart.update();
    
        barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
        barChart.update();
    }

    if (modelType == "tornado") {
        // default slider values
        const defaultValues = [10, 10, 1, 0.5, 1, 0.5, 0.1, 3];

        // reset meta data about the simulation
        document.getElementById("simulationStep").innerHTML = "Days: ";
        document.getElementById("statistic1").innerHTML = "Safe: ";
        document.getElementById("statistic2").innerHTML = "Injured: ";
        document.getElementById("statistic3").innerHTML = "Dead: ";
        document.getElementById("statistic4").innerHTML = "Days until first casuality: ";

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
    document.getElementById("simulationStep").innerHTML = "Days: " + result.step;
    
    if (modelType == "tornado") {
        document.getElementById("statistic1").innerHTML = "Safe: " + result.safe;
        document.getElementById("statistic2").innerHTML = "Injured: " + result.injured;
        document.getElementById("statistic3").innerHTML = "Dead: " + result.dead;
        document.getElementById("statistic4").innerHTML = "Days until first casuality:" + result.days_til_cas;

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

function updateVirusSimulationCharts(result){
    infectedCount = result.infected
    susceptibleCount = result.susceptible
    resistantCount = result.resistant
    deadCount = result.dead

    pieChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    barChart.update();
}

function updateTornadoSimulationCharts(result){
    injuredCount = result.injured
    safeCount = result.safe
    deadCount = result.dead

    pieChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
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
    updateSliderRange("slider3", 1, 10, 3, 1);

    updateSliderText("slider4Name", "Tornado Move Chance");
    updateSliderRange("slider4", 0.0, 1, 0.3, 0.1);

    updateSliderText("slider5Name", "Tornado Radius");
    updateSliderRange("slider5", 1, 5, 1, 1);

    updateSliderText("slider6Name", "Tornado Intensity");
    updateSliderRange("slider6", 0.0, 1, 0.3, 0.1);

    updateSliderText("slider7Name", "Death Rate");
    updateSliderRange("slider7", 0.0, 1, 0.3, 0.1);

    updateSliderText("slider8Name", "Simulation Speed");
    updateSliderRange("slider8", 1, 3, 3, 1);


    document.getElementById("statistic1").innerText = "Safe";
    document.getElementById("statistic2").innerText = "Injured";
    document.getElementById("statistic3").innerText = "Dead";
    document.getElementById("statistic4").innerText = "Days until first casuality:";

    document.getElementById("susceptibleLabel").innerText = "Safe";
    document.getElementById("resistantLabel").innerText = "Injured";
    document.getElementById("deadLabel").innerText = "Dead";
    document.getElementById("infectedRectangle").style.display = "none";
    document.getElementById("infectedLabel").style.display = "none";

    document.getElementById('visualsContainer').style.display = "flex";
    animateBall();
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

    document.getElementById("susceptibleLabel").innerText = "Susceptible";
    document.getElementById("resistantLabel").innerText = "Resistant";
    document.getElementById("infectedRectangle").style.display = "flex";
    document.getElementById("infectedLabel").style.display = "flex";
    document.getElementById("infectedLabel").innerText = "Infected";
    document.getElementById("deadLabel").innerText = "Dead";

    document.getElementById('visualsContainer').style.display = "none";
}
//Funtion to change image based on density dropdown choice
function switchDensityImage(){
    var dropdown = document.getElementById("densityRangeDropdown");
    var selectedValue = dropdown.value;
    var imgElement = document.getElementById("simulationMap");
    var imagePath = '';

    switch (selectedValue) {
        case "0,10000":
            imagePath = "../static/images/nyc_basemap_density_0_10000.png";
            break;
        case "10001,25000":
            imagePath = "../static/images/nyc_basemap_density_10001_25000.png";
            break;
        case "25001,50000":
            imagePath = "../static/images/nyc_basemap_density_25001_50000.png";
            break;
        case "50001,inf":
            imagePath = "../static/images/nyc_basemap_density_50001_inf.png";
            break;

    }
    imgElement.src = imagePath;
}



var animationInterval;
var pathPoints = []; // Array to store path points

    function animateBall() {
        // Get the ball element
        var ball = document.getElementById("ball");
        var pathLine = document.getElementById("pathLine");

        // Reset ball to initial position
        ball.style.left = "0px";
        ball.style.top = (window.innerHeight / 2) + "px";
        pathPoints = []; // Clear path points

        // Reset path line
        pathLine.setAttribute("d", "");

        // Animate the ball
        var currentPositionX = 0;
        var currentPositionY = parseFloat(ball.style.top);
        var directionY = 1; // 1 for moving downwards, -1 for moving upwards
        animationInterval = setInterval(function() {
            if (currentPositionX < 720) {
                currentPositionX += 3; // Adjust speed by changing increment value
                currentPositionY += directionY * (Math.floor(Math.random() * 21) - 10); // Random change in Y position between -10 and 10
                ball.style.left = currentPositionX + "px";
                ball.style.top = currentPositionY + "px";
                pathPoints.push({ x: currentPositionX, y: currentPositionY }); // Store current position in pathPoints array
                updatePath(pathLine, pathPoints); // Update path line
            } else {
                clearInterval(animationInterval);
            }

            // Check if ball reaches top or bottom of the screen
            if (currentPositionY <= 0) {
                directionY = 1; // Change direction to move downwards
            } else if (currentPositionY >= window.innerHeight - ball.offsetHeight) {
                directionY = -1; // Change direction to move upwards
            }
        }, 35); // Adjust speed by changing interval value (higher value means slower animation)
    }

    function updatePath(pathElement, points) {
        // Generate SVG path string from points
        var pathString = "M " + points[0].x + " " + points[0].y;
        for (var i = 1; i < points.length; i++) {
            pathString += " L " + points[i].x + " " + points[i].y;
        }
        pathElement.setAttribute("d", pathString);
        
    }
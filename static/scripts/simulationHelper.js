// Initialize default chart settings and data for the Virus simulation model
function setDefaultVirusGraphs() {
    const numInfected = document.getElementById(`slider3`).value;

    // Set initial statistics based on slider values
    statistic1 = numInfected;
    statistic2 = 10 - statistic1;
    statistic3 = 0;
    deadCount = 0;

    // Update pie, line, and bar charts with initial data
    pieChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    barChart.update();
}

// Initialize default chart settings and data for the Tornado simulation model
function setDefaultTornadoGraphs() {
    const numAgents = document.getElementById(`slider2`).value;

    // Set initial statistics based on slider values
    statistic1 = 0;
    statistic2 = numAgents;
    statistic3 = 0;
    deadCount = 0;

    // Update pie, line, and bar charts with initial data
    pieChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [statistic1, statistic2, statistic3, deadCount];
    barChart.update();
}

// Update charts with new simulation data from the Virus model
function updateVirusSimulationCharts(result){
    infectedCount = result.infected;
    susceptibleCount = result.susceptible;
    resistantCount = result.resistant;
    deadCount = result.dead;

    // Update pie, line, and bar charts with simulation results
    pieChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [infectedCount, susceptibleCount, resistantCount, deadCount];
    barChart.update();
}

// Update charts with new simulation data from the Tornado model
function updateTornadoSimulationCharts(safeCount, injuredCount, deadCount){
    // Update pie, line, and bar charts with simulation results
    pieChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
    pieChart.update();

    lineChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
    lineChart.update();

    barChart.data.datasets[0].data = [injuredCount, safeCount, deadCount];
    barChart.update();
}

// Update displayed value of a slider and mark the map state as idle
function updateValue(sliderName, sliderValue) {
    document.getElementById(sliderName).innerText = sliderValue;
    mapState = "idle";
}

// Highlight the title of a parameter when its value is changed
function makeParameterTitleBold(message) {
    parameterName = message.parentElement.previousElementSibling;
    sliderValue = message.nextElementSibling;
    // Set visual emphasis on the text
    sliderValue.style.opacity = '1'
    parameterName.style.opacity = '1';
    parameterName.style.textShadow = sliderValue.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.4)';
    sliderValue.style.transition = parameterName.style.transition = '0.2s';
}

// Revert the parameter title to its default styling after the value change
function revertParameterTitle(message) {
    parameterName = message.parentElement.previousElementSibling;
    sliderValue = message.nextElementSibling;
    // Remove visual emphasis
    parameterName.style.opacity = '';
    sliderValue.style.opacity = '';
    parameterName.style.textShadow = '';
}

// Reset sliders to default values for the Tornado simulation model
function resetTornadoSliders(){
    // Set default values for each slider
    const defaultValues = [10, 10, 1, 0.8, 0.5, 0.3, 0.3, 3];

    // Apply default values to each slider and update their displayed values
    const sliders = document.querySelectorAll(".allTheSliders");
    sliders.forEach((slider, i) => {
        slider.value = defaultValues[i];
        const valueDisplayId = `slider${i + 1}Value`;
        const valueDisplay = document.getElementById(valueDisplayId);
        if (valueDisplay) {
            valueDisplay.innerHTML = defaultValues[i].toString();
        }
    });
}

// Reset sliders to default values for the Virus simulation model
function resetVirusSliders(){
    // Set default values for each slider
    const defaultValues = [10, 10, 1, 1, 0.4, 0.3, 0.2, 3];

    // Apply default values to each slider and update their displayed values
    const sliders = document.querySelectorAll(".allTheSliders");
    sliders.forEach((slider, i) => {
        slider.value = defaultValues[i];
        const valueDisplayId = `slider${i + 1}Value`;
        const valueDisplay = document.getElementById(valueDisplayId);
        if (valueDisplay) {
            valueDisplay.innerHTML = defaultValues[i].toString();
        }
    });
}

// Update the text label of a slider to reflect its purpose in the simulation
function updateSliderText(sliderName, Title) {
    document.getElementById(sliderName).innerText = Title;
}

// Configure the range and default setting of a slider
function updateSliderRange(sliderID, minValue, maxValue, defaultValue, step) {
    // Set slider configuration to provided settings
    document.getElementById(sliderID).min = minValue;
    document.getElementById(sliderID).max = maxValue;
    document.getElementById(sliderID).value = defaultValue;
    document.getElementById(sliderID).step = step;

    // Display the default value next to the slider
    var sliderValueText = document.getElementById(sliderID + "Value");
    sliderValueText.textContent = defaultValue.toString();
}

// Disable the start simulation button to prevent retriggering during active simulation
function disableStartButton() {
    var startSimulationButton = document.getElementById("startSimulationButton");
    startSimulationButton.disabled = true;
    startSimulationButton.style.color = "grey";
}

// Enable the start simulation button once simulation has stopped or reset
function enableStartButton() {
    var startSimulationButton = document.getElementById("startSimulationButton");
    startSimulationButton.disabled = false;
    startSimulationButton.style.color = "white";
}

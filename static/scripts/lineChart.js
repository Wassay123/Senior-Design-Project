// Register the ChartDeferred plugin for deferred loading, enhancing performance on initial page load
Chart.register(ChartDeferred);

// Customize the tooltip positioning to dynamically follow the cursor during mouse events
Chart.Tooltip.positioners.customPosition = function (elements, eventPosition) {
    return {
        x: eventPosition.x,
        y: eventPosition.y,
    };
};

// Retrieve the drawing context of the canvas element intended for the line chart
var ctx = document.getElementById("lineChart").getContext("2d");

// Instantiate a new Chart object to create a line chart
var lineChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: ["Infected", "Susceptible", "Resistant", "Dead"],
        datasets: [{
            data: [infectedCount, susceptibleCount, resistantCount, deadCount],
            backgroundColor: [
                "rgba(255, 0, 0, 0.2)",
                "rgba(144, 238, 144, 0.2)",
                "rgba(128, 128, 128, 0.2)",
                "rgba(0, 0, 0, 0.2)"
            ],
            borderWidth: 2,
            borderColor: [
                "rgba(255, 0, 0, 1)",
                "rgba(144, 238, 144, 1)",
                "rgba(128, 128, 128, 1)",
                "rgba(0, 0, 0, 1)"
            ]
        }],
    },
    options: {
        cutout: "50%",
        aspectRatio: 1,
        animation: {
            duration: 0,  // Disable animations for instant chart updates
            animateRotate: false,
            animateScale: false
        },
        scales: {
            x: {
                display: false  // Hide the x-axis to simplify the chart's appearance
            },
            y: {
                display: true  // Display the y-axis for quantitative assessment
            }
        },
        plugins: {
            deferred: {
                delay: 100  // Delay rendering to allow other page elements to load first
            },
            legend: {
                display: false  // Disable the legend as the dataset labels are self-explanatory
            },
            tooltip: {
                bodyFont: {
                    size: 24,  // Increase tooltip text size for better readability
                    weight: 700,  // Bold the tooltip text for emphasis
                },
            },
        },
    },
});

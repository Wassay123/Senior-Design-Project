// Register the ChartDeferred plugin to enable deferred loading of the chart
Chart.register(ChartDeferred);

// Customize the tooltip positioning to follow the cursor position during mouse events
Chart.Tooltip.positioners.customPosition = function (elements, eventPosition) {
    return {
        x: eventPosition.x,
        y: eventPosition.y,
    };
};

// Get the context of the canvas element where the bar chart will be drawn
var ctx = document.getElementById("barChart").getContext("2d");

// Create a new Chart instance and configure it as a bar chart
var barChart = new Chart(ctx, {
    type: "bar",
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
            barPercentage: 0.9,
            categoryPercentage: 0.9,
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
            duration: 0,  // Disable animation to render the chart instantly
            animateRotate: false,
            animateScale: false
        },
        scales: {
            x: {
                display: false  // Hide the x-axis for a cleaner look
            },
            y: {
                display: true  // Show the y-axis
            }
        },
        plugins: {
            deferred: {
                delay: 100  // Delay chart rendering for better performance on load
            },
            legend: {
                display: false  // Hide the legend as it is not necessary here
            },
            tooltip: {
                bodyFont: {
                    size: 24,  // Larger font size for tooltip text
                    weight: 700  // Bold font weight for tooltip text
                },
            },
        },
    },
});

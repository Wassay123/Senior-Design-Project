// Define and register the plugin to show data values on slices
Chart.register({
    id: 'dataLabels',
    afterDraw: function(chart, args, options) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
                const {x, y} = datapoint.tooltipPosition();
                const dataValue = dataset.data[index];

                // Only display if data value is not zero
                if (dataValue !== 0) {
                    ctx.fillStyle = options.color || 'black'; // Text color
                    ctx.font = options.font || '16px Arial'; // Text font
                    ctx.textAlign = 'center';
                    ctx.fillText(dataValue, x, y);
                }
            });
        });
    }
});

// Your existing chart setup
Chart.register(ChartDeferred);

Chart.Tooltip.positioners.customPosition = function (elements, eventPosition) {
    return {
        x: eventPosition.x,
        y: eventPosition.y,
    };
};

// Set initial data counts for each category in the bar chart
var infectedCount = 1;
var susceptibleCount = 9;
var resistantCount = 0;
var deadCount = 0;

var ctx = document.getElementById("pieChart").getContext("2d");
var pieChart = new Chart(ctx, {
    type: "pie",
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
            borderColor: [
                "rgba(255, 0, 0, 1)",
                "rgba(144, 238, 144, 1)",
                "rgba(128, 128, 128, 1)",
                "rgba(0, 0, 0, 1)"
            ],
            borderWidth: 2
        }],
    },
    options: {
        cutout: "0%",
        aspectRatio: 1,
        animation: {
            duration: 0,
            animateRotate: false,
            animateScale: false
        },
        plugins: {            
            deferred: {
                delay: 100,
            },
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
            dataLabels: {
                color: 'white',
                font: '14px Arial'
            }
        },
        hover: {
            mode: 'none'
        }
    },
});
Chart.register(ChartDeferred);
        Chart.Tooltip.positioners.customPosition = function (elements, eventPosition) {
            return {
            x: eventPosition.x,
            y: eventPosition.y,
            };
        };

        var infectedCount = 1
        var susceptibleCount = 9
        var resistantCount = 0
        var deadCount = 0

        var ctx = document.getElementById("lineChart").getContext("2d");
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
                    barPercentage: 0.9,
                    categoryPercentage: 0.9,
                    borderWidth: 0,
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
                cutout: "50%",
                aspectRatio: 1,
                animation: {
                    duration: 0,
                    animateRotate: false,
                    animateScale: false
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
            plugins: {            
                deferred: {
                delay: 100,
                },
                legend: {
                display: false,
                },
                tooltip: {
                bodyFont: {
                    size: 24,
                    weight: 700,
                },
                },
            },
            },
        });
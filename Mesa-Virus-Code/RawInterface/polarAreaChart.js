Chart.register(ChartDeferred);
        Chart.Tooltip.positioners.customPosition = function (elements, eventPosition) {
            return {
            x: eventPosition.x,
            y: eventPosition.y,
            };
        };
        var ctx = document.getElementById("polarAreaChart").getContext("2d");
        new Chart(ctx, {
            type: "polarArea",
            data: {
                labels: ["Susceptible", "Resistant", "Infected"],
                datasets: [{
                    data: [28.59, 13.54, 9.57],
                    backgroundColor: [
                        "rgba(144, 238, 144, 0.2)", 
                        "rgba(128, 128, 128, 0.2)", 
                        "rgba(255, 0, 0, 0.2)"
                    ],
                    barPercentage: 0.9,
                    categoryPercentage: 0.9,
                    borderWidth: 0,
                    borderColor: [
                        "rgba(144, 238, 144, 1)", 
                        "rgba(128, 128, 128, 1)", 
                        "rgba(255, 0, 0, 1)"
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
                    r: {
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

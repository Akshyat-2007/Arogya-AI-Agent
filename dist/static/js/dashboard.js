// Dashboard Controller - Chart.js & Weight Logging
document.addEventListener('DOMContentLoaded', () => {
    const weightForm = document.getElementById('weightLogForm');
    const logWeightInput = document.getElementById('logWeightInput');
    const memberSelect = document.getElementById('dashboardMemberSelect');
    
    let currentMemberId = memberSelect ? memberSelect.value : null;
    let weightChart = null;

    // Load Charts on page load
    if (currentMemberId) {
        initWeightChart(currentMemberId);
    }

    // Swapping Family Member
    if (memberSelect) {
        memberSelect.addEventListener('change', (e) => {
            currentMemberId = e.target.value;
            // Update URL query parameters quietly without page reload
            const url = new URL(window.location);
            url.searchParams.set('member_id', currentMemberId);
            window.history.pushState({}, '', url);
            
            // Reload page or dynamically update dashboard elements
            // To ensure database relations and template attributes load perfectly, we reload the page
            window.location.reload();
        });
    }

    // Weight Logging form submit
    if (weightForm) {
        weightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const weightVal = parseFloat(logWeightInput.value);
            if (!weightVal || isNaN(weightVal) || !currentMemberId) return;

            // Submit log
            try {
                const response = await fetch(`/api/members/${currentMemberId}/weight`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ weight_kg: weightVal })
                });

                const data = await response.json();
                if (response.ok) {
                    // Show success modal or alert
                    // Reload window to re-render all template variables (calories, BMI, status, macros)
                    window.location.reload();
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (err) {
                console.error("Failed to log weight:", err);
                alert("Failed to connect to the server.");
            }
        });
    }

    // Initialize the Chart.js weight graph
    async function initWeightChart(memberId) {
        const ctx = document.getElementById('weightHistoryChart');
        if (!ctx) return;

        try {
            const response = await fetch(`/api/members/${memberId}/weight-history`);
            const logs = await response.json();
            
            if (logs.length === 0) {
                // Render empty state placeholder in canvas container
                ctx.parentElement.innerHTML = `
                    <div class="text-center py-5 opacity-75">
                        <i class="fas fa-chart-line fa-3x mb-3 text-secondary"></i>
                        <p class="small text-secondary">No weight history logged yet. Log current weight to start tracking progress.</p>
                    </div>
                `;
                return;
            }

            // Extract labels and dataset
            const labels = logs.map(l => {
                const date = new Date(l.logged_date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const weights = logs.map(l => l.weight_kg);

            // Determine colors based on active theme
            const isDark = document.body.classList.contains('dark-mode');
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            const textColor = isDark ? '#9ca3af' : '#475569';
            const accentColor = isDark ? '#a78bfa' : '#7c3aed';
            const accentSecondary = isDark ? '#f472b6' : '#db2777';

            // Create background gradient
            const chartCtx = ctx.getContext('2d');
            const gradient = chartCtx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, isDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.3)');
            gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

            weightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Weight (kg)',
                        data: weights,
                        borderColor: accentColor,
                        borderWidth: 3,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: accentSecondary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#0d1527' : '#ffffff',
                            titleColor: isDark ? '#f3f4f6' : '#0f172a',
                            bodyColor: isDark ? '#9ca3af' : '#475569',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: textColor,
                                font: {
                                    family: 'Plus Jakarta Sans',
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: textColor,
                                font: {
                                    family: 'Plus Jakarta Sans',
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });

            // Adjust chart theme on theme changes
            const themeObserver = new MutationObserver(() => {
                const currentDark = document.body.classList.contains('dark-mode');
                const newGridColor = currentDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                const newTextColor = currentDark ? '#9ca3af' : '#475569';
                const newAccentColor = currentDark ? '#a78bfa' : '#7c3aed';
                
                // Redraw gradients
                const newGradient = chartCtx.createLinearGradient(0, 0, 0, 300);
                newGradient.addColorStop(0, currentDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.3)');
                newGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

                weightChart.data.datasets[0].borderColor = newAccentColor;
                weightChart.data.datasets[0].backgroundColor = newGradient;
                weightChart.options.scales.x.grid.color = newGridColor;
                weightChart.options.scales.x.ticks.color = newTextColor;
                weightChart.options.scales.y.grid.color = newGridColor;
                weightChart.options.scales.y.ticks.color = newTextColor;
                weightChart.update();
            });

            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        } catch (err) {
            console.error("Error drawing weight history chart:", err);
        }
    }
});

let charts = {};
        
        async function updateAnalysis() {
            const timeRange = document.getElementById('timeRange').value;
            
            try {
                const response = await fetch(`/analysis/data?range=${timeRange}`);
                const data = await response.json();
                
                updateStats(data.stats);
                updateCharts(data.charts);
                updateComparison(data.comparison);
                updateDetails(data.details);
                
            } catch (error) {
                console.error('Fehler beim Laden der Analysedaten:', error);
            }
        }
        
        function updateStats(stats) {
            document.getElementById('totalEntries').textContent = stats.totalEntries.toLocaleString();
            document.getElementById('totalDevices').textContent = stats.totalDevices.toLocaleString();
            document.getElementById('totalIMEIs').textContent = stats.totalIMEIs.toLocaleString();
            document.getElementById('imeiCoverage').textContent = stats.imeiCoverage;
        }
        
        function updateCharts(chartData) {
            // Techniker Leistung Chart
            if (charts.techPerformance) {
                charts.techPerformance.destroy();
            }
            
            const techCtx = document.getElementById('techPerformanceChart').getContext('2d');
            charts.techPerformance = new Chart(techCtx, {
                type: 'bar',
                data: {
                    labels: chartData.techPerformance.labels,
                    datasets: [{
                        label: 'Geräte bearbeitet',
                        data: chartData.techPerformance.data,
                        backgroundColor: 'rgba(0, 180, 216, 0.7)',
                        borderColor: 'rgba(0, 180, 216, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Anzahl Geräte'
                            }
                        }
                    }
                }
            });
            
            // Status Verteilung Chart
            if (charts.statusDistribution) {
                charts.statusDistribution.destroy();
            }
            
            const statusCtx = document.getElementById('statusDistributionChart').getContext('2d');
            charts.statusDistribution = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: chartData.statusDistribution.labels,
                    datasets: [{
                        data: chartData.statusDistribution.data,
                        backgroundColor: [
                            'rgba(0, 212, 170, 0.7)',
                            'rgba(0, 119, 182, 0.7)',
                            'rgba(255, 158, 0, 0.7)',
                            'rgba(255, 107, 107, 0.7)',
                            'rgba(255, 179, 71, 0.7)',
                            'rgba(100, 223, 223, 0.7)',
                            'rgba(169, 142, 255, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
        
        function updateComparison(comparisonData) {
            const tbody = document.getElementById('techComparisonBody');
            tbody.innerHTML = '';
            
            comparisonData.forEach(tech => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${tech.name}</strong></td>
                    <td>${tech.total}</td>
                    <td>${tech.repaired}</td>
                    <td>${tech.inProgress}</td>
                    <td>${tech.qualityControl}</td>
                    <td>
                        <div class="coverage-bar">
                            <div class="coverage-fill" style="width: ${tech.coverage}%"></div>
                            <span>${tech.coverage}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="efficiency-rating">
                            <div class="stars" style="--rating: ${tech.efficiency};">★★★★★</div>
                            <span>${tech.efficiency}/5</span>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        
        function updateDetails(details) {
            // Trends
            if (details.trends) {
                document.getElementById('highestDay').textContent = details.trends.highestDay;
                document.getElementById('averageDaily').textContent = details.trends.averageDaily;
                document.getElementById('trendDirection').textContent = details.trends.trendDirection;
                
                // Tägliche Aktivität Chart
                if (charts.dailyActivity) {
                    charts.dailyActivity.destroy();
                }
                
                const dailyCtx = document.getElementById('dailyActivityChart').getContext('2d');
                charts.dailyActivity = new Chart(dailyCtx, {
                    type: 'line',
                    data: {
                        labels: details.trends.dailyLabels,
                        datasets: [{
                            label: 'Tägliche Aktivität',
                            data: details.trends.dailyData,
                            borderColor: 'rgba(0, 180, 216, 1)',
                            backgroundColor: 'rgba(0, 180, 216, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
            
            // IMEI Details
            if (details.imei) {
                document.getElementById('validIMEIs').textContent = details.imei.validCount;
                document.getElementById('invalidIMEIs').textContent = details.imei.invalidCount;
                document.getElementById('averageScore').textContent = details.imei.averageScore;
                document.getElementById('bestQualityScore').textContent = details.imei.bestQualityScore;
                
                const patternsList = document.getElementById('commonPatterns');
                patternsList.innerHTML = details.imei.commonPatterns
                    .map(pattern => `<span class="pattern-tag">${pattern}</span>`)
                    .join('');
            }
        }
        
        function refreshAnalysis() {
            updateAnalysis();
            showNotification('Analyse aktualisiert', 'success');
        }
        
        function exportAnalysisData() {
            const timeRange = document.getElementById('timeRange').value;
            window.open(`/analysis/export?range=${timeRange}`, '_blank');
        }
        
        function generateFullReport() {
            const timeRange = document.getElementById('timeRange').value;
            window.open(`/analysis/report?range=${timeRange}`, '_blank');
        }
        
        function runMismatchAnalysis() {
            window.location.href = '/analysis/mismatch';
        }
        
        function clearAnalysisCache() {
            if (confirm('Möchten Sie den Analyse-Cache wirklich löschen?')) {
                fetch('/analysis/clear-cache', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showNotification('Cache erfolgreich gelöscht', 'success');
                            refreshAnalysis();
                        }
                    });
            }
        }
        
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 3000);
        }
        
        // Tab Navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Tab Handling
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tabName = this.dataset.tab;
                    
                    // Aktiven Tab entfernen
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    
                    // Neuen Tab aktivieren
                    this.classList.add('active');
                    document.getElementById(tabName + 'Tab').classList.add('active');
                });
            });
            
            // Initiale Daten laden
            updateAnalysis();
        });
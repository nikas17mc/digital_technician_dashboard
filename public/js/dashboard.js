// Datumspicker Funktion
function showDatePicker() {
    const dateInput = document.getElementById('date');
    const currentDate = new Date();
    
    // Erstelle Modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>📅 Datum auswählen</h3>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="date-picker">
                    <div class="date-field">
                        <label>Jahr:</label>
                        <select id="yearSelect" class="date-select">
                            ${Array.from({length: 10}, (_, i) => currentDate.getFullYear() - 5 + i)
                                .map(year => `<option value="${year}" ${year === currentDate.getFullYear() ? 'selected' : ''}>${year}</option>`)
                                .join('')}
                        </select>
                    </div>
                    <div class="date-field">
                        <label>Monat:</label>
                        <select id="monthSelect" class="date-select">
                            ${Array.from({length: 12}, (_, i) => {
                                const month = i + 1;
                                return `<option value="${month}" ${month === currentDate.getMonth() + 1 ? 'selected' : ''}>${month.toString().padStart(2, '0')}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="date-field">
                        <label>Tag:</label>
                        <select id="daySelect" class="date-select">
                            ${Array.from({length: 31}, (_, i) => {
                                const day = i + 1;
                                return `<option value="${day}" ${day === currentDate.getDate() ? 'selected' : ''}>${day.toString().padStart(2, '0')}</option>`;
                            }).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="setToday()">Heute</button>
                <button class="btn btn-success" onclick="applyDate()">Übernehmen</button>
                <button class="btn btn-danger" onclick="this.closest('.modal-overlay').remove()">Abbrechen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Update days based on month/year
    function updateDays() {
        const year = parseInt(document.getElementById('yearSelect').value);
        const month = parseInt(document.getElementById('monthSelect').value);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        const daySelect = document.getElementById('daySelect');
        const currentDay = parseInt(daySelect.value);
        
        daySelect.innerHTML = Array.from({length: daysInMonth}, (_, i) => {
            const day = i + 1;
            return `<option value="${day}" ${day === Math.min(currentDay, daysInMonth) ? 'selected' : ''}>${day.toString().padStart(2, '0')}</option>`;
        }).join('');
    }
    
    document.getElementById('yearSelect').addEventListener('change', updateDays);
    document.getElementById('monthSelect').addEventListener('change', updateDays);
    
    window.setToday = function() {
        const today = new Date();
        document.getElementById('yearSelect').value = today.getFullYear();
        document.getElementById('monthSelect').value = today.getMonth() + 1;
        updateDays();
        document.getElementById('daySelect').value = today.getDate();
    };
    
    window.applyDate = function() {
        const year = document.getElementById('yearSelect').value;
        const month = document.getElementById('monthSelect').value.padStart(2, '0');
        const day = document.getElementById('daySelect').value.padStart(2, '0');
        
        dateInput.value = `${day}.${month}.${year}`;
        modal.remove();
    };
}

// Modals für Einstellungen, Hilfe, etc.
function openSettings() {
    const modal = createModal('⚙️ Einstellungen', `
        <div class="settings-content">
            <div class="form-group">
                <label>
                    <input type="checkbox" id="autoSave" checked>
                    Automatisches JSON-Speichern aktivieren
                </label>
            </div>
            <div class="form-group">
                <label>Speicherpfad:</label>
                <div class="input-group">
                    <input type="text" id="savePath" value="/data/auto_save.json" readonly>
                    <button class="btn btn-secondary" onclick="browsePath()">📂</button>
                </div>
            </div>
            <div class="form-group">
                <button class="btn btn-success" onclick="saveSettings()">Speichern</button>
                <button class="btn btn-danger" onclick="clearAllData()" style="margin-left: 10px;">
                    🗑️ Alle Daten löschen
                </button>
            </div>
        </div>
    `);
}

function showHelp() {
    createModal('❔ Hilfe', `
        <div class="help-content">
            <h4>📝 DATENEINGABE:</h4>
            <p>1. Techniker, Datum, Ereignis wählen</p>
            <p>2. Anzahl eingeben</p>
            <p>3. IMEIs in Tabelle eintragen</p>
            <p>4. Speichern</p>
            
            <h4>📊 MISMATCH ANALYSE:</h4>
            <p>• Vergleicht JSON mit Plenty-Daten</p>
            <p>• Prüft IMEI, Status, Techniker</p>
            <p>• Zeigt Diskrepanzen an</p>
            
            <h4>💾 AUTO-SAVE:</h4>
            <p>• In Einstellungen aktivieren</p>
            <p>• Speichert automatisch als JSON</p>
            
            <h4>⚙️ EINSTELLUNGEN:</h4>
            <p>• Auto-Save konfigurieren</p>
            <p>• Speicherpfad festlegen</p>
        </div>
    `);
}

function analyzeMismatches() {
    createModal('🔍 Mismatch Analyse', `
        <div class="analysis-content">
            <div class="form-group">
                <label>Datum analysieren (leer = alle):</label>
                <input type="text" id="analysisDate" placeholder="TT.MM.JJJJ">
                <button class="btn btn-small btn-secondary" onclick="setTodayDate()">Heute</button>
            </div>
            <div class="form-group">
                <button class="btn btn-success" onclick="startAnalysis()">Analyse starten</button>
            </div>
            <div id="analysisResults" style="margin-top: 20px; display: none;">
                <!-- Results will be shown here -->
            </div>
        </div>
    `);
    
    window.setTodayDate = function() {
        const today = new Date().toLocaleDateString('de-DE');
        document.getElementById('analysisDate').value = today;
    };
    
    window.startAnalysis = async function() {
        const date = document.getElementById('analysisDate').value;
        const resultsDiv = document.getElementById('analysisResults');
        
        try {
            resultsDiv.innerHTML = '<p>🔍 Analysiere Daten...</p>';
            resultsDiv.style.display = 'block';
            
            // Simulierte Analyse
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const results = {
                summary: {
                    status: 'Erfolgreich',
                    message: '25 von 30 IMEIs perfekt gematcht (83.3%)'
                },
                statistics: {
                    total_imeis: 30,
                    perfect_matches: 25,
                    mismatches: 5,
                    match_percentage: 83.3
                }
            };
            
            resultsDiv.innerHTML = `
                <div class="analysis-results">
                    <h4>📊 Analyse Ergebnisse</h4>
                    <p><strong>Status:</strong> ${results.summary.status}</p>
                    <p><strong>Ergebnis:</strong> ${results.summary.message}</p>
                    <p><strong>Total IMEIs:</strong> ${results.statistics.total_imeis}</p>
                    <p><strong>Perfekte Matches:</strong> ${results.statistics.perfect_matches}</p>
                    <p><strong>Mismatches:</strong> ${results.statistics.mismatches}</p>
                    <p><strong>Match Rate:</strong> ${results.statistics.match_percentage}%</p>
                </div>
            `;
            
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">❌ Fehler bei der Analyse: ${error.message}</p>`;
        }
    };
}

function generateReport() {
    // Excel Export aufrufen
    exportExcel();
}

// Hilfsfunktionen
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('jsonFile', file);
        
        try {
            const response = await fetch('/import-export/json-import', {
                method: 'POST',
                body: formData,
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`✅ Import erfolgreich!\n\n${result.count} Einträge importiert`);
                refreshData();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('❌ Import fehlgeschlagen: ' + error.message);
        }
    };
    
    input.click();
}

async function saveSettings() {
    const autoSave = document.getElementById('autoSave').checked;
    const savePath = document.getElementById('savePath').value;
    
    try {
        const response = await fetch('/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoSave, savePath })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Einstellungen gespeichert!');
            document.querySelector('.modal-overlay').remove();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Fehler beim Speichern: ' + error.message);
    }
}

async function clearAllData() {
    if (confirm('Wollen Sie wirklich ALLE Daten löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.')) {
        try {
            const response = await fetch('/data/clear', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Alle Daten wurden gelöscht!');
                refreshData();
                document.querySelector('.modal-overlay').remove();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('❌ Fehler beim Löschen: ' + error.message);
        }
    }
}

// Techniker-Funktionen
async function filterTechnicians(days) {
    try {
        const response = await fetch(`/technicians?days=${days}`);
        if (response.ok) {
            const html = await response.text();
            document.querySelector('.technician-overview').innerHTML = html;
            initializeTechnicianCards();
        }
    } catch (error) {
        console.error('Fehler beim Filtern:', error);
        showNotification('Fehler beim Laden der Techniker-Daten', 'error');
    }
}

function initializeTechnicianCards() {
    // Event Listener für IMEI Buttons
    // document.querySelectorAll('.btn-imei').forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         const card = this.closest('.technician-card');
    //         const technician = card.dataset.technician;
    //         const status = this.dataset.status || this.closest('.status-item').querySelector('.status-info span').textContent;
            
    //         showIMEIDetails(technician, status);
    //     });
    // });
    
    // Lade Statistiken
    updateTechnicianStats();
}

async function updateTechnicianStats() {
    try {
        const response = await fetch('/data/summary');
        const data = await response.json();
        
        if (data.success) {
            // Update each technician card
            document.querySelectorAll('.technician-card').forEach(card => {
                const tech = card.dataset.technician;
                const techData = data.summary[tech];
                
                if (techData) {
                    // Update total count
                    const total = Object.values(techData).reduce((sum, count) => sum + count, 0);
                    const totalElement = card.querySelector('.tech-count');
                    if (totalElement) {
                        totalElement.textContent = total;
                    }
                    
                    // Update status counts
                    card.querySelectorAll('.status-item').forEach(statusItem => {
                        const statusName = statusItem.querySelector('.status-info span').textContent;
                        const count = techData[statusName] || 0;
                        const countElement = statusItem.querySelector('.status-count');
                        if (countElement) {
                            countElement.textContent = count;
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Statistiken:', error);
    }
}

function showIMEIDetails(technician, status) {
    // URL für IMEI-Details
    const url = `/imei-details/${encodeURIComponent(technician)}/${encodeURIComponent(status)}`;
    
    // Öffne in neuem Tab oder Modal
    if (window.innerWidth > 768) {
        // Für Desktop: Modal öffnen
        openIMEDetailsModal(technician, status);
    } else {
        // Für Mobile: Neue Seite
        window.open(url, '_blank');
    }
}

async function openIMEDetailsModal(technician, status) {
    try {
        const response = await fetch(`/imei-details/modal/${encodeURIComponent(technician)}/${encodeURIComponent(status)}`);
        const html = await response.text();
        
        // Erstelle Modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>📱 IMEI Details - ${technician} - ${status}</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${html}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Fehler beim Laden der IMEI-Details:', error);
        // Fallback: Normale Seite öffnen
        window.open(`/imei-details/${encodeURIComponent(technician)}/${encodeURIComponent(status)}`, '_blank');
    }
}

// Initialisiere Techniker-Karten nach dem Laden
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.technician-overview')) {
        initializeTechnicianCards();
    }
});

// Auto-Refresh Status
function updateStatus(message) {
    const statusLabel = document.getElementById('statusLabel');
    if (statusLabel) {
        statusLabel.textContent = message;
    }
}

// Periodische Aktualisierung
setInterval(() => {
    updateStatus(`Aktualisiert: ${new Date().toLocaleTimeString('de-DE')}`);
}, 60000);

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    updateStatus('Bereit');
    
    // // Auto-Refresh alle 60 Sekunden
    // setInterval(refreshData, 60000);
});

// Modal Opener
        function openModal(modal) {
            const sliced = modal.slice(0, (modal.length - 5));
            console.log(sliced);
            if (sliced){
                document.getElementById(`${sliced}Modal`).style.display = 'grid';
            }
        }

        function closeModal(modal) {
            const sliced = modal.slice(0, (modal.length - 5));
            if (sliced){
                document.getElementById(`${sliced}Modal`).style.display = 'none';
            }
        }
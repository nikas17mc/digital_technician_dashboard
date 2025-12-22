"use strict";

// Datumspicker Funktion
function showDatePicker() {
  var dateInput = document.getElementById('date');
  var currentDate = new Date(); // Erstelle Modal

  var modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = "\n        <div class=\"modal\">\n            <div class=\"modal-header\">\n                <h3>\uD83D\uDCC5 Datum ausw\xE4hlen</h3>\n                <button class=\"btn-close\" onclick=\"this.closest('.modal-overlay').remove()\">&times;</button>\n            </div>\n            <div class=\"modal-body\">\n                <div class=\"date-picker\">\n                    <div class=\"date-field\">\n                        <label>Jahr:</label>\n                        <select id=\"yearSelect\" class=\"date-select\">\n                            ".concat(Array.from({
    length: 10
  }, function (_, i) {
    return currentDate.getFullYear() - 5 + i;
  }).map(function (year) {
    return "<option value=\"".concat(year, "\" ").concat(year === currentDate.getFullYear() ? 'selected' : '', ">").concat(year, "</option>");
  }).join(''), "\n                        </select>\n                    </div>\n                    <div class=\"date-field\">\n                        <label>Monat:</label>\n                        <select id=\"monthSelect\" class=\"date-select\">\n                            ").concat(Array.from({
    length: 12
  }, function (_, i) {
    var month = i + 1;
    return "<option value=\"".concat(month, "\" ").concat(month === currentDate.getMonth() + 1 ? 'selected' : '', ">").concat(month.toString().padStart(2, '0'), "</option>");
  }).join(''), "\n                        </select>\n                    </div>\n                    <div class=\"date-field\">\n                        <label>Tag:</label>\n                        <select id=\"daySelect\" class=\"date-select\">\n                            ").concat(Array.from({
    length: 31
  }, function (_, i) {
    var day = i + 1;
    return "<option value=\"".concat(day, "\" ").concat(day === currentDate.getDate() ? 'selected' : '', ">").concat(day.toString().padStart(2, '0'), "</option>");
  }).join(''), "\n                        </select>\n                    </div>\n                </div>\n            </div>\n            <div class=\"modal-footer\">\n                <button class=\"btn btn-secondary\" onclick=\"setToday()\">Heute</button>\n                <button class=\"btn btn-success\" onclick=\"applyDate()\">\xDCbernehmen</button>\n                <button class=\"btn btn-danger\" onclick=\"this.closest('.modal-overlay').remove()\">Abbrechen</button>\n            </div>\n        </div>\n    ");
  document.body.appendChild(modal); // Update days based on month/year

  function updateDays() {
    var year = parseInt(document.getElementById('yearSelect').value);
    var month = parseInt(document.getElementById('monthSelect').value);
    var daysInMonth = new Date(year, month, 0).getDate();
    var daySelect = document.getElementById('daySelect');
    var currentDay = parseInt(daySelect.value);
    daySelect.innerHTML = Array.from({
      length: daysInMonth
    }, function (_, i) {
      var day = i + 1;
      return "<option value=\"".concat(day, "\" ").concat(day === Math.min(currentDay, daysInMonth) ? 'selected' : '', ">").concat(day.toString().padStart(2, '0'), "</option>");
    }).join('');
  }

  document.getElementById('yearSelect').addEventListener('change', updateDays);
  document.getElementById('monthSelect').addEventListener('change', updateDays);

  window.setToday = function () {
    var today = new Date();
    document.getElementById('yearSelect').value = today.getFullYear();
    document.getElementById('monthSelect').value = today.getMonth() + 1;
    updateDays();
    document.getElementById('daySelect').value = today.getDate();
  };

  window.applyDate = function () {
    var year = document.getElementById('yearSelect').value;
    var month = document.getElementById('monthSelect').value.padStart(2, '0');
    var day = document.getElementById('daySelect').value.padStart(2, '0');
    dateInput.value = "".concat(day, ".").concat(month, ".").concat(year);
    modal.remove();
  };
} // Modals für Einstellungen, Hilfe, etc.


function openSettings() {
  var modal = createModal('⚙️ Einstellungen', "\n        <div class=\"settings-content\">\n            <div class=\"form-group\">\n                <label>\n                    <input type=\"checkbox\" id=\"autoSave\" checked>\n                    Automatisches JSON-Speichern aktivieren\n                </label>\n            </div>\n            <div class=\"form-group\">\n                <label>Speicherpfad:</label>\n                <div class=\"input-group\">\n                    <input type=\"text\" id=\"savePath\" value=\"/data/auto_save.json\" readonly>\n                    <button class=\"btn btn-secondary\" onclick=\"browsePath()\">\uD83D\uDCC2</button>\n                </div>\n            </div>\n            <div class=\"form-group\">\n                <button class=\"btn btn-success\" onclick=\"saveSettings()\">Speichern</button>\n                <button class=\"btn btn-danger\" onclick=\"clearAllData()\" style=\"margin-left: 10px;\">\n                    \uD83D\uDDD1\uFE0F Alle Daten l\xF6schen\n                </button>\n            </div>\n        </div>\n    ");
}

function showHelp() {
  createModal('❔ Hilfe', "\n        <div class=\"help-content\">\n            <h4>\uD83D\uDCDD DATENEINGABE:</h4>\n            <p>1. Techniker, Datum, Ereignis w\xE4hlen</p>\n            <p>2. Anzahl eingeben</p>\n            <p>3. IMEIs in Tabelle eintragen</p>\n            <p>4. Speichern</p>\n            \n            <h4>\uD83D\uDCCA MISMATCH ANALYSE:</h4>\n            <p>\u2022 Vergleicht JSON mit Plenty-Daten</p>\n            <p>\u2022 Pr\xFCft IMEI, Status, Techniker</p>\n            <p>\u2022 Zeigt Diskrepanzen an</p>\n            \n            <h4>\uD83D\uDCBE AUTO-SAVE:</h4>\n            <p>\u2022 In Einstellungen aktivieren</p>\n            <p>\u2022 Speichert automatisch als JSON</p>\n            \n            <h4>\u2699\uFE0F EINSTELLUNGEN:</h4>\n            <p>\u2022 Auto-Save konfigurieren</p>\n            <p>\u2022 Speicherpfad festlegen</p>\n        </div>\n    ");
}

function analyzeMismatches() {
  createModal('🔍 Mismatch Analyse', "\n        <div class=\"analysis-content\">\n            <div class=\"form-group\">\n                <label>Datum analysieren (leer = alle):</label>\n                <input type=\"text\" id=\"analysisDate\" placeholder=\"TT.MM.JJJJ\">\n                <button class=\"btn btn-small btn-secondary\" onclick=\"setTodayDate()\">Heute</button>\n            </div>\n            <div class=\"form-group\">\n                <button class=\"btn btn-success\" onclick=\"startAnalysis()\">Analyse starten</button>\n            </div>\n            <div id=\"analysisResults\" style=\"margin-top: 20px; display: none;\">\n                <!-- Results will be shown here -->\n            </div>\n        </div>\n    ");

  window.setTodayDate = function () {
    var today = new Date().toLocaleDateString('de-DE');
    document.getElementById('analysisDate').value = today;
  };

  window.startAnalysis = function _callee() {
    var date, resultsDiv, results;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            date = document.getElementById('analysisDate').value;
            resultsDiv = document.getElementById('analysisResults');
            _context.prev = 2;
            resultsDiv.innerHTML = '<p>🔍 Analysiere Daten...</p>';
            resultsDiv.style.display = 'block'; // Simulierte Analyse

            _context.next = 7;
            return regeneratorRuntime.awrap(new Promise(function (resolve) {
              return setTimeout(resolve, 1000);
            }));

          case 7:
            results = {
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
            resultsDiv.innerHTML = "\n                <div class=\"analysis-results\">\n                    <h4>\uD83D\uDCCA Analyse Ergebnisse</h4>\n                    <p><strong>Status:</strong> ".concat(results.summary.status, "</p>\n                    <p><strong>Ergebnis:</strong> ").concat(results.summary.message, "</p>\n                    <p><strong>Total IMEIs:</strong> ").concat(results.statistics.total_imeis, "</p>\n                    <p><strong>Perfekte Matches:</strong> ").concat(results.statistics.perfect_matches, "</p>\n                    <p><strong>Mismatches:</strong> ").concat(results.statistics.mismatches, "</p>\n                    <p><strong>Match Rate:</strong> ").concat(results.statistics.match_percentage, "%</p>\n                </div>\n            ");
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](2);
            resultsDiv.innerHTML = "<p class=\"error\">\u274C Fehler bei der Analyse: ".concat(_context.t0.message, "</p>");

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[2, 11]]);
  };
}

function generateReport() {
  // Excel Export aufrufen
  exportExcel();
} // Hilfsfunktionen


function createModal(title, content) {
  var modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = "\n        <div class=\"modal\">\n            <div class=\"modal-header\">\n                <h3>".concat(title, "</h3>\n                <button class=\"btn-close\" onclick=\"this.closest('.modal-overlay').remove()\">&times;</button>\n            </div>\n            <div class=\"modal-body\">\n                ").concat(content, "\n            </div>\n            <div class=\"modal-footer\">\n                <button class=\"btn btn-primary\" onclick=\"this.closest('.modal-overlay').remove()\">Schlie\xDFen</button>\n            </div>\n        </div>\n    ");
  document.body.appendChild(modal);
  return modal;
}

function importJSON() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function _callee2(e) {
    var file, formData, response, result;
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            file = e.target.files[0];

            if (file) {
              _context2.next = 3;
              break;
            }

            return _context2.abrupt("return");

          case 3:
            formData = new FormData();
            formData.append('jsonFile', file);
            _context2.prev = 5;
            _context2.next = 8;
            return regeneratorRuntime.awrap(fetch('/import-export/json-import', {
              method: 'POST',
              body: formData
            }));

          case 8:
            response = _context2.sent;
            _context2.next = 11;
            return regeneratorRuntime.awrap(response.json());

          case 11:
            result = _context2.sent;

            if (!result.success) {
              _context2.next = 17;
              break;
            }

            alert("\u2705 Import erfolgreich!\n\n".concat(result.count, " Eintr\xE4ge importiert"));
            refreshData();
            _context2.next = 18;
            break;

          case 17:
            throw new Error(result.message);

          case 18:
            _context2.next = 23;
            break;

          case 20:
            _context2.prev = 20;
            _context2.t0 = _context2["catch"](5);
            alert('❌ Import fehlgeschlagen: ' + _context2.t0.message);

          case 23:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[5, 20]]);
  };

  input.click();
}

function saveSettings() {
  var autoSave, savePath, response, result;
  return regeneratorRuntime.async(function saveSettings$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          autoSave = document.getElementById('autoSave').checked;
          savePath = document.getElementById('savePath').value;
          _context3.prev = 2;
          _context3.next = 5;
          return regeneratorRuntime.awrap(fetch('/settings/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              autoSave: autoSave,
              savePath: savePath
            })
          }));

        case 5:
          response = _context3.sent;
          _context3.next = 8;
          return regeneratorRuntime.awrap(response.json());

        case 8:
          result = _context3.sent;

          if (!result.success) {
            _context3.next = 14;
            break;
          }

          alert('✅ Einstellungen gespeichert!');
          document.querySelector('.modal-overlay').remove();
          _context3.next = 15;
          break;

        case 14:
          throw new Error(result.message);

        case 15:
          _context3.next = 20;
          break;

        case 17:
          _context3.prev = 17;
          _context3.t0 = _context3["catch"](2);
          alert('❌ Fehler beim Speichern: ' + _context3.t0.message);

        case 20:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[2, 17]]);
}

function clearAllData() {
  var response, result;
  return regeneratorRuntime.async(function clearAllData$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (!confirm('Wollen Sie wirklich ALLE Daten löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.')) {
            _context4.next = 20;
            break;
          }

          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(fetch('/data/clear', {
            method: 'POST'
          }));

        case 4:
          response = _context4.sent;
          _context4.next = 7;
          return regeneratorRuntime.awrap(response.json());

        case 7:
          result = _context4.sent;

          if (!result.success) {
            _context4.next = 14;
            break;
          }

          alert('✅ Alle Daten wurden gelöscht!');
          refreshData();
          document.querySelector('.modal-overlay').remove();
          _context4.next = 15;
          break;

        case 14:
          throw new Error(result.message);

        case 15:
          _context4.next = 20;
          break;

        case 17:
          _context4.prev = 17;
          _context4.t0 = _context4["catch"](1);
          alert('❌ Fehler beim Löschen: ' + _context4.t0.message);

        case 20:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 17]]);
} // Techniker-Funktionen


function filterTechnicians(days) {
  var response, html;
  return regeneratorRuntime.async(function filterTechnicians$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(fetch("/technicians?days=".concat(days)));

        case 3:
          response = _context5.sent;

          if (!response.ok) {
            _context5.next = 10;
            break;
          }

          _context5.next = 7;
          return regeneratorRuntime.awrap(response.text());

        case 7:
          html = _context5.sent;
          document.querySelector('.technician-overview').innerHTML = html;
          initializeTechnicianCards();

        case 10:
          _context5.next = 16;
          break;

        case 12:
          _context5.prev = 12;
          _context5.t0 = _context5["catch"](0);
          console.error('Fehler beim Filtern:', _context5.t0);
          showNotification('Fehler beim Laden der Techniker-Daten', 'error');

        case 16:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 12]]);
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

function updateTechnicianStats() {
  var response, data;
  return regeneratorRuntime.async(function updateTechnicianStats$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(fetch('/data/summary'));

        case 3:
          response = _context6.sent;
          _context6.next = 6;
          return regeneratorRuntime.awrap(response.json());

        case 6:
          data = _context6.sent;

          if (data.success) {
            // Update each technician card
            document.querySelectorAll('.technician-card').forEach(function (card) {
              var tech = card.dataset.technician;
              var techData = data.summary[tech];

              if (techData) {
                // Update total count
                var total = Object.values(techData).reduce(function (sum, count) {
                  return sum + count;
                }, 0);
                var totalElement = card.querySelector('.tech-count');

                if (totalElement) {
                  totalElement.textContent = total;
                } // Update status counts


                card.querySelectorAll('.status-item').forEach(function (statusItem) {
                  var statusName = statusItem.querySelector('.status-info span').textContent;
                  var count = techData[statusName] || 0;
                  var countElement = statusItem.querySelector('.status-count');

                  if (countElement) {
                    countElement.textContent = count;
                  }
                });
              }
            });
          }

          _context6.next = 13;
          break;

        case 10:
          _context6.prev = 10;
          _context6.t0 = _context6["catch"](0);
          console.error('Fehler beim Aktualisieren der Statistiken:', _context6.t0);

        case 13:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 10]]);
}

function showIMEIDetails(technician, status) {
  // URL für IMEI-Details
  var url = "/imei-details/".concat(encodeURIComponent(technician), "/").concat(encodeURIComponent(status)); // Öffne in neuem Tab oder Modal

  if (window.innerWidth > 768) {
    // Für Desktop: Modal öffnen
    openIMEDetailsModal(technician, status);
  } else {
    // Für Mobile: Neue Seite
    window.open(url, '_blank');
  }
}

function openIMEDetailsModal(technician, status) {
  var response, html, modal;
  return regeneratorRuntime.async(function openIMEDetailsModal$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return regeneratorRuntime.awrap(fetch("/imei-details/modal/".concat(encodeURIComponent(technician), "/").concat(encodeURIComponent(status))));

        case 3:
          response = _context7.sent;
          _context7.next = 6;
          return regeneratorRuntime.awrap(response.text());

        case 6:
          html = _context7.sent;
          // Erstelle Modal
          modal = document.createElement('div');
          modal.className = 'modal-overlay';
          modal.innerHTML = "\n            <div class=\"modal modal-large\">\n                <div class=\"modal-header\">\n                    <h3>\uD83D\uDCF1 IMEI Details - ".concat(technician, " - ").concat(status, "</h3>\n                    <button class=\"btn-close\" onclick=\"this.closest('.modal-overlay').remove()\">&times;</button>\n                </div>\n                <div class=\"modal-body\">\n                    ").concat(html, "\n                </div>\n                <div class=\"modal-footer\">\n                    <button class=\"btn btn-primary\" onclick=\"this.closest('.modal-overlay').remove()\">Schlie\xDFen</button>\n                </div>\n            </div>\n        ");
          document.body.appendChild(modal);
          _context7.next = 17;
          break;

        case 13:
          _context7.prev = 13;
          _context7.t0 = _context7["catch"](0);
          console.error('Fehler beim Laden der IMEI-Details:', _context7.t0); // Fallback: Normale Seite öffnen

          window.open("/imei-details/".concat(encodeURIComponent(technician), "/").concat(encodeURIComponent(status)), '_blank');

        case 17:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 13]]);
} // Initialisiere Techniker-Karten nach dem Laden


document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.technician-overview')) {
    initializeTechnicianCards();
  }
}); // Auto-Refresh Status

function updateStatus(message) {
  var statusLabel = document.getElementById('statusLabel');

  if (statusLabel) {
    statusLabel.textContent = message;
  }
} // Periodische Aktualisierung


setInterval(function () {
  updateStatus("Aktualisiert: ".concat(new Date().toLocaleTimeString('de-DE')));
}, 60000); // Initialisierung

document.addEventListener('DOMContentLoaded', function () {
  updateStatus('Bereit'); // // Auto-Refresh alle 60 Sekunden
  // setInterval(refreshData, 60000);
}); // Modal Opener

function openModal(modal) {
  var sliced = modal.slice(0, modal.length - 5);
  console.log(sliced);

  if (sliced) {
    document.getElementById("".concat(sliced, "Modal")).style.display = 'grid';
  }
}

function closeModal(modal) {
  var sliced = modal.slice(0, modal.length - 5);

  if (sliced) {
    document.getElementById("".concat(sliced, "Modal")).style.display = 'none';
  }
}
// Dashboard JavaScript Module
class Dashboard {
    constructor() {
        this.imeiCounter = 1;
        this.notifications = [];
        this.init();
    }

    init() {
        // Setze heutiges Datum
        const today = new Date().toLocaleDateString('de-DE');
        const dateField = document.getElementById('date');
        if (dateField) dateField.value = today;

        // Initialize tabs
        this.initTabs();

        // Initialize date pickers
        this.initDatePickers();

        // Load initial data
        this.refreshData();
    }

    initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;

                // Remove active class from all tabs and panes
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                // Add active class to clicked tab and corresponding pane
                e.target.classList.add('active');
                const pane = document.getElementById(tabName + 'Tab');
                if (pane) pane.classList.add('active');
            });
        });
    }

    initDatePickers() {
        // Start-Datum: Erster Tag des aktuellen Monats
        const firstDay = new Date();
        firstDay.setDate(1);
        const startField = document.getElementById('startDate');
        if (startField) startField.value = firstDay.toLocaleDateString('de-DE');

        // End-Datum: Heute
        const endField = document.getElementById('endDate');
        if (endField) endField.value = new Date().toLocaleDateString('de-DE');

        // Datepicker für Formularfelder
        const dateFields = ['#date', '#startDate', '#endDate'];
        dateFields.forEach(selector => {
            const field = document.querySelector(selector);
            if (field) {
                field.addEventListener('click', () => this.showDatePicker(field.id));
            }
        });
    }

    // IMEI Management
    addIMEIRow() {
        this.imeiCounter++;
        const container = document.getElementById('imeiContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'imei-row';
        row.innerHTML = `
            <div class="imei-label">IMEI ${this.imeiCounter}:</div>
            <input class="imei-input" type="text" placeholder="IMEI eingeben..." data-index="${this.imeiCounter}">
            <button class="btn btn-icon btn-danger" type="button" onclick="dashboard.removeIMEIRow(this)" aria-label="IMEI entfernen">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(row);
        row.querySelector('.imei-input').focus();
        this.updateIMEICount();
    }

    removeIMEIRow(btn) {
        const rows = document.querySelectorAll('.imei-row');
        if (rows.length > 1) {
            btn.closest('.imei-row').remove();
            this.updateIMELabels();
            this.updateIMEICount();
        } else {
            this.showNotification('Mindestens eine IMEI-Zeile muss vorhanden sein.', 'warning');
        }
    }

    updateIMELabels() {
        document.querySelectorAll('.imei-row').forEach((row, index) => {
            const label = row.querySelector('.imei-label');
            if (label) label.textContent = `IMEI ${index + 1}:`;
        });
    }

    updateIMEICount() {
        const count = document.querySelectorAll('.imei-row').length;
        const badge = document.querySelector('.section-badge');
        if (badge) badge.textContent = count;
    }

    clearIMEI() {
        if (confirm('Möchten Sie wirklich alle IMEI-Einträge löschen?')) {
            const container = document.getElementById('imeiContainer');
            if (container) {
                container.innerHTML = '';
                this.imeiCounter = 0;
                this.addIMEIRow();
                this.updateIMEICount();
            }
        }
    }

    // Formular-Funktionen
    resetForm() {
        const form = document.getElementById('entryForm');
        if (form) {
            form.reset();
            const dateField = document.getElementById('date');
            if (dateField) dateField.value = new Date().toLocaleDateString('de-DE');
            const countField = document.getElementById('count');
            if (countField) countField.value = '1';
        }
        this.clearIMEI();
        this.showNotification('Formular wurde zurückgesetzt.', 'info');
    }

    validateForm(formData) {
        const errors = [];

        if (!formData.technician || formData.technician.trim().length === 0) {
            errors.push('Techniker ist erforderlich');
        }

        if (!formData.date || !/^\d{2}\.\d{2}\.\d{4}$/.test(formData.date)) {
            errors.push('Ungültiges Datumsformat');
        }

        if (!formData.status || formData.status.trim().length === 0) {
            errors.push('Status ist erforderlich');
        }

        if (!formData.count || parseInt(formData.count) < 1) {
            errors.push('Anzahl muss mindestens 1 sein');
        }

        if (formData.imei.length === 0) {
            errors.push('Mindestens eine IMEI ist erforderlich');
        }

        // Validate IMEI format
        formData.imei.forEach((imei, index) => {
            if (imei && !/^\d{10,20}$/.test(imei.replace(/\s/g, ''))) {
                errors.push(`IMEI ${index + 1} hat ungültiges Format`);
            }
        });

        return errors;
    }

    async saveEntry() {
        try {
            const formData = this.getFormData();

            // Validate form
            const errors = this.validateForm(formData);
            if (errors.length > 0) {
                this.showNotification('Validierungsfehler: ' + errors.join(', '), 'error');
                return;
            }

            const response = await fetch('/data/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('✅ Eintrag erfolgreich gespeichert!', 'success');
                this.resetForm();
                this.refreshData();
                this.updateDashboardStats();
            } else {
                throw new Error(result.message || 'Unbekannter Fehler');
            }
        } catch (error) {
            this.showNotification('❌ Fehler beim Speichern: ' + error.message, 'error');
            console.error('Save error:', error);
        }
    }

    getFormData() {
        const technician = document.getElementById('technician')?.value || '';
        const date = document.getElementById('date')?.value || '';
        const status = document.getElementById('status')?.value || '';
        const count = document.getElementById('count')?.value || '1';
        const imeiInputs = document.querySelectorAll('.imei-input');
        const imei = Array.from(imeiInputs)
            .map(input => input.value.trim())
            .filter(value => value);

        return { technician, date, status, count, imei };
    }

    // Daten-Management
    async refreshData() {
        try {
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            const technicianFilter = document.getElementById('technicianFilter')?.value;

            const url = new URL('/data/filter', window.location.origin);
            if (startDate) url.searchParams.append('startDate', startDate);
            if (endDate) url.searchParams.append('endDate', endDate);
            if (technicianFilter) url.searchParams.append('technician', technicianFilter);

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                this.updateDataTable(result.data);
                this.updateSummary(result.statistics);
                this.updateDashboardStats();
            } else {
                throw new Error(result.message || 'Fehler beim Laden der Daten');
            }
        } catch (error) {
            this.showNotification('❌ Fehler beim Aktualisieren: ' + error.message, 'error');
            console.error('Refresh error:', error);
        }
    }

    updateDataTable(data) {
        const tbody = document.getElementById('dataTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="fas fa-inbox"></i>
                        <p>Keine Daten gefunden</p>
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(entry => {
            const row = document.createElement('tr');
            row.dataset.entryId = entry.id;

            const cells = [
                entry.id,
                entry.technic,
                entry.date,
                entry.event,
                entry.total_count,
                entry.imei.filter(i => i).length,
                new Date(entry.timestamp).toLocaleTimeString('de-DE'),
                this.createActionButtons(entry.id)
            ];

            cells.forEach(cellData => {
                const cell = document.createElement('td');
                cell.innerHTML = cellData;
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    }

    createActionButtons(entryId) {
        return `
            <button class="btn btn-icon btn-sm btn-info" onclick="dashboard.showIMEIDetails(${entryId})" aria-label="IMEI Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-warning" onclick="dashboard.editEntry(${entryId})" aria-label="Eintrag bearbeiten">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="dashboard.deleteEntry(${entryId})" aria-label="Eintrag löschen">
                <i.fas.fa-trash</i>
            </button>
        `;
    }

    updateDashboardStats() {
        // Update stat cards with current data
        // This would be implemented based on actual requirements
    }

    // Eintrag-Funktionen
    editEntry(entryId) {
        this.showNotification(`Bearbeiten von Eintrag ${entryId} wird vorbereitet...`, 'info');
        // Implementation would go here
    }

    async deleteEntry(entryId) {
        if (!confirm(`Möchten Sie Eintrag ${entryId} wirklich löschen?`)) {
            return;
        }

        try {
            const response = await fetch(`/data/delete/${entryId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('✅ Eintrag erfolgreich gelöscht!', 'success');
                this.refreshData();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.showNotification('❌ Fehler beim Löschen: ' + error.message, 'error');
        }
    }

    showIMEIDetails(entryId) {
        window.location.href = `/imei-details/${entryId}`;
    }

    // Export-Funktionen
    exportExcel() {
        this.initiateExport('/import-export/excel-export', 'Excel-Export');
    }

    exportPDF() {
        this.showNotification('PDF-Export wird in Kürze verfügbar sein.', 'info');
    }

    exportCSV() {
        this.initiateExport('/import-export/csv-export', 'CSV-Export');
    }

    initiateExport(baseUrl, type) {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const technician = document.getElementById('technicianFilter')?.value;

        let url = baseUrl;
        const params = [];
        if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
        if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
        if (technician) params.push(`technician=${encodeURIComponent(technician)}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        window.location.href = url;
        this.showNotification(`${type} wird vorbereitet...`, 'info');
    }

    // Hilfsfunktionen
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showDatePicker(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.type = 'date';
            field.showPicker();
            setTimeout(() => {
                field.type = 'text';
            }, 100);
        }
    }

    // Utility functions
    applyFilters() {
        this.refreshData();
        this.showNotification('Filter wurden angewendet.', 'success');
    }

    resetFilters() {
        this.initDatePickers();
        const technicianFilter = document.getElementById('technicianFilter');
        if (technicianFilter) technicianFilter.value = '';
        this.refreshData();
        this.showNotification('Filter wurden zurückgesetzt.', 'info');
    }

    quickReport() {
        this.generateReport();
    }

    quickExport() {
        this.exportExcel();
    }

    generateReport() {
        // Implementation would go here
        this.showNotification('Report wird generiert...', 'info');
    }

    loadMoreActivities() {
        this.showNotification('Weitere Aktivitäten werden geladen...', 'info');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'grid';
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Global functions for onclick handlers
window.addIMEIRow = () => dashboard.addIMEIRow();
window.removeIMEIRow = (btn) => dashboard.removeIMEIRow(btn);
window.clearIMEI = () => dashboard.clearIMEI();
window.resetForm = () => dashboard.resetForm();
window.saveEntry = () => dashboard.saveEntry();
window.refreshData = () => dashboard.refreshData();
window.applyFilters = () => dashboard.applyFilters();
window.resetFilters = () => dashboard.resetFilters();
window.showIMEIDetails = (id) => dashboard.showIMEIDetails(id);
window.editEntry = (id) => dashboard.editEntry(id);
window.deleteEntry = (id) => dashboard.deleteEntry(id);
window.exportExcel = () => dashboard.exportExcel();
window.exportPDF = () => dashboard.exportPDF();
window.exportCSV = () => dashboard.exportCSV();
window.quickReport = () => dashboard.quickReport();
window.quickExport = () => dashboard.quickExport();
window.loadMoreActivities = () => dashboard.loadMoreActivities();
window.openModal = (modalId) => dashboard.openModal(modalId);
window.showDatePicker = (fieldId) => dashboard.showDatePicker(fieldId);
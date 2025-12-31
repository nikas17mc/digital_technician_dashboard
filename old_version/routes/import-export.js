const express = require('express');
const router = express.Router();
const DataManager = require('../models/DataManager');
const XLSX = require('xlsx');
const moment = require('moment');

const dataManager = new DataManager();

// Daten exportieren (Excel)
router.get('/excel-export', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let filteredData = dataManager.data;

        if (startDate && endDate) {
            const start = moment(startDate, "DD.MM.YYYY");
            const end = moment(endDate, "DD.MM.YYYY");
            
            filteredData = dataManager.data.filter(d => {
                const entryDate = moment(d.date, "DD.MM.YYYY");
                return entryDate.isBetween(start, end, null, '[]');
            });
        }

        // Erstelle Workbook
        const wb = XLSX.utils.book_new();

        // 1. Übersicht Sheet
        const summary = dataManager.getSummary(startDate, endDate);
        const summaryData = [];

        // Header
        summaryData.push(['Techniker', ...dataManager.statusTypes, 'Gesamt', 'IMEI Gesamt']);

        // Daten
        dataManager.technicians.forEach(tech => {
            const row = [tech];
            let techTotal = 0;
            let imeiTotal = 0;

            dataManager.statusTypes.forEach(status => {
                const count = summary[tech]?.[status] || 0;
                row.push(count);
                techTotal += count;
            });

            // IMEI Count
            imeiTotal = filteredData
                .filter(d => d.technic === tech)
                .reduce((sum, d) => sum + d.imei.filter(i => i).length, 0);

            row.push(techTotal, imeiTotal);
            summaryData.push(row);
        });

        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Übersicht');

        // 2. Detaildaten Sheet
        const detailData = [
            ['ID', 'Techniker', 'Datum', 'Ereignis', 'Anzahl', 'IMEI-Anzahl', 'Zeitstempel']
        ];

        filteredData.forEach(entry => {
            const imeiCount = entry.imei.filter(i => i).length;
            detailData.push([
                entry.id,
                entry.technic,
                entry.date,
                entry.event,
                entry.total_count,
                imeiCount,
                new Date(entry.timestamp).toLocaleString('de-DE')
            ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Detaildaten');

        // 3. IMEI Liste Sheet
        const imeiData = [
            ['ID', 'Techniker', 'Datum', 'Ereignis', 'IMEI-Nummer']
        ];

        filteredData.forEach(entry => {
            entry.imei.filter(i => i).forEach(imei => {
                imeiData.push([
                    entry.id,
                    entry.technic,
                    entry.date,
                    entry.event,
                    imei
                ]);
            });
        });

        const ws3 = XLSX.utils.aoa_to_sheet(imeiData);
        XLSX.utils.book_append_sheet(wb, ws3, 'IMEI Liste');

        // Datei generieren
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Techniker_Report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
        res.send(buffer);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Export fehlgeschlagen',
            error: error.message
        });
    }
});

// Route JSON Import
router.post('/json-import', async (req, res) => {
    try {
        if (!req.files || !req.files.jsonFile) {
            return res.status(400).json({
                success: false,
                message: 'Keine Datei hochgeladen'
            });
        }

        const jsonFile = req.files.jsonFile;
        
        // Parse JSON
        let jsonData;
        try {
            jsonData = JSON.parse(jsonFile.data.toString('utf8'));
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiges JSON-Format',
                error: parseError.message
            });
        }
        
        // Validierung
        if (!Array.isArray(jsonData)) {
            return res.status(400).json({
                success: false,
                message: 'JSON muss ein Array enthalten'
            });
        }

        // Daten zurücksetzen und importieren
        dataManager.data = [];
        jsonData.forEach((entry, idx) => {
            dataManager.data.push({
                id: idx + 1,
                date_time: entry.date_time || moment().format("DD-MM-YYYY_HHmmss"),
                technic: entry.technic || entry.technician || "",
                event: entry.event || entry.status || "",
                total_count: entry.total_count || entry.count || 0,
                imei: entry.imei || [],
                date: dataManager.extractDateFromDateTime(entry.date_time || ""),
                technician: entry.technic || entry.technician || "",
                status: entry.event || entry.status || "",
                count: entry.total_count || entry.count || 0,
                timestamp: new Date().toISOString(),
            });
        });

        await dataManager.autoSave();

        res.json({
            success: true,
            message: `Import erfolgreich! ${jsonData.length} Einträge importiert`,
            count: jsonData.length
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import fehlgeschlagen',
            error: error.message
        });
    }
});

module.exports = router;
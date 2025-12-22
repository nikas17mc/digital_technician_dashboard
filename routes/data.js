const express = require('express');
const router = express.Router();
const DataManager = require('../models/DataManager');
const moment = require('moment');

const dataManager = new DataManager();

// Neuen Eintrag speichern
router.post('/add', async (req, res) => {
    try {
        const {
            technician,
            date,
            status,
            count,
            imei
        } = req.body;

        let imeiList = [];
        if (imei) {
            if (Array.isArray(imei)) {
                imeiList = imei.filter(i => i.trim());
            } else if (typeof imei === 'string') {
                imeiList = imei.split('\n').filter(i => i.trim());
            }
        }

        const entry = await dataManager.addEntry(
            technician,
            date,
            status,
            parseInt(count),
            imeiList
        );

        res.json({
            success: true,
            message: 'Eintrag erfolgreich gespeichert',
            entry
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Speichern',
            error: error.message
        });
    }
});

// Daten löschen
router.post('/clear', async (_, res) => {
    try {
        await dataManager.clearData();
        res.json({
            success: true,
            message: 'Alle Daten wurden gelöscht'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Löschen',
            error: error.message
        });
    }
});

// Daten filtern
router.get('/filter', (req, res) => {
    const {
        startDate,
        endDate
    } = req.query;

    let filteredData = dataManager.data;
    if (startDate && endDate) {
        const start = moment(startDate, "DD.MM.YYYY");
        const end = moment(endDate, "DD.MM.YYYY");

        filteredData = dataManager.data.filter(d => {
            const entryDate = moment(d.date, "DD.MM.YYYY");
            return entryDate.isBetween(start, end, null, '[]');
        });
    }

    const summary = dataManager.getSummary(startDate, endDate);
    const statistics = dataManager.getStatistics();

    res.json({
        success: true,
        data: filteredData.slice(-50), // Letzte 50 Einträge
        summary,
        statistics: {
            ...statistics,
            filteredEntries: filteredData.length,
            filteredDevices: filteredData.reduce((sum, d) => sum + d.total_count, 0),
            filteredIMEIs: filteredData.reduce((sum, d) => sum + d.imei.filter(i => i).length, 0)
        }
    });
});

module.exports = router;
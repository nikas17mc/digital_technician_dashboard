const express = require('express');
const router = express.Router();
const DataManager = require('../models/DataManager');
const IMEIAnalyzer = require('../models/IMEIAnalyzer');

const dataManager = new DataManager();
const imeiAnalyzer = new IMEIAnalyzer();

// Home/Dashboard Route
router.get('/', (_, res) => {
    const summary = dataManager.getSummary();
    const statistics = dataManager.getStatistics();

    res.render('welcome', {
        title: 'Techniker Dashboard',
        technicians: dataManager.technicians,
        statusTypes: dataManager.statusTypes,
        data: dataManager.data, // Letzte 50 Einträge
        summary,
        statistics,
        currentDate: new Date().toLocaleDateString('de-DE')
    });
});

router.get('/dashboard', (_, res) => {
    const summary = dataManager.getSummary();
    const statistics = dataManager.getStatistics();

    res.render('dashboard', {
        title: 'Techniker Dashboard',
        technicians: dataManager.technicians,
        statusTypes: dataManager.statusTypes,
        data: dataManager.data, // Letzte 50 Einträge
        summary,
        statistics,
        currentDate: new Date().toLocaleDateString('de-DE')
    })
})

// Techniker Übersicht
router.get('/technicians', (req, res) => {
    const days = req.query.days || '7';
    let startDate = null;
    let endDate = null;

    if (days !== 'Alle') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - parseInt(days));

        startDate = start.toLocaleDateString('de-DE');
        endDate = end.toLocaleDateString('de-DE');
    }

    const summary = dataManager.getSummary(startDate, endDate);

    // Berechne Statistiken für jeden Techniker
    const techStats = {};
    dataManager.technicians.forEach(tech => {
        const techData = dataManager.data.filter(d => d.technic === tech);
        const stats = {
            totalDevices: techData.reduce((sum, d) => sum + d.total_count, 0),
            byStatus: {},
            imeiByStatus: {}
        };

        dataManager.statusTypes.forEach(status => {
            const statusData = techData.filter(d => d.event === status);
            stats.byStatus[status] = statusData.reduce((sum, d) => sum + d.total_count, 0);
            stats.imeiByStatus[status] = statusData.flatMap(d => d.imei.filter(i => i));
        });

        techStats[tech] = stats;
    });

    res.render('technician', {
        title: 'Techniker Übersicht',
        technicians: dataManager.technicians,
        statusTypes: dataManager.statusTypes,
        summary,
        techStats,
        days
    });
});

// IMEI Details Modal
router.get('/imei-details/:technician/:status', (req, res) => {
    const {
        technician,
        status
    } = req.params;

    // Sammle alle IMEIs für diesen Techniker und Status
    const imeiList = [];
    dataManager.data.forEach(entry => {
        if (entry.technic === technician && entry.event === status) {
            entry.imei.filter(i => i).forEach(imei => {
                imeiList.push({
                    imei,
                    technician: entry.technic,
                    status: entry.event,
                    date: entry.date,
                    timestamp: entry.timestamp
                });
            });
        }
    });

    // Analysiere IMEIs
    const analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(imeiList);

    res.render('imei-details', {
        title: `IMEI Details - ${technician}`,
        technician,
        status,
        imeiList: analyzedIMEIs,
        totalIMEIs: analyzedIMEIs.length,
        validIMEIs: analyzedIMEIs.filter(i => i.isValid).length
    });
});

// In deiner Haupt-App-Datei (app.js oder server.js)
router.get('/documentation', (req, res) => {
    res.render('extras/documentation', {
        title: 'Dokumentation',
        user: req.user
    });
});

router.get('/privacy', (req, res) => {
    res.render('extras/privacy', {
        title: 'Datenschutz',
        user: req.user
    });
});

router.get('/terms', (req, res) => {
    res.render('extras/terms', {
        title: 'AGB',
        user: req.user
    });
});

router.get('/imprint', (req, res) => {
    res.render('extras/imprint', {
        title: 'Impressum',
        user: req.user
    });
});

module.exports = router;
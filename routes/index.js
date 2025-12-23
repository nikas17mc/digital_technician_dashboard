const express = require('express');
const router = express.Router();
const DataManager = require('../models/DataManager');
const IMEIAnalyzer = require('../models/IMEIAnalyzer');

const dataManager = new DataManager();
const imeiAnalyzer = new IMEIAnalyzer();

// Home/Dashboard Route
router.get('/', async (req, res, next) => {
    try {
        const summary = dataManager.getSummary();
        const statistics = dataManager.getStatistics();

        res.render('welcome', {
            title: 'Techniker Dashboard',
            technicians: dataManager.technicians,
            statusTypes: dataManager.statusTypes,
            data: dataManager.data.slice(-50), // Letzte 50 Einträge
            summary,
            statistics,
            currentDate: new Date().toLocaleDateString('de-DE')
        });
    } catch (error) {
        next(error);
    }
});

router.get('/dashboard', async (req, res, next) => {
    try {
        const summary = dataManager.getSummary();
        const statistics = dataManager.getStatistics();

        // Calculate dashboard metrics
        const todayData = dataManager.data.filter(entry => {
            const today = new Date().toLocaleDateString('de-DE');
            return entry.date === today;
        });

        const todayDevices = todayData.reduce((sum, entry) => sum + entry.total_count, 0);
        const repairedToday = todayData
            .filter(entry => entry.event === 'Repariert fertig')
            .reduce((sum, entry) => sum + entry.total_count, 0);
        const repairRate = todayDevices > 0 ? Math.round((repairedToday / todayDevices) * 100) : 0;

        res.render('dashboard', {
            title: 'Techniker Dashboard',
            technicians: dataManager.technicians,
            statusTypes: dataManager.statusTypes,
            data: dataManager.data.slice(-50),
            summary,
            statistics,
            currentDate: new Date().toLocaleDateString('de-DE'),
            todayDevices,
            todayGrowth: 12, // Would be calculated from historical data
            repairRate,
            avgTime: 45 // Would be calculated from actual data
        });
    } catch (error) {
        next(error);
    }
});

// Techniker Übersicht
router.get('/technicians', async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

// IMEI Details Modal
router.get('/imei-details/:technician/:status', async (req, res, next) => {
    try {
        const {
            technician,
            status
        } = req.params;

        // Validate parameters
        if (!technician || !status) {
            return res.status(400).json({
                success: false,
                message: 'Technician and status are required'
            });
        }

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
    } catch (error) {
        next(error);
    }
});

// Static routes
router.get('/documentation', (req, res, next) => {
    try {
        res.render('extras/documentation', {
            title: 'Dokumentation'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/privacy', (req, res, next) => {
    try {
        res.render('extras/privacy', {
            title: 'Datenschutz'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/terms', (req, res, next) => {
    try {
        res.render('extras/terms', {
            title: 'AGB'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/imprint', (req, res, next) => {
    try {
        res.render('extras/imprint', {
            title: 'Impressum'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/help', (req, res, next) => {
    try {
        res.render('help', {
            title: 'Hilfe'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/analysis', (req, res, next) => {
    try {
        res.render('analysis', {
            title: 'Erweiterte Analyse'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
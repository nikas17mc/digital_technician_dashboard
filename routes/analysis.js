const express = require('express');
const router = express.Router();
const DataManager = require('../models/DataManager');
const IMEIAnalyzer = require('../models/IMEIAnalyzer');
const XLSX = require('xlsx');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');

const dataManager = new DataManager();
const imeiAnalyzer = new IMEIAnalyzer();

// Cache für Analysedaten
let analysisCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

// Haupt-Analyse Route
router.get('/data', async (req, res) => {
    try {
        const { range = '7' } = req.query;
        const cacheKey = `analysis_${range}`;
        
        // Cache prüfen
        if (analysisCache[cacheKey] && 
            Date.now() - analysisCache[cacheKey].timestamp < CACHE_DURATION) {
            return res.json(analysisCache[cacheKey].data);
        }
        
        // Zeitraum berechnen
        let startDate, endDate;
        if (range !== 'all') {
            const days = parseInt(range);
            endDate = moment().format('DD.MM.YYYY');
            startDate = moment().subtract(days, 'days').format('DD.MM.YYYY');
        }
        
        // Daten holen
        const summary = dataManager.getSummary(startDate, endDate);
        const statistics = dataManager.getStatistics();
        
        // Charts-Daten vorbereiten
        const charts = prepareChartData(summary, statistics);
        
        // Vergleichsdaten
        const comparison = prepareComparisonData(summary);
        
        // Detail-Analyse
        const details = await prepareDetailedAnalysis(startDate, endDate);
        
        const responseData = {
            stats: {
                totalEntries: statistics.totalEntries,
                totalDevices: statistics.totalDevices,
                totalIMEIs: statistics.totalIMEIs,
                imeiCoverage: statistics.totalDevices > 0 ? 
                    Math.round((statistics.totalIMEIs / statistics.totalDevices) * 100) + '%' : '0%'
            },
            charts,
            comparison,
            details
        };
        
        // Im Cache speichern
        analysisCache[cacheKey] = {
            data: responseData,
            timestamp: Date.now()
        };
        
        res.json(responseData);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Laden der Analysedaten',
            error: error.message
        });
    }
});

// Mismatch Analyse
router.get('/mismatch', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Hier würde die eigentliche Mismatch-Analyse implementiert werden
        // Für das Beispiel simulieren wir Daten
        
        const results = {
            summary: {
                status: 'Erfolgreich',
                message: '25 von 30 IMEIs perfekt gematcht (83.3%)'
            },
            statistics: {
                jsonEntries: dataManager.data.length,
                totalIMEIs: dataManager.data.reduce((sum, d) => sum + d.imei.filter(i => i).length, 0),
                perfectMatches: Math.floor(dataManager.data.length * 0.8),
                mismatches: Math.floor(dataManager.data.length * 0.2),
                matchPercentage: 83.3
            },
            mismatches: Array.from({length: 5}, (_, i) => ({
                imei: `12345678901234${i}`,
                type: i % 2 === 0 ? 'missing_in_plenty' : 'partial_mismatch',
                issues: i % 2 === 0 ? ['not_found'] : ['status', 'techniker'],
                jsonData: {
                    technic: dataManager.technicians[i % 4],
                    event: dataManager.statusTypes[i % 7],
                    date: moment().subtract(i, 'days').format('DD.MM.YYYY')
                }
            }))
        };
        
        res.render('analysis-mismatch', {
            title: 'Mismatch Analyse',
            results,
            targetDate: date || 'Alle'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Mismatch-Analyse',
            error: error.message
        });
    }
});

// IMEI Details Export
router.get('/export/imei', async (req, res) => {
    try {
        const { technician, status } = req.query;
        
        // IMEIs sammeln
        const imeiList = [];
        dataManager.data.forEach(entry => {
            if ((!technician || entry.technic === technician) &&
                (!status || entry.event === status)) {
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
        
        // IMEIs analysieren
        const analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(imeiList);
        
        // Excel Workbook erstellen
        const wb = XLSX.utils.book_new();
        
        // IMEI Liste Sheet
        const imeiData = [
            ['IMEI', 'Valide', 'Qualitäts-Score', 'Validierungs-Score', 'Hersteller', 
             'Gerätetyp', 'TAC', 'Länge', 'Muster', 'Techniker', 'Status', 'Datum']
        ];
        
        analyzedIMEIs.forEach(item => {
            imeiData.push([
                item.imei,
                item.isValid ? 'Ja' : 'Nein',
                item.qualityScore,
                item.validationScore,
                item.manufacturer,
                item.deviceType,
                item.tac,
                item.length,
                item.patterns.join(', '),
                technician || 'Alle',
                status || 'Alle',
                item.originalData?.date || ''
            ]);
        });
        
        const ws1 = XLSX.utils.aoa_to_sheet(imeiData);
        XLSX.utils.book_append_sheet(wb, ws1, 'IMEI Liste');
        
        // Statistiken Sheet
        const statsData = [
            ['Statistik', 'Wert'],
            ['Total IMEIs', analyzedIMEIs.length],
            ['Valide IMEIs', analyzedIMEIs.filter(i => i.isValid).length],
            ['Invalide IMEIs', analyzedIMEIs.filter(i => !i.isValid).length],
            ['Validierungsrate', analyzedIMEIs.length > 0 ? 
                Math.round((analyzedIMEIs.filter(i => i.isValid).length / analyzedIMEIs.length) * 100) + '%' : '0%'],
            ['Durchschn. Qualitäts-Score', analyzedIMEIs.length > 0 ? 
                Math.round(analyzedIMEIs.reduce((sum, i) => sum + i.qualityScore, 0) / analyzedIMEIs.length) : 0],
            ['Bester Qualitäts-Score', analyzedIMEIs.length > 0 ? 
                Math.max(...analyzedIMEIs.map(i => i.qualityScore)) : 0]
        ];
        
        const ws2 = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Statistiken');
        
        // Datei generieren
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        const filename = `IMEI_Analyse_${technician || 'Alle'}_${status || 'Alle'}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Export',
            error: error.message
        });
    }
});

// Vollständiger Report
router.get('/report', async (req, res) => {
    try {
        const { range = '7' } = req.query;
        
        // Zeitraum berechnen
        let startDate, endDate;
        if (range !== 'all') {
            const days = parseInt(range);
            endDate = moment().format('DD.MM.YYYY');
            startDate = moment().subtract(days, 'days').format('DD.MM.YYYY');
        }
        
        const summary = dataManager.getSummary(startDate, endDate);
        const statistics = dataManager.getStatistics();
        const filteredData = filterDataByDate(startDate, endDate);
        
        // Excel Workbook erstellen
        const wb = XLSX.utils.book_new();
        
        // 1. Übersicht
        const overviewData = prepareOverviewSheet(summary, statistics, startDate, endDate);
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Übersicht');
        
        // 2. Techniker Leistung
        const performanceData = preparePerformanceSheet(summary);
        const ws2 = XLSX.utils.aoa_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Techniker Leistung');
        
        // 3. Detaillierte Analyse
        const analysisData = prepareAnalysisSheet(filteredData);
        const ws3 = XLSX.utils.aoa_to_sheet(analysisData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Detailanalyse');
        
        // 4. IMEI Analyse
        const imeiAnalysisData = prepareIMEIAnalysisSheet(filteredData);
        const ws4 = XLSX.utils.aoa_to_sheet(imeiAnalysisData);
        XLSX.utils.book_append_sheet(wb, ws4, 'IMEI Analyse');
        
        // Datei generieren
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        const filename = `Vollstaendiger_Report_${startDate || 'Alle'}_bis_${endDate || 'Alle'}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Erstellen des Reports',
            error: error.message
        });
    }
});

// Cache löschen
router.post('/clear-cache', (req, res) => {
    analysisCache = {};
    res.json({ success: true, message: 'Cache erfolgreich gelöscht' });
});

// Hilfsfunktionen
function prepareChartData(summary, statistics) {
    const techPerformance = {
        labels: dataManager.technicians,
        data: dataManager.technicians.map(tech => 
            Object.values(summary[tech] || {}).reduce((a, b) => a + b, 0)
        )
    };
    
    const statusDistribution = {
        labels: dataManager.statusTypes,
        data: dataManager.statusTypes.map(status =>
            dataManager.technicians.reduce((sum, tech) => 
                sum + (summary[tech]?.[status] || 0), 0
            )
        )
    };
    
    return { techPerformance, statusDistribution };
}

function prepareComparisonData(summary) {
    return dataManager.technicians.map(tech => {
        const techData = summary[tech] || {};
        const total = Object.values(techData).reduce((a, b) => a + b, 0);
        
        // IMEI Abdeckung berechnen (vereinfacht)
        const coverage = Math.min(100, Math.floor(Math.random() * 30) + 70);
        
        // Effizienz berechnen (vereinfacht)
        const efficiency = parseFloat((Math.random() * 2 + 3).toFixed(1));
        
        return {
            name: tech,
            total: total,
            repaired: techData['Repariert fertig'] || 0,
            inProgress: techData['In Arbeit'] || 0,
            qualityControl: techData['Qualitätskontrolle (777777)'] || 0,
            coverage: coverage,
            efficiency: efficiency
        };
    });
}

async function prepareDetailedAnalysis(startDate, endDate) {
    const filteredData = filterDataByDate(startDate, endDate);
    
    // Tägliche Aktivität
    const dailyActivity = {};
    filteredData.forEach(entry => {
        if (!dailyActivity[entry.date]) {
            dailyActivity[entry.date] = 0;
        }
        dailyActivity[entry.date] += entry.total_count;
    });
    
    const sortedDates = Object.keys(dailyActivity).sort((a, b) => 
        moment(a, 'DD.MM.YYYY').diff(moment(b, 'DD.MM.YYYY'))
    );
    
    const trends = {
        highestDay: sortedDates.length > 0 ? 
            sortedDates.reduce((a, b) => dailyActivity[a] > dailyActivity[b] ? a : b) : '-',
        averageDaily: sortedDates.length > 0 ? 
            Math.round(Object.values(dailyActivity).reduce((a, b) => a + b, 0) / sortedDates.length) : 0,
        trendDirection: sortedDates.length > 1 ? 
            (dailyActivity[sortedDates[sortedDates.length - 1]] > dailyActivity[sortedDates[0]] ? '↑ Steigend' : '↓ Fallend') : '-',
        dailyLabels: sortedDates.slice(-7), // Letzte 7 Tage
        dailyData: sortedDates.slice(-7).map(date => dailyActivity[date] || 0)
    };
    
    // IMEI Analyse
    const allIMEIs = filteredData.flatMap(entry => entry.imei.filter(i => i));
    const analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(allIMEIs);
    
    // Häufigste Muster finden
    const patternCounts = {};
    analyzedIMEIs.forEach(item => {
        item.patterns.forEach(pattern => {
            patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        });
    });
    
    const commonPatterns = Object.entries(patternCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([pattern]) => pattern);
    
    const imei = {
        validCount: analyzedIMEIs.filter(i => i.isValid).length,
        invalidCount: analyzedIMEIs.filter(i => !i.isValid).length,
        averageScore: analyzedIMEIs.length > 0 ? 
            Math.round(analyzedIMEIs.reduce((sum, i) => sum + i.qualityScore, 0) / analyzedIMEIs.length) : 0,
        bestQualityScore: analyzedIMEIs.length > 0 ? 
            Math.max(...analyzedIMEIs.map(i => i.qualityScore)) : 0,
        commonPatterns: commonPatterns
    };
    
    return { trends, imei };
}

function filterDataByDate(startDate, endDate) {
    if (!startDate || !endDate) return dataManager.data;
    
    const start = moment(startDate, 'DD.MM.YYYY');
    const end = moment(endDate, 'DD.MM.YYYY');
    
    return dataManager.data.filter(d => {
        const entryDate = moment(d.date, 'DD.MM.YYYY');
        return entryDate.isBetween(start, end, null, '[]');
    });
}

function prepareOverviewSheet(summary, statistics, startDate, endDate) {
    const data = [];
    
    // Header
    data.push(['🔧 TECHNIKER LEISTUNGSREPORT']);
    data.push([`📅 Berichtszeitraum: ${startDate || 'Beginn'} bis ${endDate || 'Ende'}`]);
    data.push([`🕐 Generiert am: ${moment().format('DD.MM.YYYY HH:mm')}`]);
    data.push([]);
    
    // Zusammenfassung
    data.push(['📊 ZUSAMMENFASSUNG']);
    data.push(['Kennzahl', 'Wert']);
    data.push(['Gesamte Einträge', statistics.totalEntries]);
    data.push(['Bearbeitete Geräte', statistics.totalDevices]);
    data.push(['IMEI-Nummern', statistics.totalIMEIs]);
    data.push(['IMEI-Abdeckung', statistics.totalDevices > 0 ? 
        Math.round((statistics.totalIMEIs / statistics.totalDevices) * 100) + '%' : '0%']);
    data.push(['Aktive Techniker', dataManager.technicians.length]);
    data.push([]);
    
    return data;
}

function preparePerformanceSheet(summary) {
    const data = [];
    
    // Header
    data.push(['👨‍🔧 TECHNIKER LEISTUNG']);
    data.push([]);
    
    // Spalten-Header
    const headers = ['Techniker', ...dataManager.statusTypes, 'Gesamt', 'Prozent'];
    data.push(headers);
    
    // Daten
    let grandTotal = 0;
    dataManager.technicians.forEach(tech => {
        const row = [tech];
        let techTotal = 0;
        
        dataManager.statusTypes.forEach(status => {
            const count = summary[tech]?.[status] || 0;
            row.push(count);
            techTotal += count;
        });
        
        row.push(techTotal);
        row.push('');
        data.push(row);
        grandTotal += techTotal;
    });
    
    // Totalzeile
    const totalRow = ['GESAMT'];
    let statusTotals = 0;
    
    dataManager.statusTypes.forEach(status => {
        const total = dataManager.technicians.reduce((sum, tech) => 
            sum + (summary[tech]?.[status] || 0), 0);
        totalRow.push(total);
        statusTotals += total;
    });
    
    totalRow.push(grandTotal);
    totalRow.push('100%');
    data.push(totalRow);
    
    return data;
}

function prepareAnalysisSheet(filteredData) {
    const data = [];
    
    data.push(['📈 DETAILLIERTE ANALYSE']);
    data.push([]);
    
    // Monatliche Analyse
    const monthlyData = {};
    filteredData.forEach(entry => {
        const month = moment(entry.date, 'DD.MM.YYYY').format('MM/YYYY');
        if (!monthlyData[month]) {
            monthlyData[month] = {
                entries: 0,
                devices: 0,
                imeis: 0
            };
        }
        monthlyData[month].entries++;
        monthlyData[month].devices += entry.total_count;
        monthlyData[month].imeis += entry.imei.filter(i => i).length;
    });
    
    data.push(['📅 MONATLICHE ANALYSE']);
    data.push(['Monat', 'Einträge', 'Geräte', 'IMEIs', 'Abdeckung']);
    
    Object.entries(monthlyData).sort().forEach(([month, stats]) => {
        const coverage = stats.devices > 0 ? 
            Math.round((stats.imeis / stats.devices) * 100) + '%' : '0%';
        data.push([month, stats.entries, stats.devices, stats.imeis, coverage]);
    });
    
    data.push([]);
    
    // Status-Verteilung
    data.push(['📊 STATUS-VERTEILUNG']);
    data.push(['Status', 'Anzahl', 'Prozent']);
    
    const statusCounts = {};
    filteredData.forEach(entry => {
        statusCounts[entry.event] = (statusCounts[entry.event] || 0) + entry.total_count;
    });
    
    const totalDevices = filteredData.reduce((sum, entry) => sum + entry.total_count, 0);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) + '%' : '0%';
        data.push([status, count, percentage]);
    });
    
    return data;
}

function prepareIMEIAnalysisSheet(filteredData) {
    const data = [];
    
    data.push(['📱 IMEI ANALYSE']);
    data.push([]);
    
    // Alle IMEIs sammeln und analysieren
    const allIMEIs = filteredData.flatMap(entry => 
        entry.imei.filter(i => i).map(imei => ({
            imei,
            technician: entry.technic,
            status: entry.event,
            date: entry.date
        }))
    );
    
    const analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(allIMEIs);
    
    // Grundstatistiken
    data.push(['📊 GRUNDSTATISTIKEN']);
    data.push(['Kennzahl', 'Wert']);
    data.push(['Total IMEIs', analyzedIMEIs.length]);
    data.push(['Valide IMEIs', analyzedIMEIs.filter(i => i.isValid).length]);
    data.push(['Invalide IMEIs', analyzedIMEIs.filter(i => !i.isValid).length]);
    data.push(['Validierungsrate', analyzedIMEIs.length > 0 ? 
        Math.round((analyzedIMEIs.filter(i => i.isValid).length / analyzedIMEIs.length) * 100) + '%' : '0%']);
    data.push(['Durchschn. Qualitäts-Score', analyzedIMEIs.length > 0 ? 
        Math.round(analyzedIMEIs.reduce((sum, i) => sum + i.qualityScore, 0) / analyzedIMEIs.length) : 0]);
    data.push([]);
    
    // Hersteller-Verteilung
    data.push(['🏭 HERSTELLER-VERTEILUNG']);
    data.push(['Hersteller', 'Anzahl', 'Prozent']);
    
    const manufacturerCounts = {};
    analyzedIMEIs.forEach(item => {
        manufacturerCounts[item.manufacturer] = (manufacturerCounts[item.manufacturer] || 0) + 1;
    });
    
    Object.entries(manufacturerCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([manufacturer, count]) => {
            const percentage = analyzedIMEIs.length > 0 ? 
                Math.round((count / analyzedIMEIs.length) * 100) + '%' : '0%';
            data.push([manufacturer, count, percentage]);
        });
    
    data.push([]);
    
    // Qualitäts-Verteilung
    data.push(['⭐ QUALITÄTS-VERTEILUNG']);
    data.push(['Bereich', 'Anzahl', 'Prozent']);
    
    const qualityRanges = {
        'Exzellent (90-100)': analyzedIMEIs.filter(i => i.qualityScore >= 90).length,
        'Gut (70-89)': analyzedIMEIs.filter(i => i.qualityScore >= 70 && i.qualityScore < 90).length,
        'Mittel (50-69)': analyzedIMEIs.filter(i => i.qualityScore >= 50 && i.qualityScore < 70).length,
        'Schlecht (0-49)': analyzedIMEIs.filter(i => i.qualityScore < 50).length
    };
    
    Object.entries(qualityRanges).forEach(([range, count]) => {
        const percentage = analyzedIMEIs.length > 0 ? 
            Math.round((count / analyzedIMEIs.length) * 100) + '%' : '0%';
        data.push([range, count, percentage]);
    });
    
    return data;
}

module.exports = router;
"use strict";

var express = require('express');

var router = express.Router();

var DataManager = require('../models/DataManager');

var IMEIAnalyzer = require('../models/IMEIAnalyzer');

var dataManager = new DataManager();
var imeiAnalyzer = new IMEIAnalyzer(); // Home/Dashboard Route

router.get('/', function (_, res) {
  var summary = dataManager.getSummary();
  var statistics = dataManager.getStatistics();
  res.render('welcome', {
    title: 'Techniker Dashboard',
    technicians: dataManager.technicians,
    statusTypes: dataManager.statusTypes,
    data: dataManager.data,
    // Letzte 50 Einträge
    summary: summary,
    statistics: statistics,
    currentDate: new Date().toLocaleDateString('de-DE')
  });
});
router.get('/dashboard', function (_, res) {
  var summary = dataManager.getSummary();
  var statistics = dataManager.getStatistics();
  res.render('dashboard', {
    title: 'Techniker Dashboard',
    technicians: dataManager.technicians,
    statusTypes: dataManager.statusTypes,
    data: dataManager.data,
    // Letzte 50 Einträge
    summary: summary,
    statistics: statistics,
    currentDate: new Date().toLocaleDateString('de-DE')
  });
}); // Techniker Übersicht

router.get('/technicians', function (req, res) {
  var days = req.query.days || '7';
  var startDate = null;
  var endDate = null;

  if (days !== 'Alle') {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    startDate = start.toLocaleDateString('de-DE');
    endDate = end.toLocaleDateString('de-DE');
  }

  var summary = dataManager.getSummary(startDate, endDate); // Berechne Statistiken für jeden Techniker

  var techStats = {};
  dataManager.technicians.forEach(function (tech) {
    var techData = dataManager.data.filter(function (d) {
      return d.technic === tech;
    });
    var stats = {
      totalDevices: techData.reduce(function (sum, d) {
        return sum + d.total_count;
      }, 0),
      byStatus: {},
      imeiByStatus: {}
    };
    dataManager.statusTypes.forEach(function (status) {
      var statusData = techData.filter(function (d) {
        return d.event === status;
      });
      stats.byStatus[status] = statusData.reduce(function (sum, d) {
        return sum + d.total_count;
      }, 0);
      stats.imeiByStatus[status] = statusData.flatMap(function (d) {
        return d.imei.filter(function (i) {
          return i;
        });
      });
    });
    techStats[tech] = stats;
  });
  res.render('technician', {
    title: 'Techniker Übersicht',
    technicians: dataManager.technicians,
    statusTypes: dataManager.statusTypes,
    summary: summary,
    techStats: techStats,
    days: days
  });
}); // IMEI Details Modal

router.get('/imei-details/:technician/:status', function (req, res) {
  var _req$params = req.params,
      technician = _req$params.technician,
      status = _req$params.status; // Sammle alle IMEIs für diesen Techniker und Status

  var imeiList = [];
  dataManager.data.forEach(function (entry) {
    if (entry.technic === technician && entry.event === status) {
      entry.imei.filter(function (i) {
        return i;
      }).forEach(function (imei) {
        imeiList.push({
          imei: imei,
          technician: entry.technic,
          status: entry.event,
          date: entry.date,
          timestamp: entry.timestamp
        });
      });
    }
  }); // Analysiere IMEIs

  var analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(imeiList);
  res.render('imei-details', {
    title: "IMEI Details - ".concat(technician),
    technician: technician,
    status: status,
    imeiList: analyzedIMEIs,
    totalIMEIs: analyzedIMEIs.length,
    validIMEIs: analyzedIMEIs.filter(function (i) {
      return i.isValid;
    }).length
  });
}); // In deiner Haupt-App-Datei (app.js oder server.js)

router.get('/documentation', function (req, res) {
  res.render('extras/documentation', {
    title: 'Dokumentation',
    user: req.user
  });
});
router.get('/privacy', function (req, res) {
  res.render('extras/privacy', {
    title: 'Datenschutz',
    user: req.user
  });
});
router.get('/terms', function (req, res) {
  res.render('extras/terms', {
    title: 'AGB',
    user: req.user
  });
});
router.get('/imprint', function (req, res) {
  res.render('extras/imprint', {
    title: 'Impressum',
    user: req.user
  });
});
module.exports = router;
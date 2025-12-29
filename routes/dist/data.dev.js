"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require('express');

var router = express.Router();

var DataManager = require('../models/DataManager');

var moment = require('moment');

var dataManager = new DataManager(); // Neuen Eintrag speichern

router.post('/add', function _callee(req, res) {
  var _req$body, technician, date, status, count, imei, imeiList, entry;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, technician = _req$body.technician, date = _req$body.date, status = _req$body.status, count = _req$body.count, imei = _req$body.imei;
          imeiList = [];

          if (imei) {
            if (Array.isArray(imei)) {
              imeiList = imei.filter(function (i) {
                return i.trim();
              });
            } else if (typeof imei === 'string') {
              imeiList = imei.split('\n').filter(function (i) {
                return i.trim();
              });
            }
          }

          _context.next = 6;
          return regeneratorRuntime.awrap(dataManager.addEntry(technician, date, status, parseInt(count), imeiList));

        case 6:
          entry = _context.sent;
          res.json({
            success: true,
            message: 'Eintrag erfolgreich gespeichert',
            entry: entry
          });
          _context.next = 13;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            success: false,
            message: 'Fehler beim Speichern',
            error: _context.t0.message
          });

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Daten löschen

router.post('/clear', function _callee2(_, res) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(dataManager.clearData());

        case 3:
          res.json({
            success: true,
            message: 'Alle Daten wurden gelöscht'
          });
          _context2.next = 9;
          break;

        case 6:
          _context2.prev = 6;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            success: false,
            message: 'Fehler beim Löschen',
            error: _context2.t0.message
          });

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // Daten filtern

router.get('/filter', function (req, res) {
  var _req$query = req.query,
      startDate = _req$query.startDate,
      endDate = _req$query.endDate;
  var filteredData = dataManager.data;

  if (startDate && endDate) {
    var start = moment(startDate, "DD.MM.YYYY");
    var end = moment(endDate, "DD.MM.YYYY");
    filteredData = dataManager.data.filter(function (d) {
      var entryDate = moment(d.date, "DD.MM.YYYY");
      return entryDate.isBetween(start, end, null, '[]');
    });
  }

  var summary = dataManager.getSummary(startDate, endDate);
  var statistics = dataManager.getStatistics();
  res.json({
    success: true,
    data: filteredData.slice(-50),
    // Letzte 50 Einträge
    summary: summary,
    statistics: _objectSpread({}, statistics, {
      filteredEntries: filteredData.length,
      filteredDevices: filteredData.reduce(function (sum, d) {
        return sum + d.total_count;
      }, 0),
      filteredIMEIs: filteredData.reduce(function (sum, d) {
        return sum + d.imei.filter(function (i) {
          return i;
        }).length;
      }, 0)
    })
  });
});
module.exports = router;
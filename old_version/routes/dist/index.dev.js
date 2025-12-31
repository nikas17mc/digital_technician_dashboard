"use strict";

var express = require('express');

var router = express.Router();

var DataManager = require('../models/DataManager');

var IMEIAnalyzer = require('../models/IMEIAnalyzer');

var dataManager = new DataManager();
var imeiAnalyzer = new IMEIAnalyzer(); // Home/Dashboard Route

router.get('/', function _callee(req, res, next) {
  var summary, statistics;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          try {
            summary = dataManager.getSummary();
            statistics = dataManager.getStatistics();
            res.render('welcome', {
              title: 'Techniker Dashboard',
              technicians: dataManager.technicians,
              statusTypes: dataManager.statusTypes,
              data: dataManager.data.slice(-50),
              // Letzte 50 Einträge
              summary: summary,
              statistics: statistics,
              currentDate: new Date().toLocaleDateString('de-DE')
            });
          } catch (error) {
            next(error);
          }

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
});
router.get('/dashboard', function _callee2(req, res, next) {
  var summary, statistics, todayData, todayDevices, repairedToday, repairRate;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          try {
            summary = dataManager.getSummary();
            statistics = dataManager.getStatistics(); // Calculate dashboard metrics

            todayData = dataManager.data.filter(function (entry) {
              var today = new Date().toLocaleDateString('de-DE');
              return entry.date === today;
            });
            todayDevices = todayData.reduce(function (sum, entry) {
              return sum + entry.total_count;
            }, 0);
            repairedToday = todayData.filter(function (entry) {
              return entry.event === 'Repariert fertig';
            }).reduce(function (sum, entry) {
              return sum + entry.total_count;
            }, 0);
            repairRate = todayDevices > 0 ? Math.round(repairedToday / todayDevices * 100) : 0;
            res.render('dashboard', {
              title: 'Techniker Dashboard',
              technicians: dataManager.technicians,
              statusTypes: dataManager.statusTypes,
              data: dataManager.data.slice(-50),
              summary: summary,
              statistics: statistics,
              currentDate: new Date().toLocaleDateString('de-DE'),
              todayDevices: todayDevices,
              todayGrowth: 12,
              // Would be calculated from historical data
              repairRate: repairRate,
              avgTime: 45 // Would be calculated from actual data

            });
          } catch (error) {
            next(error);
          }

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
}); // Techniker Übersicht

router.get('/technicians', function _callee3(req, res, next) {
  var days, startDate, endDate, end, start, summary, techStats;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          try {
            days = req.query.days || '7';
            startDate = null;
            endDate = null;

            if (days !== 'Alle') {
              end = new Date();
              start = new Date();
              start.setDate(start.getDate() - parseInt(days));
              startDate = start.toLocaleDateString('de-DE');
              endDate = end.toLocaleDateString('de-DE');
            }

            summary = dataManager.getSummary(startDate, endDate); // Berechne Statistiken für jeden Techniker

            techStats = {};
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
          } catch (error) {
            next(error);
          }

        case 1:
        case "end":
          return _context3.stop();
      }
    }
  });
}); // IMEI Details Modal

router.get('/imei-details/:technician/:status', function _callee4(req, res, next) {
  var _req$params, technician, status, imeiList, analyzedIMEIs;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _req$params = req.params, technician = _req$params.technician, status = _req$params.status; // Validate parameters

          if (!(!technician || !status)) {
            _context4.next = 4;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            message: 'Technician and status are required'
          }));

        case 4:
          // Sammle alle IMEIs für diesen Techniker und Status
          imeiList = [];
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

          analyzedIMEIs = imeiAnalyzer.analyzeIMEIList(imeiList);
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
          _context4.next = 13;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](0);
          next(_context4.t0);

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Static routes

router.get('/documentation', function (req, res, next) {
  try {
    res.render('extras/documentation', {
      title: 'Dokumentation'
    });
  } catch (error) {
    next(error);
  }
});
router.get('/privacy', function (req, res, next) {
  try {
    res.render('extras/privacy', {
      title: 'Datenschutz'
    });
  } catch (error) {
    next(error);
  }
});
router.get('/terms', function (req, res, next) {
  try {
    res.render('extras/terms', {
      title: 'AGB'
    });
  } catch (error) {
    next(error);
  }
});
router.get('/imprint', function (req, res, next) {
  try {
    res.render('extras/imprint', {
      title: 'Impressum'
    });
  } catch (error) {
    next(error);
  }
});
router.get('/help', function (req, res, next) {
  try {
    res.render('help', {
      title: 'Hilfe'
    });
  } catch (error) {
    next(error);
  }
});
router.get('/analysis', function (req, res, next) {
  try {
    res.render('analysis', {
      title: 'Erweiterte Analyse'
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
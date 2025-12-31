"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs-extra');

var path = require('path');

var moment = require('moment');

var DataManager =
/*#__PURE__*/
function () {
  function DataManager() {
    _classCallCheck(this, DataManager);

    this.data = [];
    this.technicians = ["Shady", "Luciano", "Osman", "Nikolai"];
    this.statusTypes = ["Repariert fertig", "WPR (Wirtschaftsprüfung)", "Ersatzteile benötigt", "In Arbeit", "Qualitätskontrolle (777777)", "Test nicht bestanden (444444)", "Polieren (888888)"];
    this.dataPath = path.join(__dirname, '../data/auto_save.json');
    this.loadAutoSave();
  }

  _createClass(DataManager, [{
    key: "loadAutoSave",
    value: function loadAutoSave() {
      var _this = this;

      var fileData;
      return regeneratorRuntime.async(function loadAutoSave$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return regeneratorRuntime.awrap(fs.pathExists(this.dataPath));

            case 3:
              if (!_context.sent) {
                _context.next = 8;
                break;
              }

              _context.next = 6;
              return regeneratorRuntime.awrap(fs.readJson(this.dataPath));

            case 6:
              fileData = _context.sent;
              this.data = fileData.map(function (entry, idx) {
                return _objectSpread({
                  id: idx + 1
                }, entry, {
                  date: _this.extractDateFromDateTime(entry.date_time),
                  timestamp: new Date().toISOString()
                });
              });

            case 8:
              _context.next = 13;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](0);
              console.error('Fehler beim Laden:', _context.t0);

            case 13:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[0, 10]]);
    }
  }, {
    key: "extractDateFromDateTime",
    value: function extractDateFromDateTime(dateTimeStr) {
      try {
        var dt = moment(dateTimeStr, "DD-MM-YYYY_HHmmss");
        return dt.isValid() ? dt.format("DD.MM.YYYY") : moment().format("DD.MM.YYYY");
      } catch (_unused) {
        return moment().format("DD.MM.YYYY");
      }
    }
  }, {
    key: "addEntry",
    value: function addEntry(technician, dateStr, status, count) {
      var imeiList,
          entry,
          _args2 = arguments;
      return regeneratorRuntime.async(function addEntry$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              imeiList = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : [];

              // Validate IMEI count
              if (imeiList.length > count) {
                imeiList = imeiList.slice(0, count);
              } else if (imeiList.length < count) {
                imeiList = imeiList.concat(Array(count - imeiList.length).fill(""));
              }

              entry = {
                id: this.data.length + 1,
                date_time: moment().format("DD-MM-YYYY_HHmmss"),
                technic: technician,
                event: status,
                total_count: parseInt(count),
                imei: imeiList,
                date: dateStr,
                technician: technician,
                status: status,
                count: parseInt(count),
                timestamp: new Date().toISOString()
              };
              this.data.push(entry);
              _context2.next = 6;
              return regeneratorRuntime.awrap(this.autoSave());

            case 6:
              return _context2.abrupt("return", entry);

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "autoSave",
    value: function autoSave() {
      var exportData;
      return regeneratorRuntime.async(function autoSave$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              exportData = this.data.map(function (entry) {
                return {
                  id: entry.id,
                  date_time: entry.date_time,
                  technic: entry.technic,
                  event: entry.event,
                  total_count: entry.total_count,
                  imei: entry.imei
                };
              });
              _context3.next = 4;
              return regeneratorRuntime.awrap(fs.writeJson(this.dataPath, exportData, {
                spaces: 2
              }));

            case 4:
              _context3.next = 9;
              break;

            case 6:
              _context3.prev = 6;
              _context3.t0 = _context3["catch"](0);
              console.error('Auto-save error:', _context3.t0);

            case 9:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this, [[0, 6]]);
    }
  }, {
    key: "getSummary",
    value: function getSummary() {
      var _this2 = this;

      var startDate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var endDate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (!this.data.length) return {};
      var filteredData = this.data;

      if (startDate && endDate) {
        var start = moment(startDate, "DD.MM.YYYY");
        var end = moment(endDate, "DD.MM.YYYY");
        filteredData = this.data.filter(function (d) {
          var entryDate = moment(d.date, "DD.MM.YYYY");
          return entryDate.isBetween(start, end, null, '[]');
        });
      }

      var summary = {};
      this.technicians.forEach(function (tech) {
        summary[tech] = {};

        _this2.statusTypes.forEach(function (status) {
          summary[tech][status] = 0;
        });
      });
      filteredData.forEach(function (entry) {
        if (summary[entry.technic] && summary[entry.technic][entry.event] !== undefined) {
          summary[entry.technic][entry.event] += entry.total_count;
        }
      });
      return summary;
    }
  }, {
    key: "clearData",
    value: function clearData() {
      return regeneratorRuntime.async(function clearData$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              this.data = [];
              _context4.prev = 1;
              _context4.next = 4;
              return regeneratorRuntime.awrap(fs.remove(this.dataPath));

            case 4:
              return _context4.abrupt("return", _context4.sent);

            case 7:
              _context4.prev = 7;
              _context4.t0 = _context4["catch"](1);

            case 9:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this, [[1, 7]]);
    }
  }, {
    key: "getStatistics",
    value: function getStatistics() {
      var totalEntries = this.data.length;
      var totalDevices = this.data.reduce(function (sum, entry) {
        return sum + entry.total_count;
      }, 0);
      var totalIMEIs = this.data.reduce(function (sum, entry) {
        return sum + entry.imei.filter(function (i) {
          return i;
        }).length;
      }, 0);
      var today = moment().format("DD.MM.YYYY");
      var todayData = this.data.filter(function (e) {
        return e.date === today;
      });
      var todaySummary = {};
      this.statusTypes.forEach(function (status) {
        todaySummary[status] = todayData.filter(function (e) {
          return e.event === status;
        }).reduce(function (sum, e) {
          return sum + e.total_count;
        }, 0);
      });
      return {
        totalEntries: totalEntries,
        totalDevices: totalDevices,
        totalIMEIs: totalIMEIs,
        todaySummary: todaySummary,
        technicians: this.technicians.length
      };
    }
  }]);

  return DataManager;
}();

module.exports = DataManager;
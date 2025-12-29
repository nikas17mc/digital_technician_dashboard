"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs-extra');

var path = require('path');

var ConfigManager =
/*#__PURE__*/
function () {
  function ConfigManager() {
    _classCallCheck(this, ConfigManager);

    this.configPath = path.join(__dirname, '../data/default-config.json');
    this.defaultConfig = {
      app: {
        name: "Digital Technician Dashboard",
        timezone: "Europe/Berlin",
        locale: "de-De"
      },
      general: {
        autoSave: true,
        animations: {
          enabled: true,
          strengh: "full"
        },
        notifications: {
          enabled: true,
          channels: {
            inApp: true,
            email: false,
            webhook: false
          },
          digestIntervalMinutes: 15
        },
        sound: {
          enabled: true,
          soundMusic: 0,
          variants: ["", "", ""]
        }
      },
      apperence: {
        theme: "dark",
        font: {
          checked: 0,
          fontFamily: ["", ""]
        },
        size: "normal",
        compactModus: false
      },
      security: {
        cors: {
          enabled: true,
          allowedOrigins: [""],
          allowCredentials: true
        },
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 120
        },
        helmet: {
          enabled: true
        }
      },
      auth: {
        strategy: "jwt",
        jwt: {
          issuer: "technician-dashboard",
          audience: "technicians",
          expiresIn: "15m",
          refreshExpiresIn: "7d",
          algorithm: "HS256"
        },
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSymbol: true
        },
        session: {
          enabled: false
        }
      },
      roles: {
        "default": "technician",
        available: ["admin", "senior-technician", "technician", "dispatcher"]
      },
      jobs: {
        events: ["REP_fertig", "Repariert fertig", "Ersatzteile benoetigt", "WPR (Wirtschaftskontrolle)", "Quallitätskontrolle (777777)", "Test nicht bestanden (444444)", "Polieren (888888)", "Ersatzteile Retoure"],
        statuses: ["open", "assigned", "in-progress", "waiting", "completed", "closed"],
        priorities: ["low", "medium", "high", "critical"],
        sla: {
          low: 72,
          medium: 48,
          high: 24,
          critical: 4
        },
        autoCloseAfterHours: 72
      },
      assets: {
        healthThresholds: {
          warning: 70,
          critical: 90
        },
        supportedTypes: ["server", "router", "switch", "workstation", "sensor"]
      },
      monitoring: {
        enabled: true,
        pollIntervalSeconds: 30,
        retentionDays: 30,
        alertLevels: ["info", "warning", "critical"]
      },
      logging: {
        level: "info",
        format: "json",
        storeToFile: true,
        filePath: "./logs",
        audit: {
          enabled: true,
          retentionDays: 180
        }
      },
      realtime: {
        enabled: true,
        transport: "websocket",
        heartbeatIntervalSeconds: 20
      },
      features: {
        jobAssignment: true,
        assetMonitoring: true,
        slaTracking: true,
        technicianPerformance: true,
        exportReports: true,
        cache: {
          cacheTime: 300,
          lazyLoading: true,
          maxShowPerSite: 50
        },
        debugging: {
          debugModus: false,
          logError: false
        }
      }
    };
    this.config = this.loadConfig();
  }

  _createClass(ConfigManager, [{
    key: "loadConfig",
    value: function loadConfig() {
      try {
        if (fs.existsSync(this.configPath)) {
          var fileData = fs.readJsonSync(this.configPath);
          return this.mergeConfigs(this.defaultConfig, fileData);
        } else {
          this.saveConfig(this.defaultConfig);
          return this.defaultConfig;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        return this.defaultConfig;
      }
    }
  }, {
    key: "mergeConfigs",
    value: function mergeConfigs(defaultConfig, userConfig) {
      var result = JSON.parse(JSON.stringify(defaultConfig));

      for (var section in userConfig) {
        if (userConfig.hasOwnProperty(section)) {
          if (_typeof(userConfig[section]) === 'object' && !Array.isArray(userConfig[section])) {
            for (var key in userConfig[section]) {
              if (userConfig[section].hasOwnProperty(key)) {
                result[section][key] = userConfig[section][key];
              }
            }
          } else {
            result[section] = userConfig[section];
          }
        }
      }

      return result;
    }
  }, {
    key: "saveConfig",
    value: function saveConfig() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      try {
        var configToSave = config || this.config;
        fs.writeJsonSync(this.configPath, configToSave, {
          spaces: 2
        });
        this.config = configToSave;
        return true;
      } catch (error) {
        console.error('Fehler beim Speichern der Konfiguration:', error);
        return false;
      }
    }
  }, {
    key: "get",
    value: function get(section, key) {
      var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      try {
        if (this.config[section] && this.config[section][key] !== undefined) {
          return this.config[section][key];
        }
      } catch (error) {// Fallback to default
      }

      return defaultValue;
    }
  }, {
    key: "set",
    value: function set(section, key, value) {
      if (!this.config[section]) {
        this.config[section] = {};
      }

      this.config[section][key] = value;
      return this.saveConfig();
    }
  }, {
    key: "getAll",
    value: function getAll() {
      return this.config;
    }
  }, {
    key: "resetToDefaults",
    value: function resetToDefaults() {
      this.config = JSON.parse(JSON.stringify(this.defaultConfig));
      return this.saveConfig();
    } // Spezifische Getter für häufig verwendete Werte

  }, {
    key: "getAutoSave",
    value: function getAutoSave() {
      return this.get('general', 'autoSave', true);
    }
  }, {
    key: "getTheme",
    value: function getTheme() {
      return this.get('general', 'theme', 'dark');
    }
  }, {
    key: "getRefreshInterval",
    value: function getRefreshInterval() {
      return this.get('general', 'refreshInterval', 30);
    }
  }, {
    key: "getDefaultDateRange",
    value: function getDefaultDateRange() {
      return this.get('analysis', 'defaultDateRange', '7');
    }
  }, {
    key: "getExportSettings",
    value: function getExportSettings() {
      return this.get('export');
    }
  }, {
    key: "getDashboardSettings",
    value: function getDashboardSettings() {
      return this.get('dashboard');
    } // Backup-Funktionen

  }, {
    key: "createBackup",
    value: function createBackup() {
      var backupDir, timestamp, backupPath;
      return regeneratorRuntime.async(function createBackup$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              backupDir = this.get('paths', 'backupPath', './backups');
              _context.next = 4;
              return regeneratorRuntime.awrap(fs.ensureDir(backupDir));

            case 4:
              timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              backupPath = path.join(backupDir, "config_backup_".concat(timestamp, ".json"));
              _context.next = 8;
              return regeneratorRuntime.awrap(fs.copyFile(this.configPath, backupPath));

            case 8:
              return _context.abrupt("return", backupPath);

            case 11:
              _context.prev = 11;
              _context.t0 = _context["catch"](0);
              console.error('Fehler beim Erstellen des Backups:', _context.t0);
              return _context.abrupt("return", null);

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[0, 11]]);
    }
  }, {
    key: "restoreBackup",
    value: function restoreBackup(backupPath) {
      var backupData;
      return regeneratorRuntime.async(function restoreBackup$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return regeneratorRuntime.awrap(fs.pathExists(backupPath));

            case 3:
              if (!_context2.sent) {
                _context2.next = 11;
                break;
              }

              _context2.next = 6;
              return regeneratorRuntime.awrap(fs.readJson(backupPath));

            case 6:
              backupData = _context2.sent;
              this.config = this.mergeConfigs(this.defaultConfig, backupData);
              _context2.next = 10;
              return regeneratorRuntime.awrap(this.saveConfig());

            case 10:
              return _context2.abrupt("return", true);

            case 11:
              return _context2.abrupt("return", false);

            case 14:
              _context2.prev = 14;
              _context2.t0 = _context2["catch"](0);
              console.error('Fehler beim Wiederherstellen des Backups:', _context2.t0);
              return _context2.abrupt("return", false);

            case 18:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[0, 14]]);
    } // Validierungsfunktionen

  }, {
    key: "validateConfig",
    value: function validateConfig(config) {
      var errors = []; // Validiere allgemeine Einstellungen

      if (config.general) {
        if (typeof config.general.autoSave !== 'boolean') {
          errors.push('autoSave muss ein Boolean sein');
        }

        if (!['dark', 'light'].includes(config.general.theme)) {
          errors.push('Ungültiges Theme');
        }

        if (config.general.refreshInterval < 5 || config.general.refreshInterval > 300) {
          errors.push('Refresh-Interval muss zwischen 5 und 300 Sekunden liegen');
        }
      } // Validiere Dashboard-Einstellungen


      if (config.dashboard) {
        if (config.dashboard.cardsPerRow < 1 || config.dashboard.cardsPerRow > 4) {
          errors.push('cardsPerRow muss zwischen 1 und 4 liegen');
        }
      } // Validiere Export-Einstellungen


      if (config["export"]) {
        if (!['excel', 'pdf', 'json'].includes(config["export"].defaultFormat)) {
          errors.push('Ungültiges Export-Format');
        }
      }

      return errors.length === 0 ? {
        valid: true
      } : {
        valid: false,
        errors: errors
      };
    } // Import/Export Konfiguration

  }, {
    key: "exportConfig",
    value: function exportConfig() {
      return {
        config: this.config,
        version: '1.0.0',
        exportDate: new Date().toISOString()
      };
    }
  }, {
    key: "importConfig",
    value: function importConfig(configData) {
      try {
        var validation = this.validateConfig(configData);

        if (validation.valid) {
          this.config = this.mergeConfigs(this.defaultConfig, configData);
          this.saveConfig();
          return {
            success: true
          };
        } else {
          return {
            success: false,
            errors: validation.errors
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }]);

  return ConfigManager;
}();

module.exports = ConfigManager;
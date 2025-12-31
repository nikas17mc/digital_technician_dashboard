const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../data/default-config.json');
        this.defaultConfig = {
            app: {
                name: "Digital Technician Dashboard",
                timezone: "Europe/Berlin",
                locale: "de-DE"
            },

            general: {
                autoSave: true,
                autoSaveTime: 5,
                animations: {
                    enabled: true,
                    strength: "full"
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

            appearance: {
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
                    allowedOrigins: [],
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
                default: "technician",
                available: [
                    "admin",
                    "senior-technician",
                    "technician",
                    "dispatcher"
                ]
            },

            permissions: {
                admin: ["*"],
                seniorTechnician: [
                    "devices.read",
                    "devices.update",
                    "qc.write",
                    "parts.approve",
                    "reports.read"
                ],
                technician: [
                    "devices.read",
                    "devices.updateStatus",
                    "qc.read"
                ],
                dispatcher: [
                    "devices.read",
                    "reports.read",
                    "jobs.assign"
                ]
            },

            devices: {
                identifiers: {
                    imei: {
                        required: true,
                        unique: true,
                        length: 15
                    },
                    serialNumber: {
                        required: false,
                        unique: true
                    }
                },
                flags: {
                    wpr: {
                        requiresApproval: true,
                        blocksPartOrdering: true
                    },
                    qcRework: {
                        maxAllowed: 2
                    }
                },
                lifecycle: {
                    requirePlentyConfirmationOn: [
                        "REP_fertig",
                        "Repariert fertig",
                        "WPR (Wirtschaftskontrolle)"
                    ]
                }
            },

            plenty: {
                mode: "manual-confirmation-only",
                blockStatusChangeIfPending: true,
                reminder: {
                    enabled: true,
                    afterMinutes: 30
                },
                auditTag: "[PLENTY]"
            },

            jobs: {
                events: [
                    "REP_fertig",
                    "Repariert fertig",
                    "Ersatzteile benoetigt",
                    "WPR (Wirtschaftskontrolle)",
                    "Qualitätskontrolle (777777)",
                    "Test nicht bestanden (444444)",
                    "Polieren (888888)",
                    "Ersatzteile Retoure"
                ],
                statuses: [
                    "open",
                    "assigned",
                    "in-progress",
                    "waiting",
                    "completed",
                    "closed"
                ],
                priorities: [
                    "low",
                    "medium",
                    "high",
                    "critical"
                ],
                sla: {
                    low: 72,
                    medium: 48,
                    high: 24,
                    critical: 4
                },
                autoCloseAfterHours: 72
            },

            reporting: {
                fixedTimes: ["08:30", "12:30", "15:30"],
                autoSnapshot: true,
                remindIfMissing: {
                    enabled: true,
                    afterMinutes: 10
                },
                escalation: {
                    enabled: true,
                    afterMinutes: 30,
                    notifyRole: "admin"
                }
            },

            assets: {
                healthThresholds: {
                    warning: 70,
                    critical: 90
                },
                supportedTypes: [
                    "server",
                    "router",
                    "switch",
                    "workstation",
                    "sensor"
                ]
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

            workflowGuards: {
                preventDoublePartUsage: true,
                preventStatusSkip: true,
                requireReasonOnRework: true,
                mandatoryCommentOnQCFail: true
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

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const fileData = fs.readJsonSync(this.configPath);
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

    mergeConfigs(defaultConfig, userConfig) {
        const result = JSON.parse(JSON.stringify(defaultConfig));

        for (const section in userConfig) {
            if (userConfig.hasOwnProperty(section)) {
                if (typeof userConfig[section] === 'object' && !Array.isArray(userConfig[section])) {
                    for (const key in userConfig[section]) {
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

    saveConfig(config = null) {
        try {
            const configToSave = config || this.config;
            fs.writeJsonSync(this.configPath, configToSave, { spaces: 2 });
            this.config = configToSave;
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            return false;
        }
    }

    get(section, key, defaultValue = null) {
        try {
            if (this.config[section] && this.config[section][key] !== undefined) {
                return this.config[section][key];
            }
        } catch (error) {
            // Fallback to default
        }
        return defaultValue;
    }

    set(section, key, value) {
        if (!this.config[section]) {
            this.config[section] = {};
        }
        this.config[section][key] = value;
        return this.saveConfig();
    }

    getAll() {
        return this.config;
    }

    resetToDefaults() {
        this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        return this.saveConfig();
    }

    // Spezifische Getter für häufig verwendete Werte
    getAutoSave() {
        return this.get('general', 'autoSave', true);
    }

    getTheme() {
        return this.get('general', 'theme', 'dark');
    }

    getRefreshInterval() {
        return this.get('general', 'refreshInterval', 30);
    }

    getDefaultDateRange() {
        return this.get('analysis', 'defaultDateRange', '7');
    }

    getExportSettings() {
        return this.get('export');
    }

    getDashboardSettings() {
        return this.get('dashboard');
    }

    // Backup-Funktionen
    async createBackup() {
        try {
            const backupDir = this.get('paths', 'backupPath', './backups');
            await fs.ensureDir(backupDir);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `config_backup_${timestamp}.json`);

            await fs.copyFile(this.configPath, backupPath);
            return backupPath;
        } catch (error) {
            console.error('Fehler beim Erstellen des Backups:', error);
            return null;
        }
    }

    async restoreBackup(backupPath) {
        try {
            if (await fs.pathExists(backupPath)) {
                const backupData = await fs.readJson(backupPath);
                this.config = this.mergeConfigs(this.defaultConfig, backupData);
                await this.saveConfig();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Wiederherstellen des Backups:', error);
            return false;
        }
    }

    // Validierungsfunktionen
    validateConfig(config) {
        const errors = [];

        // Validiere allgemeine Einstellungen
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
        }

        // Validiere Dashboard-Einstellungen
        if (config.dashboard) {
            if (config.dashboard.cardsPerRow < 1 || config.dashboard.cardsPerRow > 4) {
                errors.push('cardsPerRow muss zwischen 1 und 4 liegen');
            }
        }

        // Validiere Export-Einstellungen
        if (config.export) {
            if (!['excel', 'pdf', 'json'].includes(config.export.defaultFormat)) {
                errors.push('Ungültiges Export-Format');
            }
        }

        return errors.length === 0 ? { valid: true } : { valid: false, errors };
    }

    // Import/Export Konfiguration
    exportConfig() {
        return {
            config: this.config,
            version: '1.0.0',
            exportDate: new Date().toISOString()
        };
    }

    importConfig(configData) {
        try {
            const validation = this.validateConfig(configData);
            if (validation.valid) {
                this.config = this.mergeConfigs(this.defaultConfig, configData);
                this.saveConfig();
                return { success: true };
            } else {
                return { success: false, errors: validation.errors };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ConfigManager;
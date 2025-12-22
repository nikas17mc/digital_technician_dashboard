const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../data/config.json');
        this.defaultConfig = {
            general: {
                autoSave: true,
                theme: 'dark',
                language: 'de',
                notificationEnabled: true,
                autoRefresh: true,
                refreshInterval: 30
            },
            window: {
                width: 1400,
                height: 800,
                maximized: false,
                xPosition: 0,
                yPosition: 0
            },
            paths: {
                lastJsonPath: '',
                lastExportPath: '',
                defaultImportPath: '',
                backupPath: './backups'
            },
            analysis: {
                defaultDateRange: '7',
                enableMismatchAnalysis: true,
                enableIMEIAnalysis: true,
                cacheResults: true,
                cacheDuration: 3600
            },
            export: {
                defaultFormat: 'excel',
                includeIMEI: true,
                includeStatistics: true,
                autoOpenExport: true,
                compressExports: false
            },
            dashboard: {
                showTechnicianCards: true,
                cardsPerRow: 2,
                defaultView: 'data',
                refreshOnStart: true,
                showNotifications: true
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
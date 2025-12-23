const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class DataManager {
    constructor() {
        this.data = [];
        this.cache = new Map();
        this.technicians = ["Shady", "Luciano", "Osman", "Nikolai"];
        this.statusTypes = [
            "Repariert fertig",
            "WPR (Wirtschaftsprüfung)",
            "Ersatzteile benötigt",
            "In Arbeit",
            "Qualitätskontrolle (777777)",
            "Test nicht bestanden (444444)",
            "Polieren (888888)",
        ];
        this.dataPath = path.join(__dirname, '../data/auto_save.json');
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.loadAutoSave();
    }

    async loadAutoSave(page = 1, limit = 1000) {
        try {
            const cacheKey = `data_${page}_${limit}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                this.data = cached;
                return;
            }

            if (await fs.pathExists(this.dataPath)) {
                const fileData = await fs.readJson(this.dataPath);
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedData = fileData.slice(startIndex, endIndex);
                
                this.data = paginatedData.map((entry, idx) => ({
                    id: startIndex + idx + 1,
                    ...entry,
                    date: this.extractDateFromDateTime(entry.date_time),
                    timestamp: new Date().toISOString()
                }));
                
                // Cache the result
                this.setCachedData(cacheKey, this.data);
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
        }
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // Utility method to transform entry data
    transformEntry(entry, transformType = 'load') {
        if (transformType === 'load') {
            return {
                id: entry.id,
                ...entry,
                date: this.extractDateFromDateTime(entry.date_time),
                timestamp: new Date().toISOString()
            };
        } else if (transformType === 'save') {
            return {
                id: entry.id,
                date_time: entry.date_time,
                technic: entry.technic,
                event: entry.event,
                total_count: entry.total_count,
                imei: entry.imei
            };
        }
        return entry;
    }

    extractDateFromDateTime(dateTimeStr) {
        try {
            const dt = moment(dateTimeStr, "DD-MM-YYYY_HHmmss");
            return dt.isValid() ? dt.format("DD.MM.YYYY") : moment().format("DD.MM.YYYY");
        } catch {
            return moment().format("DD.MM.YYYY");
        }
    }

    async addEntry(technician, dateStr, status, count, imeiList = []) {
        // Validate IMEI count
        if (imeiList.length > count) {
            imeiList = imeiList.slice(0, count);
        } else if (imeiList.length < count) {
            imeiList = imeiList.concat(Array(count - imeiList.length).fill(""));
        }

        const entry = {
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
            timestamp: new Date().toISOString(),
        };

        this.data.push(entry);
        await this.autoSave();
        return entry;
    }

    async autoSave() {
        try {
            const exportData = this.data.map(entry => this.transformEntry(entry, 'save'));
            await fs.writeJson(this.dataPath, exportData, { spaces: 2 });
            
            // Clear cache after saving
            this.clearCache();
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    getSummary(startDate = null, endDate = null) {
        if (!this.data.length) return {};

        let filteredData = this.data;
        if (startDate && endDate) {
            const start = moment(startDate, "DD.MM.YYYY");
            const end = moment(endDate, "DD.MM.YYYY");
            
            filteredData = this.data.filter(d => {
                const entryDate = moment(d.date, "DD.MM.YYYY");
                return entryDate.isBetween(start, end, null, '[]');
            });
        }

        const summary = {};
        this.technicians.forEach(tech => {
            summary[tech] = {};
            this.statusTypes.forEach(status => {
                summary[tech][status] = 0;
            });
        });

        filteredData.forEach(entry => {
            if (summary[entry.technic] && summary[entry.technic][entry.event] !== undefined) {
                summary[entry.technic][entry.event] += entry.total_count;
            }
        });

        return summary;
    }

    async clearData() {
        this.data = [];
        try {
            return await fs.remove(this.dataPath);
        } catch { }
    }

    getStatistics() {
        const totalEntries = this.data.length;
        const totalDevices = this.data.reduce((sum, entry) => sum + entry.total_count, 0);
        const totalIMEIs = this.data.reduce((sum, entry) => sum + entry.imei.filter(i => i).length, 0);
        
        const today = moment().format("DD.MM.YYYY");
        const todayData = this.data.filter(e => e.date === today);
        const todaySummary = {};
        
        this.statusTypes.forEach(status => {
            todaySummary[status] = todayData
                .filter(e => e.event === status)
                .reduce((sum, e) => sum + e.total_count, 0);
        });

        return {
            totalEntries,
            totalDevices,
            totalIMEIs,
            todaySummary,
            technicians: this.technicians.length
        };
    }
}

module.exports = DataManager;
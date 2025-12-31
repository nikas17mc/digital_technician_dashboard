class IMEIAnalyzer {
    analyzeIMEI(imei) {
        const imeiStr = String(imei).trim();
        const length = imeiStr.length;
        const isNumeric = /^\d+$/.test(imeiStr);
        
        // TAC (Type Allocation Code)
        const tac = length >= 8 ? imeiStr.substring(0, 8) : 
                   length >= 6 ? imeiStr.substring(0, 6) : imeiStr;
        
        // Mustererkennung
        const patterns = this.detectPatterns(imeiStr);
        
        // Herstellererkennung
        const manufacturer = this.identifyManufacturer(tac, imeiStr);
        
        // Gerätetyp
        const deviceType = this.identifyDeviceType(imeiStr, patterns);
        
        // Qualitäts-Score
        const qualityScore = this.calculateQualityScore(imeiStr, patterns);
        
        // Validierung
        const isValid = this.validateIMEI(imeiStr);
        const validationScore = this.calculateValidationScore(imeiStr);

        return {
            imei: imeiStr,
            tac,
            length,
            isNumeric,
            manufacturer,
            deviceType,
            patterns,
            qualityScore,
            estimated: qualityScore < 90,
            analysisMethod: 'mathematical_pattern',
            isValid,
            validationScore
        };
    }

    detectPatterns(imei) {
        const patterns = [];
        
        if (!/^\d+$/.test(imei)) {
            patterns.push("non_numeric");
            return patterns;
        }

        // Luhn Algorithmus
        if (this.checkLuhn(imei)) {
            patterns.push("luhn_valid");
        }

        // Wiederholungsmuster
        const repeated = this.findRepeatedPatterns(imei);
        if (repeated) {
            patterns.push(`repeated_${repeated}`);
        }

        // Sequenzmuster
        const sequences = this.findSequences(imei);
        if (sequences.length) {
            patterns.push(...sequences);
        }

        // Symmetrie
        if (this.isSymmetric(imei)) {
            patterns.push("symmetric");
        }

        return patterns;
    }

    checkLuhn(imei) {
        if (!/^\d+$/.test(imei) || imei.length !== 15) {
            return false;
        }

        let sum = 0;
        const digits = imei.split('').map(Number);
        
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = digits[i];
            if ((digits.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }

        return sum % 10 === 0;
    }

    findRepeatedPatterns(imei) {
        // Triple-Muster
        for (let i = 0; i < imei.length - 2; i++) {
            if (imei[i] === imei[i + 1] && imei[i] === imei[i + 2]) {
                return `triple_${imei[i]}`;
            }
        }

        // ABAB Muster
        for (let i = 0; i < imei.length - 3; i++) {
            if (imei[i] === imei[i + 2] && imei[i + 1] === imei[i + 3]) {
                return "abab_pattern";
            }
        }

        return null;
    }

    findSequences(imei) {
        const sequences = [];
        const digits = imei.split('').map(Number);

        for (let i = 0; i < digits.length - 2; i++) {
            // Aufsteigend
            if (digits[i] + 1 === digits[i + 1] && digits[i + 1] === digits[i + 2] - 1) {
                sequences.push(`asc_seq_${digits[i]}-${digits[i + 2]}`);
            }
            // Absteigend
            else if (digits[i] - 1 === digits[i + 1] && digits[i + 1] === digits[i + 2] + 1) {
                sequences.push(`desc_seq_${digits[i]}-${digits[i + 2]}`);
            }
        }

        return sequences;
    }

    isSymmetric(imei) {
        const half = Math.floor(imei.length / 2);
        const firstHalf = imei.substring(0, half);
        const secondHalf = imei.substring(imei.length - half);
        return firstHalf === secondHalf.split('').reverse().join('');
    }

    identifyManufacturer(tac, imei) {
        const prefix = tac.substring(0, 2);
        
        const manufacturerPatterns = {
            '35': 'Apple',
            '86': 'Xiaomi',
            '49': 'Huawei',
            '34': 'Samsung',
            '01': 'Nokia',
            '10': 'Google',
        };

        if (manufacturerPatterns[prefix]) {
            return manufacturerPatterns[prefix];
        }

        if (this.checkLuhn(imei)) {
            return "Premium Hersteller";
        }

        if (this.findRepeatedPatterns(imei)) {
            return "Test/Entwickler Gerät";
        }

        return "Standard Hersteller";
    }

    identifyDeviceType(imei, patterns) {
        const length = imei.length;
        
        if (length === 15 && patterns.includes("luhn_valid")) {
            return "Smartphone (Standard IMEI)";
        } else if (length === 16) {
            return "Tablet oder größeres Gerät";
        } else if (length < 15) {
            return "Älteres Gerät oder Teil-IMEI";
        } else if (patterns.some(p => p.includes("test") || p.includes("Test"))) {
            return "Testgerät";
        } else {
            return "Mobilgerät";
        }
    }

    calculateQualityScore(imei, patterns) {
        let score = 50;

        // Länge
        if (imei.length === 15) score += 20;
        else if (imei.length >= 14) score += 10;

        // Numerisch
        if (/^\d+$/.test(imei)) score += 15;

        // Luhn Check
        if (patterns.includes("luhn_valid")) score += 25;

        // Keine negativen Muster
        if (!patterns.some(p => p.includes("test") || p.includes("triple"))) {
            score += 10;
        }

        return Math.min(100, score);
    }

    validateIMEI(imei) {
        if (!imei || imei.length < 10 || imei.length > 20) {
            return false;
        }

        if (!/^\d+$/.test(imei)) {
            return false;
        }

        // Check für zu viele Nullen
        const zeroCount = (imei.match(/0/g) || []).length;
        if (zeroCount > imei.length * 0.8) {
            return false;
        }

        // Check für Triple-Muster
        const repeated = this.findRepeatedPatterns(imei);
        if (repeated && repeated.includes("triple")) {
            return false;
        }

        return true;
    }

    calculateValidationScore(imei) {
        let score = 0;

        if (!imei) return 0;

        // Numerisch
        if (/^\d+$/.test(imei)) {
            score += 30;
        } else {
            return 20;
        }

        // Länge
        if (imei.length >= 14 && imei.length <= 16) {
            score += 30;
        } else if (imei.length >= 10) {
            score += 20;
        }

        // Luhn Check
        if (imei.length === 15 && /^\d+$/.test(imei) && this.checkLuhn(imei)) {
            score += 40;
        }

        return Math.max(0, Math.min(100, score));
    }

    analyzeIMEIList(imeiList) {
        return imeiList.map(item => {
            const imei = item.imei || item;
            const analysis = this.analyzeIMEI(imei);
            return {
                ...analysis,
                originalData: item
            };
        });
    }
}

module.exports = IMEIAnalyzer;
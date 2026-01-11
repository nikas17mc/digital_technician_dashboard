import fs from "fs";
import path from "path";

let config = {
    level: "info",
    logToFile: true,
    logDir: "logs",
    appName: "app"
};

const levels = {
    info: 1,
    warn: 2,
    error: 3
};

function initLogger(userConfig = {}) {
    config = { ...config, ...userConfig };

    if (config.logToFile) {
        if (!fs.existsSync(config.logDir)) {
            fs.mkdirSync(config.logDir, { recursive: true });
        }
    }

    info("Logger initialized", {
        app: config.appName,
        level: config.level
    });
}

function shouldLog(level) {
    return levels[level] >= levels[config.level];
}

function write(level, message, meta = {}) {
    if (!shouldLog(level)) return;

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    };

    const line = JSON.stringify(entry);

    if (level === "error") {
        console.error(line);
    } else if (level === "warn") {
        console.warn(line);
    } else {
        console.log(line);
    }

    if (config.logToFile) {
        const file = path.join(
            config.logDir,
            `${config.appName}-${new Date().toISOString().slice(0, 10)}.log`
        );
        fs.appendFileSync(file, line + "\n");
    }
}

function info(message, meta = {}) {
    write("info", message, meta);
}

function warn(message, meta = {}) {
    write("warn", message, meta);
}

function error(message, meta = {}) {
    write("error", message, meta);
}

export {
    initLogger,
    info,
    warn,
    error
};

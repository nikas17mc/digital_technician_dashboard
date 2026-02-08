import fs from "fs";
import path from "path";

let config = {
    level: "info",          // info | warn | error
    logToFile: true,
    logDir: "logs",
    appName: "app"
};

const levels = {
    error: 0,
    warn: 1,
    info: 2
};

function initLogger(userConfig = {}) {
    config = { ...config, ...userConfig };

    if (!levels.hasOwnProperty(config.level)) {
        throw new Error(`Invalid log level: ${config.level}`);
    }

    if (!config.logToFile === false) {
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
    return levels[level] <= levels[config.level];
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

    // Console output
    if (level === "error") {
        console.error(line);
    } else if (level === "warn") {
        console.warn(line);
    } else {
        console.log(line);
    }

    // File output
    if (config.logToFile) {
        const filePath = path.join(
            config.logDir,
            `${config.appName}-${new Date().toISOString().slice(0, 10)}.log`
        );
        fs.appendFileSync(filePath, line + "\n", "utf8");
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

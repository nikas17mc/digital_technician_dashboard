import crypto from "crypto";
import * as logger from "../core/logger.js";

/**
 * Central error handling middleware
 * Usage:
 *   import { errorMiddleware } from "./middleware/error-middleware.js";
 *   app.use(errorMiddleware);
 */
export function errorMiddleware(err, req, res, next) {
    const env = process.env.NODE_ENV || "production";
    const isDev = env === "development" || env === "staging";

    if (!err) {
        return next();
    }

    // -------------------------------------------------
    // 1. Normalize status + severity
    // -------------------------------------------------

    const statusCode =
        typeof err.statusCode === "number" && err.statusCode >= 400
            ? err.statusCode
            : typeof err.status === "number" && err.status >= 400
                ? err.status
                : 500;

    const severity =
        statusCode >= 500 ? "error"
            : statusCode >= 400 ? "warn"
                : "info";

    const message =
        typeof err.message === "string" && err.message.length > 0
            ? err.message
            : "Unexpected application error";

    // -------------------------------------------------
    // 2. Correlation & context
    // -------------------------------------------------

    const requestId =
        req && req.id
            ? req.id
            : crypto.randomUUID();

    const role =
        req && req.user && typeof req.user.role === "string"
            ? req.user.role
            : "guest";

    const userId =
        req && req.user && req.user.id
            ? req.user.id
            : null;

    // -------------------------------------------------
    // 3. Structured log payload
    // -------------------------------------------------

    const logPayload = {
        level: severity,
        requestId,
        statusCode,
        message,
        errorName: err.name || "Error",
        method: req && req.method ? req.method : "n/a",
        path: req && req.originalUrl ? req.originalUrl : "n/a",
        role,
        userId,
        stack: isDev && err.stack ? err.stack : undefined,
        timestamp: new Date().toISOString()
    };

    // -------------------------------------------------
    // 4. Logging (NO silent fallback)
    // -------------------------------------------------

    if (typeof logger[severity] === "function") {
        logger[severity](logPayload);
    } else if (typeof logger.error === "function") {
        // hard fallback, never lose an error
        logger.error({
            ...logPayload,
            level: "error",
            note: "Logger level fallback triggered"
        });
    } else {
        // absolute last resort
        console.error("[LOGGER FAILURE]", logPayload);
    }

    // -------------------------------------------------
    // 5. Response safety
    // -------------------------------------------------

    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode);

    // -------------------------------------------------
    // 6. Render error page
    // -------------------------------------------------

    return res.render("errors/error", {
        statusCode,
        message,
        error: isDev ? err : null,
        requestId,
        env,
        role,
        debugEnabled: isDev
    });
}

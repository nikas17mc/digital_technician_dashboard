import crypto from "crypto";

/**
 * Central error handling middleware
 * Usage:
 *   import { errorMiddleware } from "./middleware/error-middleware.js";
 *   app.use(errorMiddleware);
 */
export function errorMiddleware(err, req, res, next) {
    // -------------------------------------------------
    // 1. Environment & safety guards
    // -------------------------------------------------
    const env = process.env.NODE_ENV || "production";
    const isDev = env === "development" || env === "staging";

    if (!err) {
        return next();
    }

    // -------------------------------------------------
    // 2. Normalize error shape
    // -------------------------------------------------
    const statusCode =
        typeof err.statusCode === "number" && err.statusCode >= 400
            ? err.statusCode
            : typeof err.status === "number" && err.status >= 400
                ? err.status
                : 500;

    const message =
        typeof err.message === "string" && err.message.length > 0
            ? err.message
            : "An unexpected system error occurred.";

    // -------------------------------------------------
    // 3. Request correlation
    // -------------------------------------------------
    const requestId =
        req && req.id
            ? req.id
            : crypto.randomUUID();

    // -------------------------------------------------
    // 4. User / role context
    // -------------------------------------------------
    const role =
        req && req.user && typeof req.user.role === "string"
            ? req.user.role
            : "guest";

    const userId =
        req && req.user && req.user.id
            ? req.user.id
            : null;

    // -------------------------------------------------
    // 5. Logging (structured, backend only)
    // -------------------------------------------------
    const logPayload = {
        requestId,
        statusCode,
        message,
        method: req && req.method ? req.method : "n/a",
        path: req && req.originalUrl ? req.originalUrl : "n/a",
        role,
        userId,
        timestamp: new Date().toISOString()
    };

    if (isDev) {
        console.error("[ERROR]", logPayload);
        if (err.stack) {
            console.error(err.stack);
        }
    } else {
        // Hook for real logger (winston / pino / sentry / etc.)
        console.error("[ERROR]", logPayload);
    }

    // -------------------------------------------------
    // 6. Response safety
    // -------------------------------------------------
    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode);

    // -------------------------------------------------
    // 7. Render error page
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

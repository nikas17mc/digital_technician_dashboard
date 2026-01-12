// src/middlewares/csrf.middleware.js
// Zentrale CSRF-Protection Middleware

import csrf from 'csurf';

// =====================================================
// CSRF Middleware Configuration
// =====================================================
// Nutzt Session-basierten CSRF-Schutz (empfohlen für Dashboards)
export const csrfProtection = csrf({
    cookie: false, // CSRF-Token wird in der Session gespeichert
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Nur state-changing Requests schützen
});

// =====================================================
// Error Handler für CSRF-Fehler
// =====================================================
export function csrfErrorHandler(err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }

    // Token ungültig oder fehlt
    req.flash('error', 'Sicherheitsüberprüfung fehlgeschlagen. Bitte erneut versuchen.');

    // Redirect zurück zur Login-Seite oder Referer
    return res.redirect(req.get('Referrer') || '/auth/login');
}
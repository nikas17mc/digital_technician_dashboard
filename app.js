const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
require('dotenv').config({path: './envs/site.env', debug: false});
const fileUpload = require('express-fileupload');

const indexRouter = require('./routes/index');
const dataRouter = require('./routes/data');
const importExport = require('./routes/import-export');
const analysisRouter = require('./routes/analysis');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'techniker-dashboard-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    }
}));
app.use(fileUpload());

// Logging Middleware
app.use((req, _, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Statische Dateien
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Globale Variablen für Templates
app.use((_, res, next) => {
    res.locals.currentYear = new Date().getFullYear();
    res.locals.appName = 'Techniker Dashboard';
    res.locals.appVersion = '0.0.1';
    res.locals.env = process.env.NODE_ENV || 'development';
    next();
});

// Routen
app.use('/', indexRouter);
app.use('/data', dataRouter);
app.use('/import-export', importExport)
app.use('/analysis', analysisRouter);

// 404 Handler
app.use((req, res, _) => {
    res.status(404).render('error', {
        title: '404 - Seite nicht gefunden',
        status: 404,
        error: 'Die angeforderte Seite konnte nicht gefunden werden.',
        url: req.url,
        method: req.method
    });
});

// Error Handling Middleware
app.use((err, req, res, _) => {
    console.error('❌ Fehler:', err.stack);
    
    // Log error to file
    const errorLog = {
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        error: err.message,
        stack: err.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    };
    
    // Asynchron loggen
    fs.appendFile(
        path.join(__dirname, 'logs', 'errors.log'),
        JSON.stringify(errorLog) + '\n'
    ).catch(logErr => console.error('Fehler beim Loggen:', logErr));
    
    // Error response
    const status = err.status || 500;
    res.status(status).render('error', {
        title: `${status} - Fehler`,
        status: status,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.',
        url: req.url,
        method: req.method,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Ensure logs directory exists
fs.ensureDir(path.join(__dirname, 'logs')).catch(err => {
    console.error('Fehler beim Erstellen des Log-Verzeichnisses:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 Server gestartet!
    
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📁 Environment: ${process.env.NODE_ENV || 'development'}
    
    ✅ Bereit für Verbindungen...
    `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM empfangen. Server wird heruntergefahren...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT empfangen. Server wird heruntergefahren...');
    process.exit(0);
});
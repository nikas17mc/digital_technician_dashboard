/**
 * Digitaler Techniker Dashboard
 * Application Entry Point
 */

import express from 'express';
import path from 'path';
import session from 'express-session';
import { randomBytes } from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import flash from 'connect-flash';
import { ensureDirSync } from 'fs-extra';

import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: './envs/site.env', encoding: 'UTF-8', quiet: true, debug: true })

/* -------------------------------------------------------------------------- */
/* Variables                                                                      */
/* -------------------------------------------------------------------------- */
let isDev = process.env.NODE_ENV;



/* -------------------------------------------------------------------------- */
/* CORE                                                                       */
/* -------------------------------------------------------------------------- */

import { initLogger, info, warn } from './src/core/logger.js';
// import { initDatabase, close } from './src/core/database.js';
// import { initCache } from './src/core/cache.js';
// import { initEventBus } from './src/core/event-bus.js';
// import { initRealtime, attach } from './src/core/realtime.js';
// import { initScheduler } from './src/core/scheduler.js';

/* -------------------------------------------------------------------------- */
/* MIDDLEWARES                                                                */
/* -------------------------------------------------------------------------- */

// import authMiddleware from './src/middlewares/auth.middleware.js';
// import roleMiddleware from './src/middlewares/role.middleware.js';
// import auditMiddleware from './src/middlewares/audit.middleware.js';
// import rateLimitMiddleware from './src/middlewares/rateLimit.middleware.js';
// import validationMiddleware from './src/middlewares/validation.middleware.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                     */
/* -------------------------------------------------------------------------- */

import authRoutes from './src/routes/auth.routes.js';
// import devicesRoutes from './src/routes/devices.routes.js';
// import jobsRoutes from './src/routes/jobs.routes.js';
// import partsRoutes from './src/routes/parts.rooutes.js';
// import qcRoutes from './src/routes/qc.routes.js';
// import reportsRoutes from './src/routes/reports.routes.js';
// import techniciansRoutes from './src/routes/technicians.routes.js';
// import workflowRoutes from './src/routes/workflow.routes.js';
// import realtimeRoutes from './src/routes/realtime.routes.js';
// import systemRoutes from './src/routes/system.routes.js';
// import monitoringRoutes from './src/routes/monitoring.routes.js';
// import auditRoutes from './src/routes/audit.routes.js';
// import plentyRoutes from './src/routes/plenty.routes.js';
// import usersRoutes from './src/routes/users.routes.js';

/* -------------------------------------------------------------------------- */
/* APP INIT                                                                   */
/* -------------------------------------------------------------------------- */

const app = express();
ensureDirSync(path.join(path.dirname('./'), 'logs'));

/* -------------------------------------------------------------------------- */
/* BOOTSTRAP CORE                                                             */
/* -------------------------------------------------------------------------- */

initLogger({
    appName: process.env.APP_NAME,
    level: "info",
    logToFile: process.env.LOG_TO_FILE
});
// initDatabase();
// initCache();
// initEventBus();
// initRealtime();
// initScheduler();

/* -------------------------------------------------------------------------- */
/* GLOBAL SECURITY & REQUEST MIDDLEWARE                                       */
/* -------------------------------------------------------------------------- */

app.use(flash())

app.use(helmet());

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload());

app.use(session({
    name: 'techniker-dashboard.sid',
    secret: process.env.SESSION_SECRET || randomBytes(48).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

/* -------------------------------------------------------------------------- */
/* STATIC & VIEW ENGINE                                                       */
/* -------------------------------------------------------------------------- */

app.use(express.static(path.join(process.cwd(), 'src/public')));

app.set('views', path.join(path.dirname('./'), 'src/views'));
app.set('view engine', 'pug');

app.use((req, res, next) => {
    res.locals.appName = 'Digitaler Techniker Dashboard';
    res.locals.appVersion = '1.0.0';
    res.locals.env = process.env.NODE_ENV || 'development';
    res.locals.year = new Date().getFullYear();
    res.locals.user = req.session?.user || null;
    next();
});

/* -------------------------------------------------------------------------- */
/* PUBLIC ROUTES                                                              */
/* -------------------------------------------------------------------------- */

app.get('/', (_, res) => res.render('welcome', {
    app: {
        name: "Digitaler Techniker Dashboard"
    },
}));
app.use('/auth', authRoutes);

/* -------------------------------------------------------------------------- */
/* AUTHENTICATED ROUTES                                                       */
/* -------------------------------------------------------------------------- */

// app.use(authMiddleware);
//auditMiddleware('DASHBOARD_VIEW'),
app.get('/dashboard', (req, res) => {
    res.render('dashboard/index', {
        app: {
            name: process.env.APP_NAME || 'My App',
            version: process.env.APP_VERSION || 'dev',
            timezone: new Date().getUTCDate()
        },
        system: {
            online: true
        },
        realtime: {
            connected: true
        },
        plenty: {
            pending: 0
        },
        user: {
            name: "",
            role: "admin"
        }
    });
});
app.get('/activity', (req, res) => {
    res.render('dashboard/activity', {
        app: {
            name: process.env.APP_NAME || 'My App',
            version: process.env.APP_VERSION || 'dev',
            timezone: new Date().getUTCDate()
        },
        system: {
            online: true
        },
        realtime: {
            connected: true
        },
        plenty: {
            pending: 0
        },
        user: {
            name: "",
            role: "admin"
        }
    });
});

// app.use('/devices',
//     rateLimitMiddleware({ max: 300 }),
//     auditMiddleware(),
//     devicesRoutes
// );

// app.use('/jobs', auditMiddleware(), jobsRoutes);
// app.use('/parts', auditMiddleware(), partsRoutes);
// app.use('/qc', auditMiddleware(), qcRoutes);
// app.use('/reports', roleMiddleware(['admin', 'manager']), auditMiddleware(), reportsRoutes);
// app.use('/technicians', auditMiddleware(), techniciansRoutes);
// app.use('/workflow', auditMiddleware(), workflowRoutes);
// app.use('/realtime', realtimeRoutes);
// app.use('/plenty', roleMiddleware('admin'), auditMiddleware(), plentyRoutes);
// app.use('/users', roleMiddleware('admin'), auditMiddleware(), usersRoutes);
// app.use('/audit', roleMiddleware('admin'), auditRoutes);
// app.use('/monitoring', roleMiddleware('admin'), monitoringRoutes);
// app.use('/system', roleMiddleware('admin'), systemRoutes);

/* -------------------------------------------------------------------------- */
/* 404                                                                       */
/* -------------------------------------------------------------------------- */

app.use((_, res) => {
    res.status(404).render('errors/error', {
        app: {
            name: process.env.APP_NAME || 'My App',
            version: process.env.APP_VERSION || 'dev'
        },
        status: 404,
        title: '404 – Nicht gefunden',
        message: 'Diese Route existiert nicht.'
    });
});

/* -------------------------------------------------------------------------- */
/* ERROR HANDLER                                                              */
/* -------------------------------------------------------------------------- */

app.use(errorMiddleware);

/* -------------------------------------------------------------------------- */
/* SERVER                                                                     */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    switch (isDev) {
        case "development":
            info(`Server läuft auf http://localhost:${PORT}`);
            break;
        default:
            console.info(`
    🚀 Server gestartet!
    
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📁 Environment: ${process.env.NODE_ENV || 'public'}
    
    ✅ Bereit für Verbindungen...
            `);
            break;
    }

});

// attach(server);

/* -------------------------------------------------------------------------- */
/* GRACEFUL SHUTDOWN                                                          */
/* -------------------------------------------------------------------------- */

const shutdown = (signal) => {
    warn(`Shutdown: ${signal}`);
    // _shutdown();
    close();
    server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
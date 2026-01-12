// src/middlewares/auth.middleware.js
// ESM – kompatibel mit Node.js 18+ / 20 / 24

export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        return next();
    }

    req.flash('error', 'Bitte melde dich an, um fortzufahren.');
    return res.redirect('/auth/login');
};

export const isGuest = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};

export const roleGuard = (roles = []) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            req.flash('error', 'Nicht authentifiziert.');
            return res.redirect('/auth/login');
        }

        const userRole = req.session.user.role;

        if (!roles.includes(userRole)) {
            req.flash('error', 'Keine Berechtigung für diesen Bereich.');
            return res.redirect('/dashboard');
        }

        next();
    };
};

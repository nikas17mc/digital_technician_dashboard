// src/controllers/auth.controller.js
// ESM-compatible Auth Controller

import bcrypt from 'bcrypt';
// import User from '../models/User.js';

export const login = async (req, res) => {
    const { identifier, password, remember } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!user) {
            req.flash('error', 'Benutzer nicht gefunden.');
            return res.redirect('/auth/login');
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            req.flash('error', 'Falsches Passwort.');
            return res.redirect('/auth/login');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        if (remember) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 14; // 14 Tage
        }

        req.flash('success', 'Erfolgreich angemeldet.');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('[AUTH][LOGIN]', err);
        req.flash('error', 'Login fehlgeschlagen.');
        return res.redirect('/auth/login');
    }
};

export const register = async (req, res) => {
    const { username, email, password, passwordConfirm, role } = req.body;

    if (password !== passwordConfirm) {
        req.flash('error', 'Passwörter stimmen nicht überein.');
        return res.redirect('/auth/login');
    }

    try {
        const existing = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existing) {
            req.flash('error', 'Benutzer existiert bereits.');
            return res.redirect('/auth/login');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await User.create({
            username,
            email,
            passwordHash,
            role: role || 'technician',
        });

        req.flash('success', 'Konto erstellt. Bitte einloggen.');
        return res.redirect('/auth/login');
    } catch (err) {
        console.error('[AUTH][REGISTER]', err);
        req.flash('error', 'Registrierung fehlgeschlagen.');
        return res.redirect('/auth/login');
    }
};

export const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};

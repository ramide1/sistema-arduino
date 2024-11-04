const express = require('express');
const isAuthenticated = require('./middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/login', (req, res) => {
    if (req.session.username) {
        res.redirect('/dashboard');
    } else {
        res.sendFile('./public/login.html');
    }
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile('./public/dashboard.html');
});

router.get('/cerradura', isAuthenticated, (req, res) => {
    res.sendFile('./public/cerradura.html');
});

router.get('/ambiental', isAuthenticated, (req, res) => {
    res.sendFile('./public/ambiental.html');
});

router.get('/tomacorriente', isAuthenticated, (req, res) => {
    res.sendFile('./public/tomacorriente.html');
});

module.exports = router;
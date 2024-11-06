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
        res.sendFile(__dirname + '/template/login.html');
    }
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/template/dashboard.html');
});

router.get('/cerradura', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/template/cerradura.html');
});

router.get('/ambiental', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/template/ambiental.html');
});

router.get('/tomacorriente', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/template/tomacorriente.html');
});

module.exports = router;
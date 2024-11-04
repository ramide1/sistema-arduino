const express = require('express');
const session = require('express-session');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const sequelize = require('./db');
const routes = require('./routes');
const sockets = require('./sockets');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const port = process.env.APP_PORT || 3000;
const accessUsers = process.env.ACCESS_USERS ? process.env.ACCESS_USERS.split(', ') : [];
const masterKeys = process.env.MASTER_KEYS ? process.env.MASTER_KEYS.split(', ') : [];
const waitTimeout = process.env.WAIT_TIMEOUT ? process.env.WAIT_TIMEOUT * 1000 : 60000;
const cookieTimeout = process.env.COOKIE_TIMEOUT ? process.env.COOKIE_TIMEOUT * 1000 : 60000;

if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET no está definido en el archivo .env');

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: cookieTimeout
    }
});

app.use(express.static('src/public'));
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
app.use('/', routes);
sockets(io, accessUsers, masterKeys, waitTimeout);

sequelize.sync()
    .then(() => {
        server.listen(port, () => {
            console.log(`Servidor escuchando en el puerto ${port}`);
        });
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err);
    });
const express = require('express');
const session = require('express-session');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const sequelize = require('./db');
const DatosCliente = require('./models/DatosCliente');
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

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET no está definido en el archivo .env');
}

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
});

app.use(express.static('src/public'));
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

let waiting = false;
io.on('connection', (socket) => {
    console.log('Usuario conectado');
    const session = socket.request.session;

    if (session.username) {
        socket.emit('loggedIn', session.username);
        if (waiting) {
            socket.emit('waitConfirmation', true);
        }
    }

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('error', (data) => {
        console.log(data);
    });

    socket.on('login', (data) => {
        try {
            if (session.username) {
                throw 'Ya está logeado';
            }
            const { username, password } = data;
            if (!(username && password)) {
                throw 'Usuario y contraseña son requeridos'
            }
            if (!(accessUsers.includes(username) && masterKeys.includes(password))) {
                throw 'Usuario o contraseña incorrectos'
            }
            session.username = username;
            session.save();
            socket.emit('loggedIn', username);
            if (waiting) {
                socket.emit('waitConfirmation', true);
            } else {
                socket.emit('sendAlert', { success: true, message: '¡Inicio de sesión exitoso!' });
            }
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('logout', () => {
        try {
            if (!session.username) {
                throw 'No está logeado';
            }
            session.destroy();
            socket.emit('loggedOut', true);
            socket.emit('sendAlert', { success: true, message: '¡Cierre de sesión exitoso!' });
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('add', async (data) => {
        try {
            if (!session.username) {
                throw 'No está logeado';
            }
            const nombre = data.nombre;
            if (!nombre) {
                throw 'Nombre es requerido';
            }
            const huella = await DatosCliente.create({ nombre });
            io.emit('enviarHuella', { nombre: nombre, operacion: 0 });
            waiting = true;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (waiting) {
                    waiting = false;
                    io.emit('waitConfirmation', false);
                    huella.destroy();
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, 30000);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('delete', async (data) => {
        try {
            if (!session.username) {
                throw 'No está logeado';
            }
            const nombre = data.nombre;
            if (!nombre) {
                throw 'Nombre es requerido';
            }
            const huella = await DatosCliente.findOne({ where: { nombre: nombre } });
            if (!huella) {
                throw 'No se encontró con ese nombre';
            }
            io.emit('enviarHuella', { nombre: nombre, operacion: 1, huella: huella.huella });
            waiting = true;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (waiting) {
                    waiting = false;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, 30000);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('edit', async (data) => {
        try {
            if (!session.username) {
                throw 'No está logeado';
            }
            const { nombre, numero } = data;
            if (!(nombre && numero)) {
                throw 'Nombre y Número son requeridos';
            }
            const huella = await DatosCliente.findOne({ where: { huella: numero } });
            if (!huella) {
                throw 'No se encontró con ese número';
            }
            io.emit('enviarHuella', { nombre: nombre, operacion: 2, huella: huella.huella });
            waiting = true;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (waiting) {
                    waiting = false;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, 30000);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('vaciar', async () => {
        try {
            if (!session.username) {
                throw 'No está logeado';
            }
            io.emit('vacioDatabase', true);
            waiting = true;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (waiting) {
                    waiting = false;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, 30000);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    })

    socket.on('confirmacionHuella', async (data) => {
        try {
            waiting = false;
            io.emit('waitConfirmation', false);
            if (data.error != 'sin errores') {
                throw data.error;
            }
            const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
            if (!huella) {
                throw 'No se encontró con ese número';
            }
            if (data.operacion == 0) {
                await huella.update({ huella: data.huella });
                io.emit('sendAlert', { success: true, message: '¡Se guardó con éxito!' });
            } else if (data.operacion == 1) {
                await huella.destroy();
                io.emit('sendAlert', { success: true, message: '¡Se eliminó con éxito!' });
            } else if (data.operacion == 2) {
                await huella.update({ nombre: data.nombre });
                io.emit('sendAlert', { success: true, message: '¡Se editó con éxito!' });
            } else {
                throw 'No se encontró esa operación';
            }
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('confirmacionVaciar', async () => {
        waiting = false;
        io.emit('waitConfirmation', false);
        await DatosCliente.destroy({ truncate: true });
        io.emit('sendAlert', { success: true, message: '¡Se vacio con éxito!' });
    });

    socket.on('forzarCerradura', () => {
        io.emit('cerraduraForzada', true);
    });

    socket.on('matchHuella', async (data) => {
        const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
        if (huella) {
            await huella.update({ actividad: (new Date()) });
            io.emit('matchData', huella);
        }
    });
});

sequelize.sync()
    .then(() => {
        server.listen(port, () => {
            console.log(`Servidor escuchando en el puerto ${port}`);
        });
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err);
    });
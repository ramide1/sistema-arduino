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
const waitTimeout = process.env.WAIT_TIMEOUT ? process.env.WAIT_TIMEOUT * 1000 : 60000;

if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET no está definido en el archivo .env');

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
});

app.use(express.static('src/public'));
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

let currentData = null;
io.on('connection', (socket) => {
    console.log('Usuario conectado');
    const session = socket.request.session;

    if (session.username) {
        socket.emit('loggedIn', session.username);
        if (currentData) socket.emit('waitConfirmation', true);
    }

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('error', (data) => {
        console.log(data);
    });

    socket.on('login', (data) => {
        try {
            if (session.username) throw 'Ya está logeado';
            const { username, password } = data;
            if (!(username && password)) throw 'Usuario y contraseña son requeridos';
            if (!(accessUsers.includes(username) && masterKeys.includes(password))) throw 'Usuario o contraseña incorrectos';
            session.username = username;
            session.save();
            socket.emit('loggedIn', username);
            if (currentData) socket.emit('waitConfirmation', true);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('logout', () => {
        try {
            if (!session.username) throw 'No está logeado';
            session.destroy();
            socket.emit('loggedOut', true);
            socket.emit('sendAlert', { success: true, message: '¡Cierre de sesión exitoso!' });
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('add', async (data) => {
        try {
            if (!session.username) throw 'No está logeado';
            const nombre = data.nombre;
            if (!nombre) throw 'Nombre es requerido';
            const huella = await DatosCliente.create({ nombre });
            io.emit('enviarHuella', { operacion: 0 });
            currentData = huella;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (currentData) {
                    currentData = null;
                    io.emit('waitConfirmation', false);
                    huella.destroy();
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, waitTimeout);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('delete', async (data) => {
        try {
            if (!session.username) throw 'No está logeado';
            const nombre = data.nombre;
            if (!nombre) throw 'Nombre es requerido';
            const huella = await DatosCliente.findOne({ where: { nombre: nombre } });
            if (!huella) throw 'No se encontró con ese nombre';
            io.emit('enviarHuella', { operacion: 1, huella: huella.huella });
            currentData = huella;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (currentData) {
                    currentData = null;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, waitTimeout);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('edit', async (data) => {
        try {
            if (!session.username) throw 'No está logeado';
            const { nombre, numero } = data;
            if (!(nombre && numero)) throw 'Nombre y Número son requeridos';
            const huella = await DatosCliente.findOne({ where: { huella: numero } });
            if (!huella) throw 'No se encontró con ese número';
            io.emit('enviarHuella', { operacion: 2, huella: huella.huella });
            currentData = {
                nombre: nombre,
                huella: huella
            };
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (currentData) {
                    currentData = null;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, waitTimeout);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('vaciar', async () => {
        try {
            if (!session.username) throw 'No está logeado';
            io.emit('vacioDatabase', true);
            currentData = true;
            io.emit('waitConfirmation', true);
            setTimeout(() => {
                if (currentData) {
                    currentData = null;
                    io.emit('waitConfirmation', false);
                    io.emit('sendAlert', { success: false, message: '¡No hay respuesta!' });
                }
            }, waitTimeout);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    })

    socket.on('confirmacionHuella', async (data) => {
        try {
            if (data.error != 'sin errores') {
                if (data.operacion == 0) {
                    await currentData.destroy();
                }
                throw data.error;
            }
            let currentMessage;
            if (data.operacion == 0) {
                await currentData.update({ huella: data.huella });
                currentMessage = '¡Se guardó con éxito!';
            } else if (data.operacion == 1) {
                await currentData.destroy();
                currentMessage = '¡Se eliminó con éxito!';
            } else if (data.operacion == 2) {
                await currentData.huella.update({ nombre: currentData.nombre });
                currentMessage = '¡Se editó con éxito!';
            } else {
                throw 'No se encontró esa operación';
            }
            currentData = null;
            io.emit('waitConfirmation', false);
            io.emit('sendAlert', { success: true, message: currentMessage });
        } catch (error) {
            currentData = null;
            io.emit('waitConfirmation', false);
            io.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
    });

    socket.on('confirmacionVaciar', async () => {
        await DatosCliente.destroy({ truncate: true });
        currentData = null;
        io.emit('waitConfirmation', false);
        io.emit('sendAlert', { success: true, message: '¡Se vacio con éxito!' });
    });

    socket.on('forzarCerradura', () => {
        try {
            if (!session.username) throw 'No está logeado';
            io.emit('cerraduraForzada', true);
        } catch (error) {
            socket.emit('sendAlert', { success: false, message: error.message || error || 'Error desconocido' });
        }
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
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
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = process.env.APP_PORT;
const accessUsers = process.env.ACCESS_USERS.split(', ');
const masterKeys = process.env.MASTER_KEYS.split(', ');

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
});

app.use(express.static('src/public'));
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

const actualizarDatos = async () => {
    const datos = await DatosCliente.findAll({
        order: [['actividad', 'DESC']],
        limit: 1
    });
    io.emit('datosCliente', datos);
};

io.on('connection', (socket) => {
    console.log('Usuario conectado');
    const session = socket.request.session;

    if (session.username) {
        socket.emit('loggedIn', session.username);
        actualizarDatos();
    }

    socket.on('error', console.error);

    socket.on('message', (data) => {
        console.log('recibido: %s', data);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('login', (data) => {
        const { username, password } = data;

        if (username && password) {
            if (accessUsers.includes(username) && masterKeys.includes(password)) {
                session.username = username;
                session.save();
                socket.emit('loggedIn', username);
                actualizarDatos();
                socket.emit('enviarAlerta', { success: true, message: '¡Inicio de sesión exitoso!' });
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Usuario o contraseña incorrectos' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'Usuario y contraseña son requeridos' });
        }
    });

    socket.on('logout', () => {
        if (session.username) {
            session.destroy();
            socket.emit('loggedOut', true);
            socket.emit('enviarAlerta', { success: true, message: '¡Cierre de sesión exitoso!' });
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No se inició sesión' });
        }
    });

    socket.on('add', async (data) => {
        if (session.username) {
            const nombre = data.nombre;

            if (nombre) {
                try {
                    await DatosCliente.create({ nombre });
                    io.emit('added', true);
                    io.emit('enviarHuella', { nombre: nombre, operacion: 0 });
                    actualizarDatos();
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al agregar datos' });
                }
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre es requerido' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('delete', async (data) => {
        if (session.username) {
            const nombre = data.nombre;

            if (nombre) {
                try {
                    const huella = await DatosCliente.findOne({ where: { nombre: nombre } });
                    if (huella) {
                        await huella.destroy();
                        io.emit('modified', true);
                        socket.emit('enviarAlerta', { success: true, message: '¡Se eliminó con éxito!' });
                        io.emit('enviarHuella', { nombre: nombre, operacion: 1 });
                        actualizarDatos();
                    } else {
                        socket.emit('enviarAlerta', { success: false, message: 'No se encontró con ese nombre' });
                    }
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al eliminar datos' });
                }
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre es requerido' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('sobreescribir', async (data) => {
        if (session.username) {
            const nombre = data.nombre;

            if (nombre) {
                try {
                    const huella = await DatosCliente.findOne({ where: { nombre: nombre } });
                    if (huella) {
                        await huella.update({ nombre });
                        io.emit('modified', true);
                        socket.emit('enviarAlerta', { success: true, message: '¡Se sobreescribió con éxito!' });
                        io.emit('enviarHuella', { nombre: nombre, operacion: 2 });
                        actualizarDatos();
                    } else {
                        socket.emit('enviarAlerta', { success: false, message: 'No se encontró con ese nombre' });
                    }
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al sobreescribir datos' });
                }
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre es requerido' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('vaciar', async () => {
        if (session.username) {
            try {
                await DatosCliente.destroy({ truncate: true, cascade: false })
                io.emit('modified', true);
                socket.emit('enviarAlerta', { success: true, message: '¡Se vacio con éxito!' });
                actualizarDatos();
            } catch (e) {
                socket.emit('enviarAlerta', { success: false, message: 'Error al vaciar datos' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('forzarCerradura', () => {
        io.emit('cerraduraForzada', true);
    });

    socket.on('confirmacionHuella', async (data) => {
        const huella = await DatosCliente.findOne({ where: { nombre: data.nombre } });
        if (huella) {
            await huella.update({ huella: data.huella });
            actualizarDatos();
            io.emit('huellaConfirmada', true);
            io.emit('enviarAlerta', { success: true, message: '¡Se guardó con éxito!' });
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
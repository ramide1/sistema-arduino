const express = require('express');
const session = require('express-session');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const sequelize = require('./db');
const DatosCliente = require('./models/DatosCliente');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server);
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

const enviarHuella = (huella, agrego) => {
    io.emit('enviarHuella', { huella, agrego });
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

    socket.on('loginForm', (data) => {
        const { username, password } = data;

        if (!username || !password) {
            socket.emit('enviarAlerta', { success: false, message: 'Usuario y contraseña son requeridos' });
        } else {
            if (accessUsers.includes(username) && masterKeys.includes(password)) {
                session.username = username;
                session.save();
                socket.emit('loggedIn', username);
                actualizarDatos();
                socket.emit('enviarAlerta', { success: true, message: '¡Inicio de sesión exitoso!' });
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Usuario o contraseña incorrectos' });
            }
        }
    });

    socket.on('logoutForm', () => {
        const username = session.username;
        if (!username) {
            socket.emit('enviarAlerta', { success: false, message: 'No se inició sesión' });
        } else {
            session.destroy();
            socket.emit('loggedOut', username);
            socket.emit('enviarAlerta', { success: true, message: '¡Cierre de sesión exitoso!' });
        }
    });

    socket.on('add', async (data) => {
        if (session.username) {
            const { nombre } = data;

            if (!nombre) {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre es requerido' });
            } else {
                try {
                    const huella = await DatosCliente.create({ nombre });
                    socket.emit('added', huella);
                    socket.emit('enviarAlerta', { success: true, message: '¡Se guardó con éxito!' });
                    enviarHuella(huella, true);
                    actualizarDatos();
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al agregar datos' });
                }
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('delete', async (data) => {
        if (session.username) {
            const { delete_nombre } = data;

            if (!delete_nombre) {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre es requerido' });
            } else {
                try {
                    const huella = await DatosCliente.findOne({ where: { nombre: delete_nombre } });
                    if (huella) {
                        await huella.destroy();
                        socket.emit('deleted', huella);
                        socket.emit('enviarAlerta', { success: true, message: '¡Se eliminó con éxito!' });
                        enviarHuella(huella, false);
                        actualizarDatos();
                    } else {
                        socket.emit('enviarAlerta', { success: false, message: 'No se encontró con ese nombre' });
                    }
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al eliminar datos' });
                }
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No tiene permisos para realizar esta operación' });
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
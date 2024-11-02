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

let estadoAdd = false;
let estadoDelete = false;
let estadoEdit = false;
let estadoVaciar = false;
io.on('connection', (socket) => {
    console.log('Usuario conectado');
    let session = socket.request.session;

    if (session.username) {
        socket.emit('loggedIn', session.username);
        DatosCliente.findAll({
            order: [['actividad', 'DESC']],
            limit: 1
        }).then(data => {
            if ((data[0] && data[0].huella == null) || estadoAdd || estadoDelete || estadoEdit || estadoVaciar) {
                io.emit('esperarConfirmacion', true);
            }
        });
    }

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('login', (data) => {
        const { username, password } = data;

        if (username && password) {
            if (accessUsers.includes(username) && masterKeys.includes(password)) {
                session.username = username;
                session.save();
                session = socket.request.session;
                socket.emit('loggedIn', username);
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
            session = socket.request.session;
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
                    const huella = await DatosCliente.create({ nombre });
                    io.emit('enviarHuella', { nombre: nombre, operacion: 0 });
                    io.emit('esperarConfirmacion', true);
                    estadoAdd = true;
                    setTimeout(() => {
                        if (estadoAdd) {
                            estadoAdd = false;
                            huella.destroy();
                            io.emit('esperarConfirmacion', false);
                            io.emit('enviarAlerta', { success: false, message: '¡No hay respuesta!' });
                        }
                    }, 30000);
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
                        io.emit('enviarHuella', { nombre: nombre, operacion: 1, huella: huella.huella });
                        io.emit('esperarConfirmacion', true);
                        estadoDelete = true;
                        setTimeout(() => {
                            if (estadoDelete) {
                                estadoDelete = false;
                                io.emit('esperarConfirmacion', false);
                                io.emit('enviarAlerta', { success: false, message: '¡No hay respuesta!' });
                            }
                        }, 30000);
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

    socket.on('edit', async (data) => {
        if (session.username) {
            const { nombre, numero } = data;

            if (nombre && numero) {
                try {
                    const huella = await DatosCliente.findOne({ where: { huella: numero } });
                    if (huella) {
                        io.emit('enviarHuella', { nombre: nombre, operacion: 2, huella: huella.huella });
                        io.emit('esperarConfirmacion', true);
                        estadoEdit = true;
                        setTimeout(() => {
                            if (estadoEdit) {
                                estadoEdit = false;
                                io.emit('esperarConfirmacion', false);
                                io.emit('enviarAlerta', { success: false, message: '¡No hay respuesta!' });
                            }
                        }, 30000);
                    } else {
                        socket.emit('enviarAlerta', { success: false, message: 'No se encontró' });
                    }
                } catch (e) {
                    socket.emit('enviarAlerta', { success: false, message: 'Error al editar datos' });
                }
            } else {
                socket.emit('enviarAlerta', { success: false, message: 'Nombre y Número son requeridos' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    });

    socket.on('vaciar', async () => {
        if (session.username) {
            try {
                io.emit('vacioDatabase', true);
                io.emit('esperarConfirmacion', true);
                estadoVaciar = true;
                setTimeout(() => {
                    if (estadoVaciar) {
                        estadoVaciar = false;
                        io.emit('esperarConfirmacion', false);
                        io.emit('enviarAlerta', { success: false, message: '¡No hay respuesta!' });
                    }
                }, 30000);
            } catch (e) {
                socket.emit('enviarAlerta', { success: false, message: 'Error al vaciar datos' });
            }
        } else {
            socket.emit('enviarAlerta', { success: false, message: 'No está logeado' });
        }
    })

    socket.on('confirmacionHuella', async (data) => {
        if (data.operacion == 0) {
            const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
            if (huella) {
                estadoAdd = false;
                await huella.update({ huella: data.huella });
                io.emit('esperarConfirmacion', false);
                io.emit('enviarAlerta', { success: true, message: '¡Se guardó con éxito!' });
            }
        } else if (data.operacion == 1) {
            const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
            if (huella) {
                estadoDelete = false;
                await huella.destroy();
                io.emit('esperarConfirmacion', false);
                io.emit('enviarAlerta', { success: true, message: '¡Se eliminó con éxito!' });
            }
        } else if (data.operacion == 2) {
            const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
            if (huella) {
                estadoEdit = false;
                await huella.update({ nombre: data.nombre });
                io.emit('esperarConfirmacion', false);
                io.emit('enviarAlerta', { success: true, message: '¡Se editó con éxito!' });
            }
        }
    });

    socket.on('confirmacionVaciar', async () => {
        estadoVaciar = false;
        await DatosCliente.destroy({ truncate: true, cascade: false });
        io.emit('esperarConfirmacion', false);
        io.emit('enviarAlerta', { success: true, message: '¡Se vacio con éxito!' });
    });

    socket.on('forzarCerradura', () => {
        io.emit('cerraduraForzada', true);
    });

    socket.on('matchHuella', async (data) => {
        const huella = await DatosCliente.findOne({ where: { huella: data.huella } });
        if (huella) {
            await huella.update({ actividad: (new Date()) });
            io.emit('datosCliente', huella);
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
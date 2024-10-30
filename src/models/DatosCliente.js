const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DatosCliente = sequelize.define('datos_cliente', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(30),
        unique: true,
        allowNull: false
    },
    huella: {
        type: DataTypes.INTEGER,
        unique: true,
        // Despues cambiarlo
        allowNull: true
    },
    actividad: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = DatosCliente;
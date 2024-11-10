const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Logs = sequelize.define('logs', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    texto: {
        type: DataTypes.STRING(300),
        allowNull: false
    }
});

module.exports = Logs;
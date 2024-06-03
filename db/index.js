const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '20071028zhanG!',
    database: 'bdsm'
});

module.exports = db;
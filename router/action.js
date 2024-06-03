const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();
const SECRET_KEY = 'W!C@N#M$D%N^G&S*B';
const errorCodes = require('../errorCodes');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send({ code: 1001, message: errorCodes[1001] });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO teacher(username, password) VALUES (?, ?)';
        await db.query(sql, [username, hashedPassword]);
        res.send({ code: 0, message: errorCodes[0] });
    } catch (error) {
        console.log(error)
        res.send({ code: 1000, message: errorCodes[1000] });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send({ code: 1001, message: errorCodes[1001] });
    }

    try {
        const [userResult] = await db.query('SELECT id, password FROM teacher WHERE username = ?', [username]);
        if (userResult.length === 0) {
            return res.send({ code: 2003, message: errorCodes[2003] });
        }

        const user = userResult[0];
        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
            return res.send({ code: 2002, message: errorCodes[2002] });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.send({ code: 0, message: errorCodes[0], token });
    } catch (error) {
        res.send({ code: 1000, message: errorCodes[1000] });
    }
});

module.exports = router;

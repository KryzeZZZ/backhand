const db = require('../db');  // can be optimized
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const sql = 'SELECT * FROM `teacher`';
    db.query(sql)
        .then(result => res.send(result[0]))
        .catch(error => res.status(500).send('Internal Server Error'));
});

module.exports = router;
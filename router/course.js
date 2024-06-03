const db = require('../db');  // can be optimized
const express = require('express');
const middleware = require('../middleware/authMiddleware');
const router = express.Router();
const errorCodes = require('../errorCodes');

router.post('/add', middleware, async (req, res) => {
    const bodyPart = req.body;
    const teacher_id = req.user.id;
    const { courseName } = bodyPart;

    if (!courseName) {
        return res.status(400).send({
            code: 1001,
            message: errorCodes[1001]
        });
    }
    const duplicateSql = 'SELECT * FROM course WHERE name = ? AND teacher_id = ?';
    const[checkRes] = await db.query(duplicateSql, [courseName, teacher_id]);
    if (checkRes.length > 0) {
        return res.status(200).send({
            code: 2010,
            message: errorCodes[2010]
        })
    }
    try {
        const sql = 'INSERT INTO course(teacher_id, name) VALUES (?, ?)';
        const [result] = await db.query(sql, [teacher_id, courseName]);

        res.send({
            code: 0,
            message: errorCodes[0]
        });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({
            code: 1000,
            message: errorCodes[1000]
        });
    }
});



router.post('/delete', middleware, async (req, res) => {
    const bodyPart = req.body;
    const { courseId } = bodyPart;
    const teacher_id = req.user.id;

    if (!courseId) {
        return res.status(400).send({
            code: 1001,
            message: errorCodes[1001]
        });
    }

    try {
        const sql = 'UPDATE course SET isDeleted = 1 WHERE id = ?';
        const [result] = await db.query(sql, [courseId]);
        res.send({
            code: 0,
            message: errorCodes[0]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).send({
            code: 1000,
            message: errorCodes[1000]
        });
    }
});



module.exports = router;
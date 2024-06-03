const express = require('express');
const router = express.Router();
const db = require('../db');  // Ensure this is the correct path
const middleware = require('../middleware/authMiddleware');  // Adjust the path if needed
const errorCodes = require('../errorCodes');  // Import error codes

// Apply the middleware to the route
router.get('/', middleware, async (req, res) => {
    const teacher_id = req.user.id;  // Extract teacher_id from the token
    if (!teacher_id || isNaN(teacher_id)) {
        return res.send({
            code: 1002,
            message: errorCodes[1002]  // Invalid parameters
        });
    }
    try {
        const sql = 'SELECT * FROM course WHERE teacher_id = ? and isDeleted = 0';
        const result = await db.query(sql, [teacher_id]);
        if (result[0].length === 0) {
            return res.send({
                code: 2006,
                message: errorCodes[2006]  // Course list is empty
            });
        }
        res.send(result[0]);
    } catch (error) {
        console.error(error);
        res.send({
            code: 1000,
            message: errorCodes[1000]  // Internal error
        });
    }
});

router.get('/:courseId/students', middleware, async (req, res) => {
    const teacher_id = req.user.id;  // Extract teacher_id from the token
    const { courseId } = req.params;

    if (!teacher_id || isNaN(teacher_id) || isNaN(courseId)) {
        return res.send({
            code: 1002,
            message: errorCodes[1002]  // Invalid parameters
        });
    }

    try {
        const studentsSql = 'SELECT id, name FROM student WHERE course_id = ?';
        const students = await db.query(studentsSql, [courseId]);

        const attendancesSql = 'SELECT student_id, date, session, status FROM attendance WHERE course_id = ? ORDER BY class_time DESC';
        const attendances = await db.query(attendancesSql, [courseId]);

        const scoresSql = 'SELECT student_id, class_time AS date, score FROM score WHERE course_id = ? ORDER BY class_time DESC';
        const scores = await db.query(scoresSql, [courseId]);

        const studentsData = students[0].map(student => {
            const studentAttendances = attendances[0].filter(att => att.student_id === student.id)
                .map(att => ({
                    date: att.date,
                    session: att.session,
                    status: att.status
                }));

            const studentScores = scores[0].filter(score => score.student_id === student.id)
                .map(score => ({
                    date: score.date,
                    score: score.score
                }));

            return {
                id: student.id,
                name: student.name,
                attendances: studentAttendances,
                scores: studentScores
            };
        });
        res.send(studentsData);
    } catch (error) {
        console.error(error);
        res.send({
            code: 1000,
            message: errorCodes[1000]  // Internal error
        });
    }
});

router.post('/:courseId/students/:studentId/scores', middleware, async (req, res) => {
    const teacher_id = req.user.id;  // Extract teacher_id from the token
    const { courseId, studentId } = req.params;
    const { date, session, score } = req.body;
    if (!teacher_id || isNaN(teacher_id) || isNaN(courseId) || isNaN(studentId) || !date || isNaN(session) || isNaN(score)) {
        return res.send({
            code: 1002,
            message: errorCodes[1002]  // Invalid parameters
        });
    }

    try {
        const sql = 'INSERT INTO score (student_id, course_id, class_time, score) VALUES (?, ?, ?, ?)';
        await db.query(sql, [studentId, courseId, date, score]);
        res.send({
            code: 0,
            message: errorCodes[0]  // Success
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 1000,
            message: errorCodes[1000]  // Internal error
        });
    }
});

router.post('/:courseId/students', middleware, async (req, res) => {
    const bodyPart = req.body;
    const courseId = req.params.courseId;
    const teacher_id = req.user.id;
    const { studentName } = bodyPart;

    if (!studentName) {
        return res.status(400).send({
            code: 1001,
            message: errorCodes[1001]
        });
    }
    const duplicateSql = 'SELECT * FROM student WHERE name = ? AND course_id = ?';
    const[checkRes] = await db.query(duplicateSql, [studentName, courseId]);
    if (checkRes.length > 0) {
        return res.status(200).send({
            code: 2011,
            message: errorCodes[2011]
        })
    }
    try {
        const sql = 'INSERT INTO student(course_id, name) VALUES (?, ?)';
        const [result] = await db.query(sql, [courseId, studentName]);

        res.send({
            code: 0,
            message: errorCodes[0]
        });
    } catch (error) {
        console.error('Error adding students:', error);
        res.status(500).send({
            code: 1000,
            message: errorCodes[1000]
        });
    }
});
router.post('/:courseId/students/:studentId/attendances', middleware, async (req, res) => {
    const { courseId, studentId } = req.params;
    const { date, session, status, class_time } = req.body;
    const teacher_id = req.user.id;
    console.log(req.body)
    if (!courseId || !studentId || !date || typeof session !== 'number' || typeof status !== 'number') {
        return res.status(400).send({
            code: 1001,
            message: errorCodes[1001]  // Missing parameters
        });
    }

    if (isNaN(courseId) || isNaN(studentId) || isNaN(session) || isNaN(status)) {
        return res.status(400).send({
            code: 1002,
            message: errorCodes[1002]  // Invalid parameters
        });
    }

    try {
        // Verify if the course exists and belongs to the teacher
        const courseSql = 'SELECT * FROM course WHERE id = ? AND teacher_id = ? AND isDeleted = 0';
        const [courseResult] = await db.query(courseSql, [courseId, teacher_id]);

        if (courseResult.length === 0) {
            return res.status(404).send({
                code: 2004,
                message: errorCodes[2004]  // Course not found
            });
        }

        // Verify if the student exists in the course
        const studentSql = 'SELECT * FROM student WHERE id = ? AND course_id = ?';
        const [studentResult] = await db.query(studentSql, [studentId, courseId]);

        if (studentResult.length === 0) {
            return res.status(404).send({
                code: 2005,
                message: errorCodes[2005]  // Student not found
            });
        }

        // Insert the attendance record
        const insertSql = 'INSERT INTO attendance (student_id, course_id, date, session, status, class_time) VALUES (?, ?, ?, ?, ?, ?)';
        await db.query(insertSql, [studentId, courseId, date, session, status, class_time]);

        res.send({
            code: 0,
            message: errorCodes[0]  // Success
        });
    } catch (error) {
        console.error('Error adding attendance record:', error);
        res.status(500).send({
            code: 1000,
            message: errorCodes[1000]  // Internal error
        });
    }
});

module.exports = router;

const coursesRouter = require('./courses')
const teacherRouter = require('./teacher')
const actionRouter = require('./action')
const courseRouter = require('./course')

module.exports = app => {
    app.use('/courses', coursesRouter)
    app.use('/teacher', teacherRouter)
    app.use('/action', actionRouter)
    app.use('/course', courseRouter)
}
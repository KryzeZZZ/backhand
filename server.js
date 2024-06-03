const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const router = require('./router');
router(app);

const port = 5050;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
});



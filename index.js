require('dotenv').config();
const cors = require('cors');
const express = require('express');
const authRouter = require('./controllers/authentication')

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
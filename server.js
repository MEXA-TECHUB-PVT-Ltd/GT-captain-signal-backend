const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')

const pool = require("././app/config/dbconfig")
const imageUploadRouter = require('./app/uploadimage');

const app = express();
const port = 4000;

dotenv.config();

app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

app.use(express.json())

app.use('/uploadimage', imageUploadRouter);
app.use("/admin", require("./app/routes/admin/adminroutes"))
app.use("/user", require("./app/routes/user/userroutes"))
app.use("/signal", require("./app/routes/signal/signalroutes"))
app.use("/takeprofit", require("./app/routes/takeprofit/takeprofitroutes"))
app.use("/broker", require("./app/routes/broker/brokerroutes"))
app.get('/', (req, res) => {
    res.json({ message: 'GT Caption Signals !' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
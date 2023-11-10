const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')
const socketIo = require('socket.io');
const bodyParser = require("body-parser");
const http = require('http');

const pool = require("././app/config/dbconfig")
const imageUploadRouter = require('./app/uploadimage');

const app = express();
// const io = socketIo(server);
const port = 4000;

dotenv.config();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

app.use(express.json())

app.use('/uploadimage', imageUploadRouter);
app.use("/admin", require("./app/routes/admin/adminroutes"))
app.use("/user", require("./app/routes/user/userroutes"))
app.use("/applink", require("./app/routes/applink/applinkroutes"))
app.use("/ratelink", require("./app/routes/ratelink/ratelinkroutes"))
app.use("/signal", require("./app/routes/signal/signalroutes"))
app.use("/takeprofit", require("./app/routes/takeprofit/takeprofitroutes"))
app.use("/broker", require("./app/routes/broker/brokerroutes"))
app.use("/wishlist", require("./app/routes/wishlist/wishlistroutes"))
app.get('/', (req, res) => {
    res.json({ message: 'GT Caption Signals !' });
});

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*',
        credentials: true,
    },
});
io.on("connection", (socket) => {
    console.log("Socket Connected ===>" + socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        io.to(room).emit('message', { user: 'admin', text: `${socket.id} has joined!` });
    });

    socket.on('sendMessage', (data) => {
        io.to(data.room).emit('message', { user: socket.id, text: data.text });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

});

server.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
}); 
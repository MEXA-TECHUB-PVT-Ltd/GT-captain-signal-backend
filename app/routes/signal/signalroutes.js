const express = require('express');
const router = express.Router();
const signalController = require("../../controllers/signalcontroller");

router.post('/create', signalController.createsignal);
router.get('/getall', signalController.gettallsignals);
router.post('/createtakeprofit', signalController.createTakeProfit);

module.exports = router;
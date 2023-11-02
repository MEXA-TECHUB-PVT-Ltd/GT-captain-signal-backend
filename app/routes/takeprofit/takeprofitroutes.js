const express = require('express');
const router = express.Router();
const takeprofitController = require("../../controllers/takeprofitcontroller");

router.post('/createtakeprofit', takeprofitController.createTakeProfit);
router.get('/getalltakeprofits', takeprofitController.getAllTakeProfits);
router.get('/takeprofit/signal_id/:signal_id', takeprofitController.getTakeProfitsBySignalId);
router.get('/takeprofitbyID/:take_profit_id', takeprofitController.getTakeProfitbyID);
router.put('/updatetakeprofit/:take_profit_id', takeprofitController.updateTakeProfit);
router.delete('/deletetakeprofit/:take_profit_id', takeprofitController.deleteTakeProfit);

module.exports = router;
const express = require('express');
const router = express.Router();
const brokerController = require("../../controllers/brokercontroller");

router.post('/createbroker', brokerController.createbroker);
router.get('/getallbrokers', brokerController.getallbroker);
router.get('/getbrokerbyID/:broker_id', brokerController.getbrokerbyID);
router.delete('/deletebroker/:broker_id', brokerController.deletebroker);
router.put('/updatebroker/broker_id', brokerController.updateBroker);

module.exports = router;
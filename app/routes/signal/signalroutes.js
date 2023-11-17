const express = require('express'); 
const router = express.Router();
const signalController = require("../../controllers/signalcontroller");

router.post('/createsignal', signalController.createsignal);
router.get('/getallsignals', signalController.gettallsignals);
router.get('/getsignalbyID/:signal_id', signalController.getSignalById);
router.put('/updatesignal/:signal_id', signalController.updateSignalById);
router.delete('/deletesignal/:signal_id', signalController.deleteSignalById);
router.put('/updatesignalstatus/:signal_id', signalController.updateSignalStatus);

module.exports = router;
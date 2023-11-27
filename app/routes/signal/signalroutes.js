const express = require('express'); 
const router = express.Router();
const signalController = require("../../controllers/signalcontroller");

router.post('/createsignal', signalController.createsignal);
router.get('/getallsignals', signalController.gettallsignals);
router.get('/getsignalbyID/:signal_id', signalController.getSignalById);
router.put('/updatesignal/:signal_id', signalController.updateSignalById);
router.delete('/deletesignal/:signal_id', signalController.deleteSignalById);
router.put('/updatesignalstatus/:signal_id', signalController.updateSignalStatus);
router.get('/getuserssignals/:userId', signalController.getUserSignals);  
router.post('/add_signal_result', signalController.createSignalResult);
router.put('/update_signal_result/:signal_id', signalController.updateSignalResult);
router.post('/search_signal_byname', signalController.searchsignalbyname);  
module.exports = router;
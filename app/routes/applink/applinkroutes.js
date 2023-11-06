const express = require('express');
const router = express.Router();
const applinkController = require("../../controllers/applinkcontroller");

router.post('/createlink', applinkController.createapplink);
router.get('/getapplink', applinkController.getapplink); 
router.get('/getapplinkbyID/:id', applinkController.getapplinkbyID);
router.delete('/deleteapplink/:id', applinkController.deleteapplink); 
router.put('/updateapplink/:id', applinkController.updateApplinkByID);    

module.exports = router;
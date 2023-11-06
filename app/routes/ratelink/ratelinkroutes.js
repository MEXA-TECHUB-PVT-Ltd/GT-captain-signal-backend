const express = require('express');
const router = express.Router();
const ratelinkController = require("../../controllers/ratelinkcontroller");

router.post('/createlink', ratelinkController.createratelink);
router.get('/getratelink', ratelinkController.getratelink); 
router.get('/getratelinkbyID/:id', ratelinkController.getratelinkbyID);
router.delete('/deleteratelink/:id', ratelinkController.deleteratelink); 
router.put('/updateratelink/:id', ratelinkController.updateratelink);    

module.exports = router;
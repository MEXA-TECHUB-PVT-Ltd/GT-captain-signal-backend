const express = require('express');
const router = express.Router();
const chatlinkController = require("../../controllers/chatlinkcontroller");

router.post('/createlink', chatlinkController.createChatLink);
router.put('/updatechatlink/:id', chatlinkController.updateChatLink);
router.delete('/deletechatink/:id', chatlinkController.deleteChatLink);
router.get('/getchatlink', chatlinkController.getChatLink);
router.get('/getchatlinkbyID/:id', chatlinkController.getChatLinkByID);

module.exports = router;
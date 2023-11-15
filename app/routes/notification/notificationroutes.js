const express = require('express');
const router = express.Router();
const notificationController = require("../../controllers/notificationscontroller");

router.post('/create', notificationController.createnotification);
router.get('/getall', notificationController.getAllNotifications);
router.get('/getnotificationbyID/:id', notificationController.getNotificationById);
router.delete('/delete/userID/:id', notificationController.deleteNotificationsByUserId);
router.put('/update/:id', notificationController.updateNotification); 

module.exports = router;
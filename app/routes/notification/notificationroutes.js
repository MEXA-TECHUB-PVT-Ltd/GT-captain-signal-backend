const express = require('express');
const router = express.Router();
const notificationController = require("../../controllers/notificationscontroller");

// router.post('/create', notificationController.createnotification);
router.get('/getall', notificationController.getAllNotifications);
router.get('/getnotificationbyID/:notificationId', notificationController.getNotificationById);
router.get('/get_notification_byuserID/:userId', notificationController.getNotificationsByUserId);
// router.put('/update/:id', notificationController.updateNotification); 

module.exports = router;
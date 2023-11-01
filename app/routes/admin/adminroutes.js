const express = require('express');
const router = express.Router();
const adminController = require("../../controllers/admin");

router.post('/signup', adminController.adminsignup);
router.post('/signin', adminController.login);

module.exports = router;
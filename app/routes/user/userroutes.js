const express = require('express');
const router = express.Router();
const userController = require("../../controllers/usercontroller");

router.post('/usersignup', userController.usersignup);
router.post('/usersignin', userController.usersignin);
router.get('/getallusers', userController.getallusers);
router.get('/getuser/userbyID/:id', userController.getalluserbyID);
router.put('/updateuser/userprofile/:id', userController.updateuserprofile);
router.post('/password/forgetpassword', userController.forgetpassword);
router.put('/password/updatepassword', userController.updatepassword);
router.delete('/delete/deleteuser/:id', userController.deleteuser);
router.get('/deleteusers/getall', userController.getalldeletedusers); 
router.post('/restore/restoreusers/:id', userController.restoreuser);  

module.exports = router;
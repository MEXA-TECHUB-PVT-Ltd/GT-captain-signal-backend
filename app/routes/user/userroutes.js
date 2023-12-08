const express = require('express');
const router = express.Router();
const userController = require("../../controllers/usercontroller");

router.post('/usersignup', userController.usersignup);
router.post('/verify_signup', userController.verifySignup); 
router.post('/usersignin', userController.usersignin);
router.get('/getallusers', userController.getallusers);
router.get('/getuser/userbyID/:id', userController.getalluserbyID);
router.put('/updateuser/userprofile/:id', userController.updateuserprofile);
router.post('/password/forgetpassword', userController.forgetpassword);
router.put('/password/resetpassword', userController.resetpassword);
router.put('/password/updatepassword', userController.updatePassword);  
router.delete('/deleteuser/:id', userController.deleteuser); 
router.get('/deleteusers/getall', userController.getalldeletedusers); 
router.delete('/deleteuserpermanently/:id', userController.deleteuserpermanently);
router.put('/updateUserStatus/:userId', userController.updateuserstatus);  

module.exports = router;
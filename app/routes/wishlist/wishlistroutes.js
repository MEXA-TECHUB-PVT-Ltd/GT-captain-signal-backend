const express = require('express');
const router = express.Router();
const wishlistController = require("../../controllers/wishlistcontroller");

router.post('/createwishlist', wishlistController.addToWishlist);
router.get('/getallwishlist', wishlistController.getallwishlists);
router.delete('/deletewishlist/signal_id/:signal_id', wishlistController.deletewishlists);
router.get('/getSignalsByUserId/:userId', wishlistController.getSignalsByUserId);
router.delete('/removesignalbyuserID', wishlistController.removesignalbyuserID);
router.post('/check_save_item', wishlistController.checksaveitem); 

module.exports = router;
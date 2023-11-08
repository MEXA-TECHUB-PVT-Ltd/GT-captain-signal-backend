const express = require('express');
const router = express.Router();
const wishlistController = require("../../controllers/wishlistcontroller");

router.post('/createwishlist', wishlistController.addToWishlist);
router.get('/getallwishlist', wishlistController.getallwishlists);
router.delete('/deletewishlist/signal_id/:signal_id', wishlistController.deletewishlists);
router.get('/getSignalsByUserId/:userId', wishlistController.getSignalsByUserId);

module.exports = router;
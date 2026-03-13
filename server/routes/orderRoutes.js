const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const orderController = require("../controllers/orderController");

router.use(protect);

router.post("/", orderController.createOrder);
router.get("/me", orderController.getMyOrders);

module.exports = router;
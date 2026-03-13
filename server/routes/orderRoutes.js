const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const orderController = require("../controllers/orderController");

router.use(auth);

router.post("/", orderController.createOrder);
router.get("/me", orderController.getMyOrders);

module.exports = router;
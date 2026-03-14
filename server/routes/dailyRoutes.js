const express = require("express");
const router = express.Router();
const dailyController = require("../controllers/dailyController");

router.get("/currency", dailyController.getCurrencySnapshot);
router.get("/weather", dailyController.getWeatherSnapshot);
router.get("/profile-proxy/:userId", dailyController.getExternalProfileProxy);

module.exports = router;
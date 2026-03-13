const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { loginRateLimiter, protect } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.put("/change-password", protect, authController.changePassword);
router.post("/logout", protect, authController.logout);

module.exports = router;
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/check-username", userController.checkUsernameAvailability);

router.get("/", protect, restrictTo("manager", "editor"), userController.getAllUsers);
router.post("/", protect, restrictTo("admin"), userController.createUser);
router.get("/search", protect, userController.searchUsers);
router.get("/username/:username", protect, userController.getUserByUsername);
router.get("/:id", protect, userController.getUserById);
router.delete("/:id", protect, restrictTo("admin"), userController.softDeleteUser);

module.exports = router;
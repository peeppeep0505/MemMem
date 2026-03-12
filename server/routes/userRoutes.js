const express = require("express")
const router = express.Router()

const userController = require("../controllers/userController")

router.get("/", userController.getAllUsers)
router.get("/search", userController.searchUsers);
router.get("/username/:username", userController.getUserByUsername);
router.get("/:id", userController.getUserById);

module.exports = router
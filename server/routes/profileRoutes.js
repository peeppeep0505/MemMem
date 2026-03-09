const express = require("express")
const router = express.Router()

const profileController = require("../controllers/profileController")

router.get("/user/:userId", profileController.getProfile)
router.put("/update/:userId", profileController.updateProfile)

module.exports = router
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/profileController");
const upload = require("../middleware/upload");

router.get("/user/:userId", ctrl.getProfile);
router.get("/username/:username", ctrl.getProfileByUsername);
router.put("/update/:userId", upload.single("image"), ctrl.updateProfile);

module.exports = router;
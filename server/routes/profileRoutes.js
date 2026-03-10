const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/profileController");
const upload = require("../middleware/upload");

router.get("/user/:userId", ctrl.getProfile);
router.put("/update/:userId", upload.single("image"), ctrl.updateProfile);

module.exports = router;
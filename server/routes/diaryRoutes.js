const express = require("express")
const router = express.Router()

const diaryController = require("../controllers/diaryController")
const upload = require("../middleware/upload")

router.post("/create", upload.single("image"), diaryController.createDiary)
router.get("/user/:userId",diaryController.getUserDiary)
router.put("/update/:id",upload.single("image"), diaryController.updateDiary)
router.delete("/delete/:id",diaryController.deleteDiary)

module.exports = router


// server/routes/diaryRoutes.js

const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/diaryController");
const upload     = require("../middleware/upload");

router.post(  "/create",             upload.single("image"), ctrl.createDiary);
router.get(   "/user/:userId",                               ctrl.getUserDiary);
router.get(   "/user/:userId/month",                         ctrl.getDiaryByMonth); // ✅ ?month=YYYY-MM
router.get(   "/:id",                                        ctrl.getDiaryById);    // ✅ ใหม่ สำหรับ Edit
router.put(   "/update/:id",         upload.single("image"), ctrl.updateDiary);
router.delete("/delete/:id",                                 ctrl.deleteDiary);

module.exports = router;
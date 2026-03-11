// ✅ แก้ใน postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const upload = require("../middleware/upload");

router.post("/create", upload.array("images", 4), postController.createPost);
router.get("/my/:userId", postController.getMyPosts);        // ← เพิ่ม
router.get("/friends/:userId", postController.getFriendPosts); // ← เพิ่ม
router.put("/like/:id", postController.likePost);
router.delete("/delete/:id", postController.deletePost);

module.exports = router;
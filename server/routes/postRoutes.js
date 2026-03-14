const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const upload = require("../middleware/upload");

router.post("/create", upload.array("images", 4), postController.createPost);
router.get("/my/:userId", postController.getMyPosts);
router.get("/friends/:userId", postController.getFriendPosts);
router.put("/like/:id", postController.likePost);
router.post("/comment/:id", postController.addComment);
router.delete("/delete/:id", postController.deletePost);

module.exports = router;
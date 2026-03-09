const express = require("express")
const router = express.Router()

const postController = require("../controllers/postController")
const upload = require("../middleware/upload")

router.post("/create", upload.single("image"), postController.createPost)
router.put("/like/:id",postController.likePost)
router.delete("/delete/:id",postController.deletePost)

module.exports = router
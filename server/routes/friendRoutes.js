const express = require("express")
const router = express.Router()

const friendController = require("../controllers/friendController")

router.post("/request", friendController.sendRequest)
router.put("/accept/:id", friendController.acceptRequest)
router.put("/decline/:id", friendController.declineRequest)
router.delete("/remove/:userId/:friendId", friendController.removeFriend)
router.get("/:userId", friendController.getFriends)
router.get("/requests/:userId", friendController.getFriendRequests)

module.exports = router
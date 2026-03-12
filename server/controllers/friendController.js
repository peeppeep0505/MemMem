const FriendRequest = require("../models/FriendRequest")
const User = require("../models/User")

exports.sendRequest = async (req,res)=>{

  const { sender, receiver } = req.body

  const request = await FriendRequest.create({
    sender,
    receiver
  })

  res.json(request)

}

exports.acceptRequest = async (req,res)=>{

  const request = await FriendRequest.findById(req.params.id)

  request.status = "accepted"
  await request.save()

  await User.findByIdAndUpdate(request.sender,{
    $push:{ friends: request.receiver }
  })

  await User.findByIdAndUpdate(request.receiver,{
    $push:{ friends: request.sender }
  })

  res.json({message:"Friend added"})
}

exports.declineRequest = async (req,res)=>{

  await FriendRequest.findByIdAndUpdate(
    req.params.id,
    { status:"rejected" }
  )

  res.json({message:"Request declined"})
}

exports.removeFriend = async (req,res)=>{

  const { userId, friendId } = req.params

  await User.findByIdAndUpdate(userId,{
    $pull:{ friends: friendId }
  })

  await User.findByIdAndUpdate(friendId,{
    $pull:{ friends: userId }
  })

  res.json({message:"Friend removed"})
}

exports.getFriends = async (req,res)=>{

  const user = await User.findById(req.params.userId)
    .populate("friends","username profilePic")

  res.json(user.friends)
}

exports.getFriendRequests = async (req,res)=>{

  const requests = await FriendRequest.find({
    receiver: req.params.userId,
    status: "pending"
  }).populate("sender","username profilePic")

  res.json(requests)
}

exports.searchUsers = async (req, res) => {

  try {
    const { keyword, currentUserId } = req.query
    if (!keyword) {
      return res.json([])
    }
    const users = await User.find({
      _id: { $ne: currentUserId }, 
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } }
      ]
    })
    .select("_id username name profilePic")
    .limit(20)

    res.json(users)

  } catch (error) {
    console.error("searchUsers error:", error)
    res.status(500).json({ message: "Failed to search users" })

  }

}
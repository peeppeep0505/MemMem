const User = require("../models/User")
const FriendRequest = require("../models/FriendRequest")

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id username name email profilePic friends")
      .sort({ createdAt: -1 })

    res.json(users)
  } catch (error) {
    console.error("getAllUsers error:", error)
    res.status(500).json({ message: "Failed to get users" })
  }
}

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("_id username name email profilePic friends bio")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("getUserById error:", error)
    res.status(500).json({ message: "Failed to get user" })
  }
}

// GET /api/users/search?keyword=abc&currentUserId=xxx
exports.searchUsers = async (req, res) => {
  try {
    const { keyword = "", currentUserId } = req.query

    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword) {
      return res.json([])
    }

    const currentUser = currentUserId
      ? await User.findById(currentUserId).select("friends")
      : null

    const currentFriendIds = currentUser?.friends?.map((id) => id.toString()) || []

    const pendingRequests = currentUserId
      ? await FriendRequest.find({
          $or: [
            { sender: currentUserId, status: "pending" },
            { receiver: currentUserId, status: "pending" },
          ],
        }).select("sender receiver")
      : []

    const pendingUserIds = pendingRequests.flatMap((req) => [
      req.sender?.toString(),
      req.receiver?.toString(),
    ])

    const excludedIds = [
      ...(currentUserId ? [currentUserId.toString()] : []),
      ...currentFriendIds,
      ...pendingUserIds,
    ]

    const users = await User.find({
      _id: { $nin: excludedIds },
      $or: [
        { username: { $regex: trimmedKeyword, $options: "i" } },
        { name: { $regex: trimmedKeyword, $options: "i" } },
        { email: { $regex: trimmedKeyword, $options: "i" } },
      ],
    })
      .select("_id username name email profilePic")
      .limit(20)

    res.json(users)
  } catch (error) {
    console.error("searchUsers error:", error)
    res.status(500).json({ message: "Failed to search users" })
  }
}

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("_id username name email bio profilePic backgroundColor friends");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let postCount = 0;
    try {
      postCount = await Post.countDocuments({ user: user._id });
    } catch (err) {
      // กันกรณี schema post ของคุณใช้ field คนละชื่อ
      postCount = 0;
    }

    return res.json({
      _id: user._id,
      username: user.username,
      name: user.name || "",
      email: user.email || "",
      bio: user.bio || "",
      profilePic: user.profilePic || "",
      backgroundColor: user.backgroundColor || "#9ca3af",
      friends: user.friends || [],
      friendCount: user.friends?.length || 0,
      postCount,
    });
  } catch (error) {
    console.error("getUserByUsername error:", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
};
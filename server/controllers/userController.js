const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

function sanitizeUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
}

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password = `Temp${Date.now()}!`,
      role = "user",
    } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      isDeleted: false,
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to create user" });
  }
};

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select("_id username email profilePic friends bio backgroundColor role isDeleted")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).select("_id username email profilePic friends bio backgroundColor role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};

// GET /api/users/search?keyword=abc&currentUserId=xxx
exports.searchUsers = async (req, res) => {
  try {
    const { keyword = "", currentUserId } = req.query;
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      return res.json([]);
    }

    const currentUser = currentUserId
      ? await User.findOne({ _id: currentUserId, isDeleted: false }).select("friends")
      : null;

    const currentFriendIds = currentUser?.friends?.map((id) => id.toString()) || [];

    const pendingRequests = currentUserId
      ? await FriendRequest.find({
          $or: [
            { sender: currentUserId, status: "pending" },
            { receiver: currentUserId, status: "pending" },
          ],
        }).select("sender receiver")
      : [];

    const pendingUserIds = pendingRequests.flatMap((req) => [
      req.sender?.toString(),
      req.receiver?.toString(),
    ]);

    const excludedIds = [
      ...(currentUserId ? [currentUserId.toString()] : []),
      ...currentFriendIds,
      ...pendingUserIds,
    ];

    const users = await User.find({
      isDeleted: false,
      _id: { $nin: excludedIds },
      $or: [
        { username: { $regex: trimmedKeyword, $options: "i" } },
        { email: { $regex: trimmedKeyword, $options: "i" } },
      ],
    })
      .select("_id username email profilePic role")
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("searchUsers error:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username,
      isDeleted: false,
    }).select("_id username email bio profilePic backgroundColor friends role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email || "",
      bio: user.bio || "",
      profilePic: user.profilePic || "",
      backgroundColor: user.backgroundColor || "#9ca3af",
      friends: user.friends || [],
      friendCount: user.friends?.length || 0,
      role: user.role,
    });
  } catch (error) {
    console.error("getUserByUsername error:", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
};

// GET /api/users/check-username?username=admin
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const username = String(req.query.username || "").trim();

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const existing = await User.findOne({
      username,
      isDeleted: false,
    }).select("_id");

    return res.json({
      available: !existing,
      message: existing ? "Username นี้มีคนใช้ไปแล้ว" : "Username available",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check username" });
  }
};

// DELETE /api/users/:id
exports.softDeleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    ).select("_id username email role isDeleted deletedAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
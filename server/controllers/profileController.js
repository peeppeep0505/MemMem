const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to get profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const imgBase64 = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : undefined;

    const updateData = {
      ...req.body,
    };

    if (imgBase64) {
      updateData.profilePic = imgBase64;
    }

    if (!updateData.backgroundColor) {
      updateData.backgroundColor = "#9ca3af";
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};
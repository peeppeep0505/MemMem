const User = require("../models/User");

function parseMaybeObject(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to get profile" });
  }
};

exports.getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
      isDeleted: false,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to get profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const imgBase64 = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : undefined;

    const body = req.body || {};

    const dynamicProfileData = parseMaybeObject(body.dynamicProfileData, {});
    const preferences = parseMaybeObject(body.preferences, {});
    const socialLinks = parseMaybeObject(body.socialLinks, {});

    const username = String(body.username || "").trim();
    const bio = String(body.bio || "").trim();
    const role = String(body.role || "user").trim();
    const adminCode = String(body.adminCode || "").trim();
    const backgroundColor = String(body.backgroundColor || "#9ca3af").trim();

    if (!username) {
      return res.status(400).json({ message: "Display Name is required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res
        .status(400)
        .json({ message: "Display Name must be between 3 and 30 characters" });
    }

    if (bio.length > 200) {
      return res.status(400).json({ message: "Bio must be 200 characters or less" });
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)) {
      return res.status(400).json({ message: "Background color must be a valid hex color" });
    }

    const allowedRoles = ["guest", "user", "editor", "manager", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role === "admin" && !adminCode) {
      return res.status(400).json({
        message: "Admin Code is required when role is admin",
      });
    }

    const duplicateUser = await User.findOne({
      username,
      _id: { $ne: req.params.userId },
    });

    if (duplicateUser) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const updateData = {
      username,
      bio,
      role,
      adminCode: role === "admin" ? adminCode : "",
      backgroundColor,
      preferences: {
        showSocialLinks: !!preferences?.showSocialLinks,
      },
      socialLinks: {
        facebook: String(socialLinks?.facebook || "").trim(),
        instagram: String(socialLinks?.instagram || "").trim(),
        github: String(socialLinks?.github || "").trim(),
      },
      dynamicProfileData,
    };

    if (imgBase64) {
      updateData.profilePic = imgBase64;
    } else if (typeof body.imageBase64 === "string" && body.imageBase64.startsWith("data:image/")) {
      updateData.profilePic = body.imageBase64;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};
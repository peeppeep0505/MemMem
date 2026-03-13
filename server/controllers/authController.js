const User = require("../models/User");
const {
  sendToken,
  registerFailedLogin,
  clearLoginAttempts,
  blacklistToken,
  parseToken,
  getClientIp,
} = require("../middleware/auth");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role && ["user", "editor", "manager", "admin"].includes(role) ? role : "user",
      isDeleted: false,
    });

    return sendToken(user, 201, res);
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Registration failed",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIp(req);

    if (!email || !password) {
      await sleep(2000);
      registerFailedLogin(ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    }).select("+password");

    if (!user) {
      await sleep(2000);
      registerFailedLogin(ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isCorrect = await user.correctPassword(password, user.password);

    if (!isCorrect) {
      await sleep(2000);
      registerFailedLogin(ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    clearLoginAttempts(ip);
    return sendToken(user, 200, res);
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await user.correctPassword(oldPassword, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to change password" });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = parseToken(req);
    if (token) {
      blacklistToken(token);
    }

    res.cookie("jwt", "logged-out", {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000),
    });

    return res.json({ message: "Logout success" });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed" });
  }
};
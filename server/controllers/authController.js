const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hash,
  });

  res.json(user);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json("User not found");
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json("Wrong password");
  
  const token = jwt.sign({ id: user._id }, "secret");
  
  const { password: _, ...userWithoutPassword } = user.toObject();
  res.json({ token, user: userWithoutPassword });
};

exports.changePassword = async (req,res)=>{

  const { userId, oldPassword, newPassword } = req.body

  const user = await User.findById(userId)

  const match = await bcrypt.compare(oldPassword,user.password)

  if(!match){
    return res.status(400).json("Wrong old password")
  }

  const hash = await bcrypt.hash(newPassword,10)

  user.password = hash

  await user.save()

  res.json({message:"Password updated"})
}

exports.softDeleteUser = async (req,res)=>{

  await User.findByIdAndUpdate(
    req.params.userId,
    { isDeleted:true }
  )

  res.json({message:"User deleted"})
}

exports.logout = async (req, res) => {
  try {
    return res.json({
      message: "Logout success",
    });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

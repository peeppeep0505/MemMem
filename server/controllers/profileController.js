const User = require("../models/User")

exports.getProfile = async (req,res)=>{

  const user = await User.findById(req.params.userId)
    .select("-password")

  res.json(user)
}

exports.updateProfile = async (req,res)=>{

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    req.body,
    { new:true }
  )

  res.json(user)
}
const jwt = require("jsonwebtoken")

module.exports = (req,res,next)=>{

  const token = req.headers.authorization

  if(!token){
    return res.status(401).json("No token")
  }

  try{

    const decoded = jwt.verify(token,"secret")

    req.user = decoded

    next()

  }catch(err){

    res.status(401).json("Invalid token")

  }

}
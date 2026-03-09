const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  text:String,

  images:[String], 

  likes:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  ]

})

module.exports = mongoose.model("Post",postSchema)
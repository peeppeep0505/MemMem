const mongoose = require("mongoose")

const diarySchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  date:Date,

  mood:String,

  title:String,

  description:String,

  img:String   // base64

})

module.exports = mongoose.model("Diary",diarySchema)
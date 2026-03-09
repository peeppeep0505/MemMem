const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    text: String,

    status: {
      type: String,
      enum: ["active", "complete"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
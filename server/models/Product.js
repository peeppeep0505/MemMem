const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Title", "Badge", "Theme"],
      default: "Title",
    },
    originalPrice: {
      type: Number,
      required: true,
      min: [0, "Price cannot be less than 0"],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be less than 0"],
      max: [100, "Discount cannot be more than 100"],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be less than 0"],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    rarity: {
      type: String,
      enum: ["Common", "Rare", "Epic", "Legendary"],
      default: "Common",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("salePrice").get(function () {
  const discount = (this.originalPrice * this.discountPercent) / 100;
  return Number((this.originalPrice - discount).toFixed(2));
});

module.exports = mongoose.model("Product", productSchema);
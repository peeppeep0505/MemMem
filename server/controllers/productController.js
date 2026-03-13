const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  try {
    const {
      q = "",
      category,
      minPrice,
      maxPrice,
      rarity,
      activeOnly = "true",
      sort = "newest",
    } = req.query;

    const filter = {};

    if (activeOnly === "true") {
      filter.isActive = true;
    }

    if (category) {
      filter.category = category;
    }

    if (rarity) {
      filter.rarity = rarity;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.originalPrice = {};
      if (minPrice) filter.originalPrice.$gte = Number(minPrice);
      if (maxPrice) filter.originalPrice.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { originalPrice: 1 };
    if (sort === "price-desc") sortOption = { originalPrice: -1 };
    if (sort === "name-asc") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };

    const products = await Product.find(filter).sort(sortOption);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch product" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Failed to create product",
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Failed to update product",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product archived successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to archive product",
    });
  }
};

exports.getProductStats = async (_req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          salePrice: {
            $subtract: [
              "$originalPrice",
              {
                $multiply: [
                  "$originalPrice",
                  { $divide: ["$discountPercent", 100] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgSalePrice: { $avg: "$salePrice" },
          maxSalePrice: { $max: "$salePrice" },
          minSalePrice: { $min: "$salePrice" },
          totalProducts: { $sum: 1 },
        },
      },
    ]);

    if (!stats.length) {
      return res.json({
        avgSalePrice: 0,
        maxSalePrice: 0,
        minSalePrice: 0,
        totalProducts: 0,
      });
    }

    const result = stats[0];
    res.json({
      avgSalePrice: Number((result.avgSalePrice || 0).toFixed(2)),
      maxSalePrice: Number((result.maxSalePrice || 0).toFixed(2)),
      minSalePrice: Number((result.minSalePrice || 0).toFixed(2)),
      totalProducts: result.totalProducts || 0,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to load product stats",
    });
  }
};
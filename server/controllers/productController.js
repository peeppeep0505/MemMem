const Product = require("../models/Product");

function parseArrayQuery(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  return [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

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
      page = 1,
      limit = 12,
    } = req.query;

    const categoryList = parseArrayQuery(category);
    const currentPage = parsePositiveInt(page, 1);
    const pageSize = parsePositiveInt(limit, 12);
    const skip = (currentPage - 1) * pageSize;

    const filter = {};

    if (activeOnly === "true") {
      filter.isActive = true;
    }

    if (categoryList.length > 0) {
      filter.category = { $all: categoryList };
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

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    const totalPages = totalProducts === 0 ? 0 : Math.ceil(totalProducts / pageSize);

    res.json({
      data: products,
      metadata: {
        page: currentPage,
        limit: pageSize,
        totalPosts: totalProducts,
        totalProducts,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
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


function parseArrayQuery(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  return [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];
}

function normalizeProductPayload(item) {
  const payload = { ...item };

  if (payload.category !== undefined) {
    payload.category = parseArrayQuery(payload.category);
  }

  return payload;
}

exports.createProduct = async (req, res) => {
  try {
    const body = req.body;

    if (Array.isArray(body)) {
      if (body.length === 0) {
        return res.status(400).json({ message: "Product array is empty" });
      }

      const payloads = body.map(normalizeProductPayload);

      const createdProducts = await Product.insertMany(payloads, {
        ordered: true,
      });

      return res.status(201).json({
        message: "Products created successfully",
        count: createdProducts.length,
        data: createdProducts,
      });
    }

    const payload = normalizeProductPayload(body);
    const product = await Product.create(payload);

    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Failed to create product(s)",
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.category !== undefined) {
      payload.category = parseArrayQuery(payload.category);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      payload,
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
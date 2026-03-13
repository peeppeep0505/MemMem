const express = require("express");
const router = express.Router();

const { protect, restrictTo } = require("../middleware/auth");
const productController = require("../controllers/productController");

router.get("/", productController.getProducts);
router.get("/stats", productController.getProductStats);
router.get("/:productId", productController.getProductById);

router.post("/", protect, restrictTo("editor", "manager"), productController.createProduct);
router.put("/:productId", protect, restrictTo("editor", "manager"), productController.updateProduct);
router.delete("/:productId", protect, restrictTo("admin"), productController.deleteProduct);

module.exports = router;
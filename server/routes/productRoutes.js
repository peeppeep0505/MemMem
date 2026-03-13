const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const productController = require("../controllers/productController");

router.get("/", productController.getProducts);
router.get("/stats", productController.getProductStats);
router.get("/:productId", productController.getProductById);

// ตอนนี้เปิดให้ auth ก่อน ถ้าภายหลังมี role ค่อย restrict admin ได้
router.post("/", auth, productController.createProduct);
router.put("/:productId", auth, productController.updateProduct);
router.delete("/:productId", auth, productController.deleteProduct);

module.exports = router;
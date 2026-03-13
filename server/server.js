require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("MemMem API running");
});

// Function 3.1 equivalent: query token + JSON status
app.get("/scan", (req, res) => {
  const userToken = req.query.token;

  if (userToken === "admin") {
    return res.status(200).json({
      status: "authorized",
      clearance: "high",
    });
  }

  return res.status(401).json({
    status: "unauthorized",
    message: "Invalid token",
  });
});

const authRoutes = require("./routes/authRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const postRoutes = require("./routes/postRoutes");
const friendRoutes = require("./routes/friendRoutes");
const todoRoutes = require("./routes/todoRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/post", postRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MemMem API running on http://localhost:${PORT}`);
});
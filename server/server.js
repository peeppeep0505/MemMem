const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MemMem API running");
});

const authRoutes = require("./routes/authRoutes")
const diaryRoutes = require("./routes/diaryRoutes")
const postRoutes = require("./routes/postRoutes")
const friendRoutes = require("./routes/friendRoutes")
const todoRoutes = require("./routes/todoRoutes")
const profileRoutes = require("./routes/profileRoutes")


app.use("/api/auth",authRoutes)
app.use("/api/diary",diaryRoutes)
app.use("/api/post",postRoutes)
app.use("/api/friends", friendRoutes)
app.use("/api/todos", todoRoutes)
app.use("/api/profile", profileRoutes)

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
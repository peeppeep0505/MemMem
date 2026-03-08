import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/diary", diaryRoutes)
app.use("/api/todo", todoRoutes)
app.use("/api/users", userRoutes)

app.listen(5000, () => {
  console.log("Server running on port 5000")
})
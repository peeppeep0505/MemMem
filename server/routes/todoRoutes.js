const express = require("express")
const router = express.Router()

const todoController = require("../controllers/todoController")

router.post("/create", todoController.createTodo)

router.get("/user/:userId", todoController.getUserTodos)

router.put("/update/:id", todoController.updateTodo)

router.delete("/delete/:id", todoController.deleteTodo)

module.exports = router
const Todo = require("../models/ToDo");

exports.createTodo = async (req, res) => {
  const todo = await Todo.create(req.body);

  res.json(todo);
};

exports.toggleTodo = async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  todo.status = todo.status === "active" ? "complete" : "active";

  await todo.save();

  res.json(todo);
};

exports.updateTodo = async (req,res)=>{

  const todo = await Todo.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new:true }
  )

  res.json(todo)
}


exports.deleteTodo = async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);

  res.json({ message: "deleted" });
};

exports.getUserTodos = async (req,res)=>{

  const todos = await Todo.find({ userId: req.params.userId })
  res.json(todos)
}
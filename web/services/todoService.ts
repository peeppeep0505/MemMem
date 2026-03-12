import { TodoItem, TodoStatus } from "@/types/types";
import { apiFetch } from "./api";



export const createTodo = (userId: string, text: string) => {
  return apiFetch<TodoItem>("/todos/create", {
    method: "POST",
    body: JSON.stringify({
      userId,
      text,
      status: "active",
    }),
  });
};

export const getTodos = (userId: string) => {
  return apiFetch<TodoItem[]>(`/todos/user/${userId}`);
};

export const updateTodo = (
  todoId: string,
  data: {
    text?: string;
    status?: TodoStatus;
  }
) => {
  return apiFetch<TodoItem>(`/todos/update/${todoId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteTodo = (todoId: string) => {
  return apiFetch<{ message: string }>(`/todos/delete/${todoId}`, {
    method: "DELETE",
  });
};

export { TodoItem };

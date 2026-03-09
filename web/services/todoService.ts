import { apiFetch } from "./api";

export const createTodo = (userId: string, text: string) => {
  return apiFetch("/todos", {
    method: "POST",
    body: JSON.stringify({
      userId,
      text,
      status: "active",
    }),
  });
};

export const getTodos = (userId: string) => {
  return apiFetch(`/todos/${userId}`);
};

export const updateTodo = (
  todoId: string,
  data: {
    text?: string;
    status?: "active" | "complete";
  }
) => {
  return apiFetch(`/todos/${todoId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteTodo = (todoId: string) => {
  return apiFetch(`/todos/${todoId}`, {
    method: "DELETE",
  });
};
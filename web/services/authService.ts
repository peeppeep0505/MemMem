import { apiFetch } from "./api";

export const login = (email: string, password: string) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const register = (username: string, email: string, password: string) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
};

export const changePassword = (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  return apiFetch("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ userId, oldPassword, newPassword }),
  });
};
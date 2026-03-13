import { apiFetch } from "./api";

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
    role: "user" | "editor" | "manager" | "admin";
    profilePic?: string;
    backgroundColor?: string;
    friends?: string[];
  };
}

export const login = (email: string, password: string) => {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const register = (
  username: string,
  email: string,
  password: string,
  role: "user" | "editor" | "manager" | "admin" = "user"
) => {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password, role }),
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

export const logout = () => {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
};
import { apiFetch } from "./api";

export const getProfile = (userId: string) => {
  return apiFetch(`/profile/${userId}`);
};

export const updateProfile = (
  userId: string,
  data: {
    username?: string;
    bio?: string;
    profilePic?: string;
    backgroundColor?: string;
  }
) => {
  return apiFetch(`/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
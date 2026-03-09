import { apiFetch } from "./api";

export const createPost = (
  userId: string,
  text: string,
  images: string[]
) => {
  return apiFetch("/post/create", {
    method: "POST",
    body: JSON.stringify({
      userId,
      text,
      images,
    }),
  });
};

export const likePost = (postId: string, userId: string) => {
  return apiFetch(`/post/like/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ userId }),
  });
};

export const deletePost = (postId: string) => {
  return apiFetch(`/post/delete/${postId}`, {
    method: "DELETE",
  });
};
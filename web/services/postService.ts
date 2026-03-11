import { apiFetch, apiFetchForm } from "./api";
import type { Post } from "../types/types";


export const createPost = async (
  userId: string,
  text: string,
  images: any[] = []
): Promise<Post> => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("text", text);

  await Promise.all(
    images.slice(0, 4).map(async (img, index) => {
      // Web: img.uri เป็น blob:// หรือ data:// → ต้อง fetch แปลงเป็น Blob
      if (typeof img.uri === "string" && (img.uri.startsWith("blob:") || img.uri.startsWith("data:"))) {
        const res = await fetch(img.uri);
        const blob = await res.blob();
        const file = new File([blob], img.fileName || `post-${index}.jpg`, {
          type: img.mimeType || img.type || blob.type || "image/jpeg",
        });
        formData.append("images", file);
      } else {
        // Native fallback
        formData.append("images", {
          uri: img.uri,
          name: img.fileName || `post-${index}.jpg`,
          type: img.mimeType || img.type || "image/jpeg",
        } as any);
      }
    })
  );

  return apiFetchForm<Post>("/post/create", formData, "POST");
};

export const getMyPosts = async (userId: string): Promise<Post[]> => {
  return apiFetch<Post[]>(`/post/my/${userId}`);
};

export const getFriendPosts = async (userId: string): Promise<Post[]> => {
  return apiFetch<Post[]>(`/post/friends/${userId}`);
};

export const likePost = async (
  postId: string,
  userId: string
): Promise<Post> => {
  return apiFetch<Post>(`/post/like/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ userId }),
  });
};

export const deletePost = async (postId: string) => {
  return apiFetch<{ message: string }>(`/post/delete/${postId}`, {
    method: "DELETE",
  });
};
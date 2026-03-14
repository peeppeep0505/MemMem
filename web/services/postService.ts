import { apiFetch, apiFetchForm } from "./api";
import type { Post } from "@/types/types";

type UploadImage = {
  uri: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
};

function normalizeMimeType(image?: UploadImage) {
  return image?.mimeType || image?.type || "image/jpeg";
}

function normalizeFileName(image: UploadImage, index: number) {
  const raw = image?.fileName?.trim();
  if (raw) return raw;

  const mime = normalizeMimeType(image);
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
      ? "webp"
      : "jpg";

  return `post-${index}.${ext}`;
}

export async function createPost(
  userId: string,
  text: string,
  images: UploadImage[] = []
): Promise<Post> {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("text", text ?? "");

  await Promise.all(
    (Array.isArray(images) ? images : []).slice(0, 4).map(async (img, index) => {
      if (!img?.uri) return;

      const mimeType = normalizeMimeType(img);
      const fileName = normalizeFileName(img, index);

      // Web: blob:/data: URI
      if (img.uri.startsWith("blob:") || img.uri.startsWith("data:")) {
        const res = await fetch(img.uri);
        const blob = await res.blob();
        const file = new File([blob], fileName, {
          type: blob.type || mimeType,
        });
        formData.append("images", file);
        return;
      }

      // Native / Expo
      formData.append("images", {
        uri: img.uri,
        name: fileName,
        type: mimeType,
      } as any);
    })
  );

  return apiFetchForm<Post>("/post/create", formData, "POST");
}

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

export const deletePost = async (
  postId: string
): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>(`/post/delete/${postId}`, {
    method: "DELETE",
  });
};

export const addComment = async (
  postId: string,
  userId: string,
  text: string,
  parentCommentId?: string
): Promise<Post> => {
  return apiFetch<Post>(`/post/comment/${postId}`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      text: String(text || "").trim(),
      parentCommentId,
    }),
  });
};
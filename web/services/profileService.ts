import { Profile, UpdateProfileInput } from "@/types/types";
import { apiFetch, apiFetchForm, base64ToBlob } from "./api";



export const getProfile = (userId: string): Promise<Profile> => {
  return apiFetch<Profile>(`/profile/user/${userId}`);
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> => {
  const form = new FormData();

  if (input.username !== undefined) {
    form.append("username", input.username);
  }

  if (input.bio !== undefined) {
    form.append("bio", input.bio);
  }

  if (input.backgroundColor !== undefined) {
    form.append("backgroundColor", input.backgroundColor);
  }

  if (input.imageBase64) {
    const mimeTypeMatch = input.imageBase64.match(/^data:(.*?);base64,/);
    const mimeType = mimeTypeMatch?.[1] || "image/jpeg";
    const blob = base64ToBlob(input.imageBase64, mimeType);

    form.append("image", blob, "profile.jpg");
  }

  return apiFetchForm<Profile>(`/profile/update/${userId}`, form, "PUT");
};

export const getProfileByUsername = (username: string) => {
  return apiFetch(`/users/username/${encodeURIComponent(username)}`);
};
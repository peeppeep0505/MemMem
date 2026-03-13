import { apiFetch } from "./api";

export type ProfileData = {
  _id?: string;
  username?: string;
  email?: string;
  bio?: string;
  role?: "guest" | "user" | "editor" | "manager" | "admin";
  profilePic?: string;
  backgroundColor?: string;
  adminCode?: string;
  preferences?: {
    showSocialLinks?: boolean;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    github?: string;
  };
  dynamicProfileData?: Record<string, any>;
  friends?: string[];
  friendCount?: number;
  postCount?: number;
};

export type UpdateProfileInput = {
  username?: string;
  bio?: string;
  role?: string;
  adminCode?: string;
  preferences?: {
    showSocialLinks?: boolean;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    github?: string;
  };
  dynamicProfileData?: Record<string, any>;
  backgroundColor?: string;
  imageBase64?: string;
};

export const getProfile = (userId: string): Promise<ProfileData> => {
  return apiFetch<ProfileData>(`/profile/user/${userId}`);
};

export const getProfileByUsername = (username: string): Promise<ProfileData> => {
  return apiFetch<ProfileData>(`/profile/username/${encodeURIComponent(username)}`);
};

export const updateProfile = (
  userId: string,
  payload: UpdateProfileInput
): Promise<ProfileData> => {
  return apiFetch<ProfileData>(`/profile/update/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};
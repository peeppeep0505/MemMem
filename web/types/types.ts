// ─────────────────────────────────────────────────────────────────────────────
// types.ts  —  shared types across services, contexts, and components
// ─────────────────────────────────────────────────────────────────────────────

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  _id: string;
  username: string;
  email: string;
}

// ─── Diary ────────────────────────────────────────────────────────────────────

export interface Diary {
  _id: string;
  userId: string;
  date: string;        // "YYYY-MM-DD"
  mood?: string;       // emoji string e.g. "😊"
  title?: string;
  description?: string;
  img?: string;        // filename หรือ base64 ขึ้นอยู่กับ server
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiaryInput {
  userId: string;
  date: string;
  mood?: string;
  title?: string;
  description?: string;
  imageBase64?: string; // "data:image/jpeg;base64,..." จาก ImagePicker
}

export interface UpdateDiaryInput {
  mood?: string;
  title?: string;
  description?: string;
  imageBase64?: string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface Post {
  _id: string;
  userId: string;
  username?: string;
  avatar?: string;
  caption: string;
  image?: string;
  likes: number;
  createdAt?: string;
}

export interface CreatePostInput {
  userId: string;
  caption: string;
  imageBase64?: string;
}

// ─── Todo ─────────────────────────────────────────────────────────────────────

export interface Todo {
  _id: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt?: string;
}

export interface CreateTodoInput {
  userId: string;
  text: string;
}

export interface UpdateTodoInput {
  text?: string;
  completed?: boolean;
}

// ─── Friend ───────────────────────────────────────────────────────────────────

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt?: string;
}

export interface FriendUser {
  _id: string;
  username: string;
  email: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  _id: string;
  userId: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatarBase64?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Generic paginated response wrapper (ใช้ถ้า server รองรับ pagination) */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Standard error shape ที่ apiFetch throw */
export interface ApiError {
  message: string;
  status?: number;
}
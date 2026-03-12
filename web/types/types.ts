
// ─── Auth ─────────────────────────────────────────────────────────────────────


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

export interface PostUser {
  _id: string;
  username?: string;
  email?: string;
  profilePic?: string;
  backgroundColor?: string;
}

export interface Post {
  _id: string;
  userId: string;
  text: string;
  images: string[];
  likes: string[];
  createdAt?: string;
  updatedAt?: string;
  user?: PostUser;
}

export interface CreatePostInput {
  userId: string;
  text: string;
  images?: any[];
}

// ─── Todo ─────────────────────────────────────────────────────────────────────

export type TodoStatus = "active" | "complete";

export interface TodoItem {
  _id: string;
  userId: string;
  text: string;
  status: TodoStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Friend ───────────────────────────────────────────────────────────────────



// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  _id: string;
  username?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
  backgroundColor?: string;
  friends?: string[];
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  backgroundColor?: string;
  imageBase64?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

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
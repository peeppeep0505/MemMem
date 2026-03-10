// ─────────────────────────────────────────────────────────────────────────────
// services/api.ts  —  base fetch helpers used by all service files
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiError } from "@/types/types";

export const BASE_URL =
  process.env.EXPO_PUBLIC_BE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "@auth_token";

// ─── Get stored token ─────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// ─── JSON fetch (GET / POST / PUT / DELETE ที่ไม่มีไฟล์) ─────────────────────

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "Request failed");
    const message = raw.replace(/^"|"$/g, ""); // strip surrounding quotes from server
    const err: ApiError = { message, status: res.status };
    throw err;
  }

  return res.json() as Promise<T>;
}

// ─── FormData fetch (POST / PUT ที่มีไฟล์แนบ — ให้ browser set Content-Type เอง) ──

export async function apiFetchForm<T = any>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      // ❌ ห้าม set Content-Type — browser ใส่ multipart boundary ให้อัตโนมัติ
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "Request failed");
    const message = raw.replace(/^"|"$/g, "");
    const err: ApiError = { message, status: res.status };
    throw err;
  }

  return res.json() as Promise<T>;
}

// ─── Utility: base64 string → Blob ───────────────────────────────────────────

/**
 * แปลง base64 string (จาก ImagePicker) เป็น Blob เพื่อใส่ใน FormData
 * รองรับทั้ง "data:image/jpeg;base64,xxx" และ raw base64
 */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteChars = atob(base64Data);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}
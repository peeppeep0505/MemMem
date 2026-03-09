// services/api.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_BE_URL || "http://localhost:5000/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {

  const token = await AsyncStorage.getItem("@auth_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "Request failed");
    throw new Error(msg.replace(/^"|"$/g, ""));
  }

  return res.json();
}
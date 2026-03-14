import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: ("Title" | "Badge" | "Theme")[];
  originalPrice: number;
  discountPercent: number;
  salePrice: number;
  stock: number;
  imageUrl?: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  q?: string;
  category?: string | string[];
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  activeOnly?: boolean | string;
  page?: number;
  limit?: number;
}

export interface ProductStats {
  avgSalePrice: number;
  maxSalePrice: number;
  minSalePrice: number;
  totalProducts: number;
}

export interface ProductListResponse {
  data: Product[];
  metadata: {
    page: number;
    limit: number;
    totalPosts: number;
    totalProducts: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const FAVORITE_PRODUCT_IDS_KEY = "@favorite_product_ids";

function toQueryString(params: Record<string, any>) {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      if (!value.length) return;
      sp.append(key, value.join(","));
      return;
    }

    sp.append(key, String(value));
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const getProducts = (query: ProductQuery = {}) => {
  return apiFetch<ProductListResponse>(`/products${toQueryString(query)}`);
};

export const getProductById = (productId: string) => {
  return apiFetch<Product>(`/products/${productId}`);
};

export const getProductStats = () => {
  return apiFetch<ProductStats>("/products/stats");
};

export const updateProduct = (
  productId: string,
  payload: Partial<Product> & Record<string, any>
) => {
  return apiFetch<Product>(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const archiveProduct = (productId: string) => {
  return apiFetch<{ message: string; product: Product }>(`/products/${productId}`, {
    method: "DELETE",
  });
};

export async function getFavoriteProductIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_PRODUCT_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function toggleFavoriteProduct(productId: string): Promise<boolean> {
  const current = await getFavoriteProductIds();
  const exists = current.includes(productId);

  const next = exists
    ? current.filter((id) => id !== productId)
    : [...current, productId];

  await AsyncStorage.setItem(FAVORITE_PRODUCT_IDS_KEY, JSON.stringify(next));
  return !exists;
}

export async function isFavoriteProduct(productId: string): Promise<boolean> {
  const ids = await getFavoriteProductIds();
  return ids.includes(productId);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  action: () => Promise<T>,
  retries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let i = 1; i <= retries; i += 1) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      console.log(`Retrying... (${i})`);
      if (i < retries) {
        await wait(delayMs * i);
      }
    }
  }

  return Promise.reject(lastError);
}
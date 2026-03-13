import { apiFetch } from "./api";

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: "Title" | "Badge" | "Theme";
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
  category?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface ProductStats {
  avgSalePrice: number;
  maxSalePrice: number;
  minSalePrice: number;
  totalProducts: number;
}

function toQueryString(params: Record<string, any>) {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      sp.append(key, String(value));
    }
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const getProducts = (query: ProductQuery = {}) => {
  return apiFetch<Product[]>(`/products${toQueryString(query)}`);
};

export const getProductById = (productId: string) => {
  return apiFetch<Product>(`/products/${productId}`);
};

export const getProductStats = () => {
  return apiFetch<ProductStats>("/products/stats");
};
import { apiFetch } from "./api";

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  clientRequestId?: string;
  source?: "online" | "offline-sync";
}

export interface Order {
  _id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  status: "pending" | "paid" | "cancelled";
  source: "online" | "offline-sync";
  createdAt: string;
}

export const createOrder = (payload: CreateOrderPayload) => {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyOrders = () => {
  return apiFetch<Order[]>("/orders/me");
};
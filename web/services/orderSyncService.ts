import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOrder } from "./orderService";

export const ORDER_QUEUE_KEY = "@shop_order_queue";

export type QueueOrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type QueueOrder = {
  id: string;
  items: QueueOrderItem[];
  status: "pending" | "syncing" | "synced";
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  source: "offline-sync";
};

let syncPromise: Promise<boolean> | null = null;

export async function loadOrderQueue(): Promise<QueueOrder[]> {
  const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveOrderQueue(queue: QueueOrder[]) {
  await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));
}

export async function syncPendingOrders(): Promise<boolean> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const queue = await loadOrderQueue();
    if (!queue.length) return false;

    const nextQueue = [...queue];
    let changed = false;

    for (let i = 0; i < nextQueue.length; i += 1) {
      const entry = nextQueue[i];

      if (entry.status === "synced" || entry.status === "syncing") continue;

      nextQueue[i] = { ...entry, status: "syncing" };
      await saveOrderQueue(nextQueue);

      try {
        await createOrder({
          items: entry.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          clientRequestId: entry.id,
          source: "offline-sync",
        });

        nextQueue[i] = { ...entry, status: "synced" };
        changed = true;
        await saveOrderQueue(nextQueue);
      } catch {
        nextQueue[i] = { ...entry, status: "pending" };
        await saveOrderQueue(nextQueue);
      }
    }

    return changed;
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}
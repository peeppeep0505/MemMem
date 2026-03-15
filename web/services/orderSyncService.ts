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

function isQueueOrder(value: any): value is QueueOrder {
  return !!value && typeof value === "object" && typeof value.id === "string" && Array.isArray(value.items);
}

function dedupeQueue(queue: QueueOrder[]): QueueOrder[] {
  const map = new Map<string, QueueOrder>();

  for (const entry of queue) {
    if (!isQueueOrder(entry)) continue;

    const prev = map.get(entry.id);
    if (!prev) {
      map.set(entry.id, entry);
      continue;
    }

    const rank = (status: QueueOrder["status"]) =>
      status === "synced" ? 3 : status === "syncing" ? 2 : 1;

    map.set(entry.id, rank(entry.status) >= rank(prev.status) ? entry : prev);
  }

  return Array.from(map.values()).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

async function readRawQueue(): Promise<QueueOrder[]> {
  const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isQueueOrder) : [];
  } catch {
    return [];
  }
}

export async function loadOrderQueue(): Promise<QueueOrder[]> {
  const queue = dedupeQueue(await readRawQueue()).map((entry) => {
    // ถ้าแอปถูกปิดระหว่าง syncing ให้กลับมา pending เพื่อ sync ต่อได้
    if (entry.status === "syncing") {
      return { ...entry, status: "pending" as const };
    }
    return entry;
  });

  await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export async function saveOrderQueue(queue: QueueOrder[]) {
  const normalized = dedupeQueue(queue);
  await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(normalized));
}

export async function markOrdersAsSyncedByIds(ids: string[]) {
  if (!ids.length) return;

  const idSet = new Set(ids);
  const queue = await loadOrderQueue();
  const nextQueue = queue.map((entry) =>
    idSet.has(entry.id) ? { ...entry, status: "synced" as const } : entry
  );
  await saveOrderQueue(nextQueue);
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

      if (entry.status === "synced") continue;

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

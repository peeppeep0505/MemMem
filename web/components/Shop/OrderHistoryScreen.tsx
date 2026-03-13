import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebLayout from "../common/WebLayout";
import { getMyOrders, createOrder, type Order } from "@/services/orderService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";

const ORDER_QUEUE_KEY = "@shop_order_queue";

type QueueOrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

type QueueOrder = {
  id: string;
  items: QueueOrderItem[];
  status: "pending" | "synced";
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  source: "offline-sync";
};

type DisplayOrder =
  | {
      kind: "server";
      id: string;
      createdAt: string;
      totalPrice: number;
      status: string;
      source: string;
      items?: any[];
      clientRequestId?: string | null;
    }
  | {
      kind: "local";
      id: string;
      createdAt: string;
      totalPrice: number;
      status: "pending" | "synced";
      source: "offline-sync";
      items: QueueOrderItem[];
    };

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getStatusStyle(status: string) {
  if (status === "pending") {
    return {
      bg: "#fef3c7",
      color: "#92400e",
      label: "Pending ⏳",
    };
  }

  if (status === "synced") {
    return {
      bg: "#dbeafe",
      color: "#1d4ed8",
      label: "Synced 🔄",
    };
  }

  return {
    bg: "#dcfce7",
    color: "#166534",
    label: "Paid ✅",
  };
}

export default function OrderHistoryScreen() {
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [queueOrders, setQueueOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const loadQueue = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
    const queue: QueueOrder[] = raw ? JSON.parse(raw) : [];
    setQueueOrders(queue);
    return queue;
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setError("");

      const [orders, queue] = await Promise.all([getMyOrders(), loadQueue()]);
      setServerOrders(orders);
      setQueueOrders(queue);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [loadQueue]);

  const syncQueue = useCallback(async () => {
    try {
      setSyncing(true);
      setError("");

      const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
      const queue: QueueOrder[] = raw ? JSON.parse(raw) : [];

      let changed = false;

      for (const entry of queue) {
        if (entry.status === "synced") continue;

        try {
          await createOrder({
            items: entry.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            clientRequestId: entry.id,
            source: "offline-sync",
          });

          entry.status = "synced";
          changed = true;
        } catch {
          // keep pending
        }
      }

      if (changed) {
        await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));
      }

      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to sync pending orders");
    } finally {
      setSyncing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    loadAll();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setIsOnline(online);

      if (online) {
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, [loadAll, syncQueue]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const displayOrders = useMemo(() => {
    const serverClientIds = new Set(
      serverOrders
        .map((order) => (order as any).clientRequestId)
        .filter(Boolean)
    );

    const localOrders: DisplayOrder[] = queueOrders
      .filter((order) => !serverClientIds.has(order.id))
      .map((order) => ({
        kind: "local",
        id: order.id,
        createdAt: order.createdAt,
        totalPrice: order.totalPrice,
        status: order.status,
        source: order.source,
        items: order.items,
      }));

    const remoteOrders: DisplayOrder[] = serverOrders.map((order) => ({
      kind: "server",
      id: order._id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice,
      status: order.status,
      source: order.source,
      items: (order as any).items,
      clientRequestId: (order as any).clientRequestId,
    }));

    return [...localOrders, ...remoteOrders].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, [queueOrders, serverOrders]);

  const pendingCount = queueOrders.filter((x) => x.status === "pending").length;
  const syncedCount = queueOrders.filter((x) => x.status === "synced").length;

  return (
    <WebLayout>
      <View style={{ flex: 1, padding: 24, backgroundColor: "#f8fafc" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}>
              My Orders
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>
              รองรับสถานะ Pending / Synced / Paid สำหรับเดโมฟังก์ชัน 7.5
            </Text>
          </View>

          <View
            style={{
              backgroundColor: isOnline ? "#dcfce7" : "#fee2e2",
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: isOnline ? "#166534" : "#991b1b",
                fontWeight: "700",
              }}
            >
              {isOnline ? (syncing ? "Online • Syncing..." : "Online") : "Offline"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              minWidth: 160,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ color: "#6b7280" }}>Pending</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#92400e" }}>
              {pendingCount}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              minWidth: 160,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ color: "#6b7280" }}>Synced</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#1d4ed8" }}>
              {syncedCount}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              minWidth: 160,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ color: "#6b7280" }}>Server Orders</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
              {serverOrders.length}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <TouchableOpacity
            onPress={loadAll}
            style={{
              backgroundColor: "#f3f4f6",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#111827", fontWeight: "700" }}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={syncQueue}
            style={{
              backgroundColor: "#111827",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {syncing ? "Syncing..." : "Sync now"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 32 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <View
            style={{
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#b91c1c" }}>{error}</Text>
          </View>
        ) : (
          <ScrollView style={{ marginTop: 20 }}>
            {displayOrders.length === 0 ? (
              <Text style={{ color: "#6b7280" }}>No orders yet</Text>
            ) : (
              displayOrders.map((order) => {
                const statusInfo = getStatusStyle(order.status);

                return (
                  <View
                    key={`${order.kind}-${order.id}`}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      padding: 18,
                      marginBottom: 14,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: "800", color: "#111827" }}>
                          {order.kind === "local"
                            ? `Offline Order #${order.id.slice(-6)}`
                            : `Order #${order.id.slice(-6)}`}
                        </Text>
                        <Text style={{ color: "#6b7280", marginTop: 6 }}>
                          {formatDate(order.createdAt)}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: statusInfo.bg,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ color: statusInfo.color, fontWeight: "800" }}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: "#111827", fontWeight: "800", marginTop: 12 }}>
                      Total: {formatPrice(order.totalPrice)}
                    </Text>

                    <Text style={{ color: "#6b7280", marginTop: 4 }}>
                      Source: {order.source}
                    </Text>

                    {order.kind === "local" ? (
                      <Text style={{ color: "#6b7280", marginTop: 4 }}>
                        {order.status === "pending"
                          ? "Waiting for internet connection to sync with server"
                          : "Synced with server — waiting for refreshed server list"}
                      </Text>
                    ) : null}

                    {order.items?.length ? (
                      <View style={{ marginTop: 12, gap: 8 }}>
                        {order.items.map((item: any, index: number) => (
                          <View
                            key={`${order.id}-${index}`}
                            style={{
                              backgroundColor: "#f9fafb",
                              borderRadius: 12,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: "#f3f4f6",
                            }}
                          >
                            <Text style={{ color: "#111827", fontWeight: "700" }}>
                              {item.name || `Product ${index + 1}`}
                            </Text>
                            <Text style={{ color: "#6b7280", marginTop: 4 }}>
                              Qty: {item.quantity}
                            </Text>
                            {item.unitPrice ? (
                              <Text style={{ color: "#6b7280", marginTop: 2 }}>
                                Price: {formatPrice(item.unitPrice)}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </WebLayout>
  );
}
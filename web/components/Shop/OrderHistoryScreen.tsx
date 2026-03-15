import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import WebLayout from "../common/WebLayout";
import { getMyOrders, type Order } from "@/services/orderService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";
import { loadOrderQueue, syncPendingOrders } from "@/services/orderSyncService";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

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
  status: "pending" | "syncing" | "synced";
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
      status: "pending" | "syncing" | "synced";
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

export default function OrderHistoryScreen() {
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [queueOrders, setQueueOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const syncInFlightRef = useRef(false);

  function getStatusStyle(status: string) {
    if (status === "pending") {
      return { bg: "#fef3c7", color: "#92400e", label: "Pending ⏳" };
    }
    if (status === "syncing") {
      return {
        bg: C.primarySoft2,
        color: C.primaryStrong,
        label: "Syncing ⏱️",
      };
    }
    if (status === "synced") {
      return { bg: C.primarySoft, color: C.primary, label: "Synced 🔄" };
    }
    return { bg: C.primarySoft, color: C.primaryStrong, label: "Paid ✅" };
  }

  const loadQueue = useCallback(async () => {
    try {
      const queue = await loadOrderQueue();
      setQueueOrders(queue);
      return queue;
    } catch {
      setQueueOrders([]);
      return [] as QueueOrder[];
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const queue = await loadQueue();

    try {
      setError("");
      const orders = await getMyOrders();
      setServerOrders(orders);
    } catch (err: any) {
      setServerOrders([]);
      if (!queue.length) {
        setError(err?.message || "Failed to load orders");
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  }, [loadQueue]);

  const syncQueue = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setSyncing(true);

    try {
      setError("");
      await syncPendingOrders();
      await loadAll();
    } catch (err: any) {
      await loadQueue();
      setError(err?.message || "Failed to sync pending orders");
    } finally {
      syncInFlightRef.current = false;
      setSyncing(false);
    }
  }, [loadAll, loadQueue]);

  useEffect(() => {
    loadAll();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setIsOnline(online);

      if (online && !syncInFlightRef.current) {
        syncQueue();
      }

      if (!online) {
        loadQueue();
      }
    });

    return () => unsubscribe();
  }, [loadAll, loadQueue, syncQueue]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const displayOrders = useMemo(() => {
    const serverClientIds = new Set(
      serverOrders.map((o) => (o as any).clientRequestId).filter(Boolean)
    );

    const localOrders: DisplayOrder[] = queueOrders
      .filter((o) => !serverClientIds.has(o.id))
      .map((o) => ({
        kind: "local",
        id: o.id,
        createdAt: o.createdAt,
        totalPrice: o.totalPrice,
        status: o.status,
        source: o.source,
        items: o.items,
      }));

    const remoteOrders: DisplayOrder[] = serverOrders.map((o) => ({
      kind: "server",
      id: o._id,
      createdAt: o.createdAt,
      totalPrice: o.totalPrice,
      status: o.status,
      source: o.source,
      items: (o as any).items,
      clientRequestId: (o as any).clientRequestId,
    }));

    return [...localOrders, ...remoteOrders].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, [queueOrders, serverOrders]);

  const pendingCount = queueOrders.filter((x) => x.status === "pending").length;
  const syncingCount = queueOrders.filter((x) => x.status === "syncing").length;
  const syncedCount = queueOrders.filter((x) => x.status === "synced").length;

  const statCard = {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    minWidth: 160,
    borderWidth: 1,
    borderColor: C.border,
  } as const;

  return (
    <WebLayout>
      <View style={{ flex: 1, padding: 24, backgroundColor: C.background }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
            {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
          </Text>
        </View>

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
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: C.inkText,
                fontFamily: F?.display ?? F?.serif,
              }}
            >
              My Orders
            </Text>

            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.removeItem(ORDER_QUEUE_KEY);
                setQueueOrders([]);
                console.log("Cleared @shop_order_queue");
              }}
              style={{
                backgroundColor: C.logoutSoft,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                marginTop: 8,
                borderWidth: 1,
                borderColor: C.logoutBorder,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: C.logout, fontWeight: "600" }}>
                Clear Queue
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: isOnline ? C.primarySoft : C.logoutSoft,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isOnline ? C.border : C.logoutBorder,
            }}
          >
            <Text
              style={{
                color: isOnline ? C.primaryStrong : C.logout,
                fontWeight: "700",
              }}
            >
              {isOnline
                ? syncing
                  ? `${Glyphs.sparkle} Online • Syncing...`
                  : `${Glyphs.sparkle} Online`
                : `${Glyphs.heart} Offline`}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {[
            { label: "Pending", value: pendingCount, color: "#92400e" },
            { label: "Syncing", value: syncingCount, color: C.primaryStrong },
            { label: "Synced", value: syncedCount, color: C.primary },
            { label: "Server Orders", value: serverOrders.length, color: C.inkText },
          ].map((s) => (
            <View key={s.label} style={statCard}>
              <Text style={{ color: C.mutedText, fontSize: 12 }}>{s.label}</Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: s.color,
                  marginTop: 2,
                }}
              >
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <TouchableOpacity
            onPress={loadAll}
            style={{
              backgroundColor: C.primarySoft,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Text style={{ color: C.inkText, fontWeight: "600" }}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={syncQueue}
            disabled={syncing}
            style={{
              backgroundColor: syncing ? C.border : C.primary,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: syncing ? 0 : 0.25,
              shadowRadius: 8,
            }}
          >
            <Text style={{ color: C.surface, fontWeight: "700" }}>
              {syncing ? "Syncing..." : `Sync now ${Glyphs.sparkle}`}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginBottom: 12 }}>{Glyphs.floral}</Text>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : error && displayOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: C.logoutSoft,
              borderWidth: 1,
              borderColor: C.logoutBorder,
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
            }}
          >
            <Text style={{ color: C.logout }}>{error}</Text>
          </View>
        ) : (
          <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
            {error ? (
              <View
                style={{
                  backgroundColor: C.logoutSoft,
                  borderWidth: 1,
                  borderColor: C.logoutBorder,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: C.logout }}>{error}</Text>
              </View>
            ) : null}

            {displayOrders.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{Glyphs.floral}</Text>
                <Text style={{ color: C.mutedText }}>
                  No orders yet {Glyphs.heart}
                </Text>
              </View>
            ) : (
              displayOrders.map((order) => {
                const statusInfo = getStatusStyle(order.status);

                return (
                  <View
                    key={`${order.kind}-${order.id}`}
                    style={{
                      backgroundColor: C.surface,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: C.border,
                      padding: 18,
                      marginBottom: 14,
                      shadowColor: C.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
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
                        <Text
                          style={{
                            fontWeight: "700",
                            color: C.inkText,
                            fontFamily: F?.sans,
                          }}
                        >
                          {order.kind === "local"
                            ? `Offline Order #${order.id.slice(-6)}`
                            : `Order #${order.id.slice(-6)}`}
                        </Text>
                        <Text
                          style={{
                            color: C.mutedText,
                            marginTop: 4,
                            fontSize: 12,
                          }}
                        >
                          {formatDate(order.createdAt)}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: statusInfo.bg,
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 999,
                        }}
                      >
                        <Text
                          style={{
                            color: statusInfo.color,
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: C.ruledLine,
                        marginVertical: 12,
                      }}
                    />

                    <Text
                      style={{
                        color: C.primary,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Total: {formatPrice(order.totalPrice)}
                    </Text>

                    <Text
                      style={{
                        color: C.mutedText,
                        marginTop: 4,
                        fontSize: 12,
                      }}
                    >
                      Source: {order.source}
                    </Text>

                    {order.kind === "local" && (
                      <Text
                        style={{
                          color: C.mutedText,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        {order.status === "pending"
                          ? "Waiting for internet connection to sync with server"
                          : order.status === "syncing"
                            ? "Syncing order with server now"
                            : "Synced with server — waiting for refreshed server list"}
                      </Text>
                    )}

                    {order.items?.length ? (
                      <View style={{ marginTop: 12, gap: 8 }}>
                        {order.items.map((item: any, index: number) => (
                          <View
                            key={`${order.id}-${index}`}
                            style={{
                              backgroundColor: C.primarySoft,
                              borderRadius: 12,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: C.border,
                            }}
                          >
                            <Text
                              style={{
                                color: C.inkText,
                                fontWeight: "600",
                                fontFamily: F?.sans,
                              }}
                            >
                              {item.name || `Product ${index + 1}`}
                            </Text>

                            <Text
                              style={{
                                color: C.mutedText,
                                marginTop: 4,
                                fontSize: 12,
                              }}
                            >
                              Qty: {item.quantity}
                            </Text>

                            {item.unitPrice ? (
                              <Text
                                style={{
                                  color: C.mutedText,
                                  marginTop: 2,
                                  fontSize: 12,
                                }}
                              >
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
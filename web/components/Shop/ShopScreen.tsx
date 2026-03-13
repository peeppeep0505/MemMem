import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import WebLayout from "../common/WebLayout";
import {
  getProducts,
  getProductStats,
  type Product,
} from "@/services/productService";
import { createOrder } from "@/services/orderService";
import { useCartStore } from "@/store/useCartStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";

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

const ORDER_QUEUE_KEY = "@shop_order_queue";

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function rarityColor(rarity: Product["rarity"]) {
  switch (rarity) {
    case "Rare":
      return "#3b82f6";
    case "Epic":
      return "#8b5cf6";
    case "Legendary":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

function ProductSkeletonCard() {
  return (
    <View
      style={{
        width: 280,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      }}
    >
      <View
        style={{
          width: 90,
          height: 28,
          borderRadius: 999,
          backgroundColor: "#e5e7eb",
          marginBottom: 12,
        }}
      />
      <View
        style={{
          width: "70%",
          height: 22,
          borderRadius: 8,
          backgroundColor: "#e5e7eb",
          marginBottom: 10,
        }}
      />
      <View
        style={{
          width: "100%",
          height: 14,
          borderRadius: 8,
          backgroundColor: "#f3f4f6",
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: "84%",
          height: 14,
          borderRadius: 8,
          backgroundColor: "#f3f4f6",
          marginBottom: 18,
        }}
      />
      <View
        style={{
          width: "45%",
          height: 24,
          borderRadius: 8,
          backgroundColor: "#e5e7eb",
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: "35%",
          height: 14,
          borderRadius: 8,
          backgroundColor: "#f3f4f6",
          marginBottom: 18,
        }}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#f3f4f6",
          }}
        />
        <View
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#e5e7eb",
          }}
        />
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1180;

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    avgSalePrice: 0,
    maxSalePrice: 0,
    minSalePrice: 0,
    totalProducts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [syncBanner, setSyncBanner] = useState<"online" | "offline">("online");
  const [syncing, setSyncing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    items,
    isDrawerOpen,
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    toggleDrawer,
    subtotal,
    tax,
    shipping,
    total,
  } = useCartStore();

  const drawerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isDrawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerAnim, isDrawerOpen]);

  const scheduleSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 500);
  }, []);

  useEffect(() => {
    scheduleSearch(query);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, scheduleSearch]);

  const fetchAll = useCallback(async () => {
    try {
      setError("");
      setFetching(true);

      const [productData, statsData] = await Promise.all([
        getProducts({ q: debouncedQuery, category }),
        getProductStats(),
      ]);

      setProducts(productData);
      setStats(statsData);
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedQuery, category]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const syncQueue = useCallback(async () => {
    try {
      setSyncing(true);

      const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
      const queue: QueueOrder[] = raw ? JSON.parse(raw) : [];

      let changed = false;

      for (const entry of queue) {
        if (entry.status === "synced") continue;

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
      }

      if (changed) {
        await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch {
      // intentionally silent for background sync
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setSyncBanner(online ? "online" : "offline");

      if (online) {
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, [syncQueue]);

  const handleCheckout = async () => {
    if (!items.length) return;

    const requestId = `${Date.now()}`;

    const queueOrder: QueueOrder = {
      id: requestId,
      status: "pending",
      createdAt: new Date().toISOString(),
      subtotal: subtotal(),
      tax: tax(),
      shipping: shipping(),
      totalPrice: total(),
      source: "offline-sync",
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: Number((item.price * item.quantity).toFixed(2)),
      })),
    };

    try {
      const net = await NetInfo.fetch();

      if (!net.isConnected) {
        const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
        const queue: QueueOrder[] = raw ? JSON.parse(raw) : [];

        queue.unshift(queueOrder);
        await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));

        clearCart();
        toggleDrawer(false);
        router.push("/shop/orders");
        return;
      }

      await createOrder({
        items: queueOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        clientRequestId: requestId,
        source: "online",
      });

      clearCart();
      toggleDrawer(false);
      fetchAll();
      router.push("/shop/orders");
    } catch (err: any) {
      setError(err?.message || "Checkout failed");
    }
  };

  const emptyText = useMemo(() => {
    if (!debouncedQuery) return "No products available";
    return `No products found for '${debouncedQuery}'`;
  }, [debouncedQuery]);

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  const cartSummaryPanel = (
    <View
      style={{
        width: 380,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 20,
        padding: 20,
        ...(isWide && Platform.OS === "web"
          ? ({
              position: "sticky",
              top: 24,
              alignSelf: "flex-start",
            } as any)
          : {}),
      }}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
          Cart Summary
        </Text>
        {!isWide ? (
          <TouchableOpacity onPress={() => toggleDrawer(false)}>
            <Text style={{ color: "#6b7280", fontWeight: "700" }}>Close</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={{ marginTop: 18, maxHeight: isWide ? 420 : 520 }}>
        {items.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>Your cart is empty</Text>
        ) : (
          items.map((item) => (
            <View
              key={item.productId}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#111827" }}>{item.name}</Text>
              <Text style={{ color: "#6b7280", marginTop: 4 }}>
                {formatPrice(item.price)} x {item.quantity}
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => decreaseQty(item.productId)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: "#f3f4f6",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text>-</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => increaseQty(item.productId)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: "#f3f4f6",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text>+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeFromCart(item.productId)}
                  style={{
                    marginLeft: "auto",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: "#fee2e2",
                  }}
                >
                  <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 16, gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#6b7280" }}>Subtotal</Text>
          <Text style={{ color: "#111827", fontWeight: "700" }}>{formatPrice(subtotal())}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#6b7280" }}>Tax</Text>
          <Text style={{ color: "#111827", fontWeight: "700" }}>{formatPrice(tax())}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#6b7280" }}>Shipping</Text>
          <Text style={{ color: "#111827", fontWeight: "700" }}>{formatPrice(shipping())}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ color: "#111827", fontWeight: "800", fontSize: 18 }}>Total</Text>
          <Text style={{ color: "#111827", fontWeight: "800", fontSize: 18 }}>
            {formatPrice(total())}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!items.length}
          onPress={handleCheckout}
          style={{
            marginTop: 14,
            backgroundColor: items.length ? "#111827" : "#d1d5db",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Checkout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!items.length}
          onPress={clearCart}
          style={{
            backgroundColor: "#f3f4f6",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "800" }}>Clear cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <WebLayout>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{
            backgroundColor: syncBanner === "online" ? "#dcfce7" : "#fee2e2",
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <Text
            style={{
              color: syncBanner === "online" ? "#166534" : "#991b1b",
              fontWeight: "700",
            }}
          >
            {syncBanner === "online"
              ? syncing
                ? "Online — syncing pending orders..."
                : "Online"
              : "Offline — orders will be queued"}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: isWide ? "row" : "column",
            gap: 20,
            padding: 24,
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <View>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}>
                  Title Shop
                </Text>
                <Text style={{ color: "#6b7280", marginTop: 4 }}>
                  ซื้อฉายาและไอเทมตกแต่งโปรไฟล์ของ MemMem
                </Text>
              </View>

              {!isWide ? (
                <TouchableOpacity
                  onPress={() => toggleDrawer(true)}
                  style={{
                    backgroundColor: "#111827",
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Cart ({items.reduce((sum, i) => sum + i.quantity, 0)})
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  minWidth: 180,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text style={{ color: "#6b7280" }}>Products</Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
                  {stats.totalProducts}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  minWidth: 180,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text style={{ color: "#6b7280" }}>Average sale price</Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
                  {formatPrice(stats.avgSalePrice)}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search title or description..."
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  minWidth: 260,
                }}
              />

              {["", "Title", "Badge", "Theme"].map((item) => (
                <TouchableOpacity
                  key={item || "all"}
                  onPress={() => setCategory(item)}
                  style={{
                    backgroundColor: category === item ? "#111827" : "#fff",
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: category === item ? "#111827" : "#d1d5db",
                  }}
                >
                  <Text
                    style={{
                      color: category === item ? "#fff" : "#111827",
                      fontWeight: "700",
                    }}
                  >
                    {item || "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <Text style={{ color: "#b91c1c", flex: 1 }}>{error}</Text>
                <TouchableOpacity onPress={fetchAll}>
                  <Text style={{ color: "#111827", fontWeight: "700" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ marginTop: 18 }}>
              {loading || fetching ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <ProductSkeletonCard key={`skeleton-${idx}`} />
                  ))}
                </View>
              ) : products.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    padding: 24,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#374151" }}>{emptyText}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  {products.map((product) => (
                    <View
                      key={product._id}
                      style={{
                        width: 280,
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "#f3f4f6",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ color: rarityColor(product.rarity), fontWeight: "700" }}>
                          {product.rarity}
                        </Text>
                      </View>

                      <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
                        {product.name}
                      </Text>
                      <Text style={{ color: "#6b7280", marginTop: 6, minHeight: 40 }}>
                        {product.description || "Special profile title for your MemMem identity."}
                      </Text>

                      <View style={{ marginTop: 12, gap: 4 }}>
                        <Text style={{ color: "#111827", fontSize: 18, fontWeight: "800" }}>
                          {formatPrice(product.salePrice)}
                        </Text>
                        {product.discountPercent > 0 ? (
                          <Text style={{ color: "#9ca3af", textDecorationLine: "line-through" }}>
                            {formatPrice(product.originalPrice)}
                          </Text>
                        ) : null}
                        <Text style={{ color: "#6b7280" }}>Stock: {product.stock}</Text>
                        <Text style={{ color: "#6b7280" }}>Category: {product.category}</Text>
                      </View>

                      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/shop/[id]",
                              params: { id: product._id },
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: "#f3f4f6",
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#111827", fontWeight: "700" }}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={product.stock <= 0}
                          onPress={() => addToCart(product)}
                          style={{
                            flex: 1,
                            backgroundColor: product.stock <= 0 ? "#d1d5db" : "#111827",
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {isWide ? cartSummaryPanel : null}
        </View>

        {!isWide && isDrawerOpen ? (
          <Pressable
            onPress={() => toggleDrawer(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />
        ) : null}

        {!isWide ? (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              maxWidth: "92%",
              backgroundColor: "#fff",
              borderLeftWidth: 1,
              borderLeftColor: "#e5e7eb",
              padding: 20,
              transform: [{ translateX: drawerTranslateX }],
            }}
          >
            {cartSummaryPanel}
          </Animated.View>
        ) : null}
      </View>
    </WebLayout>
  );
}
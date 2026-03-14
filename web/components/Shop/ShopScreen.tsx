import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  getFavoriteProductIds,
  getProducts,
  getProductStats,
  toggleFavoriteProduct,
  type Product,
} from "@/services/productService";
import { createOrder } from "@/services/orderService";
import { useCartStore } from "@/store/useCartStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { syncPendingOrders } from "@/services/orderSyncService";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

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

const ORDER_QUEUE_KEY = "@shop_order_queue";
const CATEGORY_OPTIONS = ["Title", "Badge", "Theme"] as const;

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function rarityColor(rarity: Product["rarity"]) {
  switch (rarity) {
    case "Rare":      return "#3b82f6";
    case "Epic":      return "#8b5cf6";
    case "Legendary": return "#f59e0b";
    default:          return "#6b7280";
  }
}

function parseCategoryParam(value?: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean))];
  }
  return [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];
}

function ProductSkeletonCard({ C }: { C: any }) {
  return (
    <View
      style={{
        width: 280,
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {[90, "70%", "100%", "84%", "45%", "35%"].map((w, i) => (
        <View
          key={i}
          style={{
            width: typeof w === "number" ? w : undefined,
            // For percentage widths, use alignSelf: 'stretch' and wrap in a parent with fixed width if needed
            ...(typeof w === "string" ? { alignSelf: "stretch" } : {}),
            height: i < 2 ? (i === 0 ? 28 : 22) : i < 4 ? 14 : i === 4 ? 24 : 14,
            borderRadius: i === 0 ? 999 : 8,
            backgroundColor: i % 2 === 0 ? C.primarySoft2 : C.primarySoft,
            marginBottom: i === 5 ? 18 : 8,
          }}
        />
      ))}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: C.primarySoft }} />
        <View style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: C.primarySoft2 }} />
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { theme: C } = useAppTheme();
  const F = Fonts as any;
  const params = useLocalSearchParams<{
    q?: string;
    category?: string | string[];
    favId?: string;
    favAction?: string;
    favTick?: string;
  }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 1180;

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ avgSalePrice: 0, maxSalePrice: 0, minSalePrice: 0, totalProducts: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 0, totalProducts: 0 });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [syncBanner, setSyncBanner] = useState<"online" | "offline">("online");
  const [syncing, setSyncing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const hasHydratedFromUrlRef = useRef(false);

  const { items, isDrawerOpen, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart, toggleDrawer, subtotal, tax, shipping, total } = useCartStore();
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const qParam = useMemo(() => (typeof params.q === "string" ? params.q : ""), [params.q]);
  const categoryParam = useMemo(() => parseCategoryParam(params.category), [params.category]);

  useEffect(() => {
    Animated.timing(drawerAnim, { toValue: isDrawerOpen ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [drawerAnim, isDrawerOpen]);

  useEffect(() => {
    const loadFavorites = async () => {
      const ids = await getFavoriteProductIds();
      setFavoriteIds(ids);
    };
    loadFavorites();
  }, []);

  useEffect(() => {
    setQuery((prev) => (prev === qParam ? prev : qParam));
    setDebouncedQuery((prev) => (prev === qParam ? prev : qParam));
    setCategories((prev) => {
      const prevKey = prev.join(",");
      const nextKey = categoryParam.join(",");
      return prevKey === nextKey ? prev : categoryParam;
    });
    hasHydratedFromUrlRef.current = true;
  }, [qParam, categoryParam]);

  useEffect(() => {
    if (!params.favId || !params.favAction || !params.favTick) return;
    setFavoriteIds((prev) => {
      const exists = prev.includes(params.favId!);
      if (params.favAction === "add" && !exists) return [...prev, params.favId!];
      if (params.favAction === "remove" && exists) return prev.filter((id) => id !== params.favId);
      return prev;
    });
  }, [params.favId, params.favAction, params.favTick]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = query.trim();
      setDebouncedQuery((prev) => (prev === next ? prev : next));
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (!hasHydratedFromUrlRef.current) return;
    const nextQ = debouncedQuery.trim();
    const nextCategory = categories.join(",");
    if (nextQ === qParam && nextCategory === categoryParam.join(",")) return;
    router.setParams({ q: nextQ || undefined, category: nextCategory || undefined });
  }, [debouncedQuery, categories, qParam, categoryParam, router]);

  const fetchAll = useCallback(async () => {
    try {
      setError("");
      setFetching(true);
      const [productRes, statsData] = await Promise.all([
        getProducts({ q: debouncedQuery, category: categories, page: 1, limit: 12 }),
        getProductStats(),
      ]);
      setProducts(productRes.data);
      setPagination({ page: productRes.metadata.page, limit: productRes.metadata.limit, totalPages: productRes.metadata.totalPages, totalProducts: productRes.metadata.totalProducts });
      setStats(statsData);
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedQuery, categories]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const syncQueue = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setSyncing(true);
    try {
      const changed = await syncPendingOrders();
      if (changed) fetchAll();
    } finally {
      syncInFlightRef.current = false;
      setSyncing(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setSyncBanner(online ? "online" : "offline");
      if (online && !syncInFlightRef.current) syncQueue();
    });
    return () => unsubscribe();
  }, [syncQueue]);

  const handleToggleCategory = (value: string) => {
    if (!value) { setCategories([]); return; }
    setCategories((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      const nextIsFavorite = await toggleFavoriteProduct(productId);
      setFavoriteIds((prev) => {
        if (nextIsFavorite) return prev.includes(productId) ? prev : [...prev, productId];
        return prev.filter((id) => id !== productId);
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update favorite");
    }
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const queueOrder: QueueOrder = {
      id: requestId, status: "pending", createdAt: new Date().toISOString(),
      subtotal: subtotal(), tax: tax(), shipping: shipping(), totalPrice: total(),
      source: "offline-sync",
      items: items.map((item) => ({ productId: item.productId, name: item.name, unitPrice: item.price, quantity: item.quantity, subtotal: Number((item.price * item.quantity).toFixed(2)) })),
    };
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        const raw = await AsyncStorage.getItem(ORDER_QUEUE_KEY);
        const queue: QueueOrder[] = raw ? JSON.parse(raw) : [];
        queue.unshift(queueOrder);
        await AsyncStorage.setItem(ORDER_QUEUE_KEY, JSON.stringify(queue));
        clearCart(); toggleDrawer(false); router.push("/shop/orders"); return;
      }
      await createOrder({ items: queueOrder.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), clientRequestId: requestId, source: "online" });
      clearCart(); toggleDrawer(false); fetchAll(); router.push("/shop/orders");
    } catch (err: any) {
      setError(err?.message || "Checkout failed");
    }
  };

  const emptyText = useMemo(() => {
    const tagText = categories.length ? ` in [${categories.join(", ")}]` : "";
    if (!debouncedQuery) return `No products available${tagText}`;
    return `No products found for '${debouncedQuery}'${tagText}`;
  }, [debouncedQuery, categories]);

  const drawerTranslateX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  // ── shared mini styles ────────────────────────────────────────────────────
  const statCard = { backgroundColor: C.surface, borderRadius: 16, padding: 16, minWidth: 180, borderWidth: 1, borderColor: C.border };
  const pillActive = { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.primary };
  const pillInactive = { backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border };

  const cartSummaryPanel = (
    <View
      style={{
        width: 380,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 24,
        padding: 20,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        ...(isWide && Platform.OS === "web" ? ({ position: "sticky", top: 24, alignSelf: "flex-start" } as any) : {}),
      }}
    >
      {/* Cart header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <View>
          <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 3 }}>
            {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart}`}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>
            Cart Summary
          </Text>
        </View>
        {!isWide && (
          <TouchableOpacity onPress={() => toggleDrawer(false)}>
            <Text style={{ color: C.mutedText, fontWeight: "600" }}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 14 }} />

      <ScrollView style={{ maxHeight: isWide ? 420 : 520 }}>
        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontSize: 20 }}>{Glyphs.floral}</Text>
            <Text style={{ color: C.mutedText, marginTop: 8 }}>Your cart is empty</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.productId} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.ruledLine }}>
              <Text style={{ fontWeight: "700", color: C.inkText, fontFamily: F?.sans }}>{item.name}</Text>
              <Text style={{ color: C.mutedText, marginTop: 4 }}>{formatPrice(item.price)} × {item.quantity}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                {[
                  { label: "−", onPress: () => decreaseQty(item.productId) },
                  { label: "+", onPress: () => increaseQty(item.productId) },
                ].map((btn) => (
                  <TouchableOpacity
                    key={btn.label}
                    onPress={btn.onPress}
                    style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: C.primarySoft, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={{ color: C.primary, fontWeight: "700" }}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => removeFromCart(item.productId)}
                  style={{ marginLeft: "auto" as any, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.logoutSoft, borderWidth: 1, borderColor: C.logoutBorder }}
                >
                  <Text style={{ color: C.logout, fontWeight: "600" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: C.ruledLine, paddingTop: 16, gap: 8 }}>
        {[
          { label: "Subtotal", value: formatPrice(subtotal()) },
          { label: "Tax",      value: formatPrice(tax()) },
          { label: "Shipping", value: formatPrice(shipping()) },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: C.mutedText }}>{row.label}</Text>
            <Text style={{ color: C.inkText, fontWeight: "600" }}>{row.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ color: C.inkText, fontWeight: "700", fontSize: 16 }}>Total</Text>
          <Text style={{ color: C.primary, fontWeight: "700", fontSize: 18 }}>{formatPrice(total())}</Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={!items.length}
        onPress={handleCheckout}
        style={{ marginTop: 14, backgroundColor: items.length ? C.primary : C.border, paddingVertical: 14, borderRadius: 14, alignItems: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: items.length ? 0.28 : 0, shadowRadius: 12 }}
      >
        <Text style={{ color: C.surface, fontWeight: "700" }}>{`Checkout ${Glyphs.heart}`}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={!items.length}
        onPress={clearCart}
        style={{ marginTop: 10, backgroundColor: C.primarySoft, paddingVertical: 12, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: C.border }}
      >
        <Text style={{ color: C.mutedText, fontWeight: "600" }}>Clear cart</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <WebLayout>
      <View style={{ flex: 1, backgroundColor: C.background }}>
        {/* ── Online banner ── */}
        <View
          style={{
            backgroundColor: syncBanner === "online" ? C.onlineBanner : C.offlineBanner,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          <Text style={{ color: syncBanner === "online" ? C.primaryStrong : C.logout, fontWeight: "600" }}>
            {syncBanner === "online"
              ? syncing ? `${Glyphs.sparkle} Online — syncing pending orders...` : `${Glyphs.sparkle} Online`
              : `${Glyphs.heart} Offline — orders will be queued`}
          </Text>
        </View>

        <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", gap: 20, padding: 24 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

            {/* ── Page header ── */}
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
                {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
              <View>
                <Text style={{ fontSize: 30, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>
                  Title Shop
                </Text>
                <Text style={{ color: C.mutedText, marginTop: 4, fontFamily: F?.sans }}>
                  ซื้อฉายาและไอเทมตกแต่งโปรไฟล์ของ MemMem
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => router.push("/shop/admin")}
                    style={{ backgroundColor: C.surface, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.inkText }}
                  >
                    <Text style={{ color: C.inkText, fontWeight: "600" }}>Admin Products</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => router.push("/shop/orders")}
                  style={{ backgroundColor: C.surface, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                >
                  <Text style={{ color: C.inkText, fontWeight: "600" }}>My Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleDrawer(true)}
                  style={{ backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }}
                >
                  <Text style={{ color: C.surface, fontWeight: "700" }}>
                    {`${Glyphs.heart} Cart (${items.reduce((sum, i) => sum + i.quantity, 0)})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Stats ── */}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              {[
                { label: "Products",          value: stats.totalProducts },
                { label: "Average sale price", value: formatPrice(stats.avgSalePrice) },
                { label: "Matched results",    value: pagination.totalProducts },
              ].map((s) => (
                <View key={s.label} style={statCard}>
                  <Text style={{ color: C.mutedText, fontSize: 12 }}>{s.label}</Text>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: C.primary, marginTop: 2 }}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Search + filter ── */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search title or description…"
                placeholderTextColor={C.mutedText}
                style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minWidth: 260, color: C.inkText, fontFamily: F?.sans } as any}
              />

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <TouchableOpacity onPress={() => handleToggleCategory("")} style={categories.length === 0 ? pillActive : pillInactive}>
                  <Text style={{ color: categories.length === 0 ? C.surface : C.inkText, fontWeight: "600" }}>All</Text>
                </TouchableOpacity>
                {CATEGORY_OPTIONS.map((item) => {
                  const active = categories.includes(item);
                  return (
                    <TouchableOpacity key={item} onPress={() => handleToggleCategory(item)} style={active ? pillActive : pillInactive}>
                      <Text style={{ color: active ? C.surface : C.inkText, fontWeight: "600" }}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {!!categories.length && (
              <Text style={{ marginTop: 10, color: C.mutedText, fontSize: 13 }}>
                Exact tag match: {categories.join(", ")}
              </Text>
            )}

            {/* ── Error ── */}
            {error ? (
              <View style={{ backgroundColor: C.logoutSoft, borderWidth: 1, borderColor: C.logoutBorder, padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <Text style={{ color: C.logout, flex: 1 }}>{error}</Text>
                <TouchableOpacity onPress={fetchAll}>
                  <Text style={{ color: C.inkText, fontWeight: "700" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── Product grid ── */}
            <View style={{ marginTop: 18 }}>
              {loading || fetching ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, idx) => <ProductSkeletonCard key={`sk-${idx}`} C={C} />)}
                </View>
              ) : products.length === 0 ? (
                <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 24 }}>
                  <Text style={{ fontSize: 16, color: C.mutedText }}>{emptyText}</Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                    {products.map((product) => {
                      const isFavorite = favoriteIds.includes(product._id);
                      return (
                        <View
                          key={product._id}
                          style={{ width: 280, backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 }}
                        >
                          {/* Rarity + Fav */}
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                            <View style={{ alignSelf: "flex-start", backgroundColor: C.tagPill, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.border }}>
                              <Text style={{ color: rarityColor(product.rarity), fontWeight: "700", fontSize: 12 }}>{product.rarity}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleToggleFavorite(product._id)}
                              style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: isFavorite ? C.primarySoft2 : C.primarySoft, borderWidth: 1, borderColor: isFavorite ? C.accent : C.border, justifyContent: "center", alignItems: "center" }}
                            >
                              <Text style={{ fontSize: 16 }}>{isFavorite ? "❤️" : "🤍"}</Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={{ fontSize: 17, fontWeight: "700", color: C.inkText, fontFamily: F?.sans }}>{product.name}</Text>
                          <Text style={{ color: C.mutedText, marginTop: 6, minHeight: 40, fontSize: 13, fontFamily: F?.sans }}>
                            {product.description || "Special profile title for your MemMem identity."}
                          </Text>

                          <View style={{ marginTop: 12, gap: 3 }}>
                            <Text style={{ color: C.primary, fontSize: 18, fontWeight: "700" }}>{formatPrice(product.salePrice)}</Text>
                            {product.discountPercent > 0 && (
                              <Text style={{ color: C.mutedText, textDecorationLine: "line-through", fontSize: 13 }}>{formatPrice(product.originalPrice)}</Text>
                            )}
                            <Text style={{ color: C.mutedText, fontSize: 12 }}>Stock: {product.stock}</Text>
                            <Text style={{ color: C.mutedText, fontSize: 12 }}>Category: {product.category.join(", ")}</Text>
                            {isFavorite && <Text style={{ color: C.primary, fontWeight: "700", fontSize: 12 }}>{`Favorite ${Glyphs.heart}`}</Text>}
                          </View>

                          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                            <TouchableOpacity
                              onPress={() => router.push({ pathname: "/shop/[id]", params: { id: product._id, q: debouncedQuery || undefined, category: categories.join(",") || undefined } })}
                              style={{ flex: 1, backgroundColor: C.primarySoft, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: C.border }}
                            >
                              <Text style={{ color: C.inkText, fontWeight: "600" }}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={product.stock <= 0}
                              onPress={() => addToCart(product)}
                              style={{ flex: 1, backgroundColor: product.stock <= 0 ? C.border : C.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
                            >
                              <Text style={{ color: product.stock <= 0 ? C.mutedText : C.surface, fontWeight: "700" }}>
                                {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ marginTop: 18 }}>
                    <Text style={{ color: C.mutedText, fontSize: 12 }}>
                      Page {pagination.page} / {pagination.totalPages || 1} • Limit {pagination.limit}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          {isWide ? cartSummaryPanel : null}
        </View>

        {/* ── Mobile drawer backdrop ── */}
        {!isWide && isDrawerOpen && (
          <Pressable onPress={() => toggleDrawer(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(30,15,24,0.4)" } as any} />
        )}

        {/* ── Mobile cart drawer ── */}
        {!isWide && (
          <Animated.View
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: 380, maxWidth: "92%",
              backgroundColor: C.surface,
              borderLeftWidth: 1, borderLeftColor: C.border,
              padding: 20,
              transform: [{ translateX: drawerTranslateX }],
            }}
          >
            {cartSummaryPanel}
          </Animated.View>
        )}
      </View>
    </WebLayout>
  );
}
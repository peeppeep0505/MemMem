import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import WebLayout from "../common/WebLayout";
import { archiveProduct, getProducts, updateProduct, withRetry, type Product } from "@/services/productService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

type ToastState = { type: "success" | "error" | "info"; message: string } | null;

const CATEGORY_OPTIONS = ["Title", "Badge", "Theme"] as const;
const USE_MOCK_DATA = false;

const MOCK_PRODUCTS: Product[] = [
  { _id: "mock-1", name: "Pro Coder",       description: "Special title for users who love coding every day.", category: ["Title"],          originalPrice: 120, discountPercent: 10, salePrice: 108,   stock: 25, imageUrl: "", rarity: "Common",    isActive: true,  createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-03-14T00:00:00.000Z" },
  { _id: "mock-2", name: "Bug Hunter",      description: "A rare badge for fearless debuggers.",               category: ["Badge"],           originalPrice: 250, discountPercent: 20, salePrice: 200,   stock: 12, imageUrl: "", rarity: "Rare",      isActive: true,  createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-03-14T00:00:00.000Z" },
  { _id: "mock-3", name: "Galaxy Theme",    description: "A premium profile theme with cosmic vibes.",         category: ["Theme"],           originalPrice: 450, discountPercent: 15, salePrice: 382.5, stock: 8,  imageUrl: "", rarity: "Epic",      isActive: true,  createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-03-14T00:00:00.000Z" },
  { _id: "mock-4", name: "Legend Dev Pack", description: "Includes both a title and badge for legendary members.", category: ["Title","Badge"], originalPrice: 790, discountPercent: 25, salePrice: 592.5, stock: 5,  imageUrl: "", rarity: "Legendary", isActive: true,  createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-03-14T00:00:00.000Z" },
  { _id: "mock-5", name: "Dark Neon Pack",  description: "Theme and badge combo for night mode lovers.",        category: ["Badge","Theme"],   originalPrice: 680, discountPercent: 10, salePrice: 612,   stock: 0,  imageUrl: "", rarity: "Epic",      isActive: false, createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-03-14T00:00:00.000Z" },
];

function formatPrice(value: number) { return `฿${value.toFixed(2)}`; }

function matchMockProducts(products: Product[], query: string, categories: string[]): Product[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchCategory = categories.length === 0 || categories.every((cat) => p.category.includes(cat as any));
    return matchQuery && matchCategory;
  });
}

export default function AdminProductManagementScreen() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

  const [products,           setProducts]           = useState<Product[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [fetching,           setFetching]           = useState(false);
  const [error,              setError]              = useState("");
  const [toast,              setToast]              = useState<ToastState>(null);
  const [query,              setQuery]              = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pageInfo,           setPageInfo]           = useState({ page: 1, limit: 12, totalPages: 0, totalProducts: 0 });

  const loadProducts = useCallback(async () => {
    try {
      setError(""); setFetching(true);
      if (USE_MOCK_DATA) {
        const filtered = matchMockProducts(MOCK_PRODUCTS, query, selectedCategories);
        setProducts(filtered);
        setPageInfo({ page: 1, limit: filtered.length || 12, totalPages: filtered.length ? 1 : 0, totalProducts: filtered.length });
        return;
      }
      const response = await getProducts({ q: query.trim(), category: selectedCategories, activeOnly: "false", sort: "newest", page: 1, limit: 50 });
      setProducts(response.data);
      setPageInfo({ page: response.metadata.page, limit: response.metadata.limit, totalPages: response.metadata.totalPages, totalProducts: response.metadata.totalProducts });
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false); setFetching(false);
    }
  }, [query, selectedCategories]);

  useEffect(() => { if (!authLoading && !hasRole("editor", "manager")) router.replace("/community"); }, [authLoading, hasRole]);
  useEffect(() => { if (!authLoading && hasRole("editor", "manager")) loadProducts(); }, [authLoading, hasRole, loadProducts]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }, [toast]);

  const activeCount   = useMemo(() => products.filter((p) => p.isActive).length,  [products]);
  const inactiveCount = useMemo(() => products.filter((p) => !p.isActive).length, [products]);

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) => prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]);
  };

  const handleToggleActive = async (product: Product) => {
    const previousItems = [...products];
    const nextActive = !product.isActive;
    setToast({ type: "info", message: `${nextActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}สินค้าแล้ว (กำลังซิงก์...)` });
    setProducts((prev) => prev.map((item) => item._id === product._id ? { ...item, isActive: nextActive } : item));
    try {
      if (!USE_MOCK_DATA) await withRetry(() => updateProduct(product._id, { isActive: nextActive }));
      setToast({ type: "success", message: "บันทึกสถานะสินค้าเรียบร้อย" });
    } catch (err) {
      setProducts(previousItems);
      setToast({ type: "error", message: "ไม่สามารถดำเนินการได้ ระบบคืนค่าเดิมให้แล้ว" });
    }
  };

  const handleArchive = async (product: Product) => {
    const previousItems = [...products];
    setToast({ type: "info", message: "ลบสินค้าแล้ว (กำลังซิงก์...)" });
    setProducts((prev) => prev.filter((item) => item._id !== product._id));
    try {
      if (!USE_MOCK_DATA) await withRetry(() => archiveProduct(product._id));
      setToast({ type: "success", message: "ลบสินค้าเรียบร้อย" });
    } catch (err) {
      setProducts(previousItems);
      setToast({ type: "error", message: "ไม่สามารถดำเนินการได้ ระบบคืนค่าเดิมให้แล้ว" });
    }
  };

  // ── loading ──────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <WebLayout>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.background }}>
          <Text style={{ fontSize: 24, marginBottom: 12 }}>{Glyphs.sparkle}</Text>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </WebLayout>
    );
  }

  if (!hasRole("editor", "manager")) {
    return (
      <WebLayout>
        <View style={{ flex: 1, padding: 24, backgroundColor: C.background }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>Forbidden</Text>
          <Text style={{ color: C.mutedText, marginTop: 8 }}>คุณไม่มีสิทธิ์เข้าหน้านี้</Text>
        </View>
      </WebLayout>
    );
  }

  // ── shared styles ─────────────────────────────────────────────────────────
  const statCard = { backgroundColor: C.surface, borderRadius: 16, padding: 16, minWidth: 160, borderWidth: 1, borderColor: C.border };
  const pillActive   = { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.primary };
  const pillInactive = { backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border };

  const toastColors = {
    success: { bg: C.primarySoft,  border: C.border,       text: C.primaryStrong },
    error:   { bg: C.logoutSoft,   border: C.logoutBorder, text: C.logout },
    info:    { bg: C.primarySoft2, border: C.border,       text: C.primary },
  };

  return (
    <WebLayout>
      <View style={{ flex: 1, backgroundColor: C.background, padding: 24 }}>

        {/* ── Page header ── */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
            {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>
              Admin Products
            </Text>
            <Text style={{ color: C.mutedText, marginTop: 6, fontSize: 13 }}>
              Signed in as {user?.username} • {user?.role}
            </Text>
          </View>

          <TouchableOpacity
            onPress={loadProducts}
            style={{ backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }}
          >
            <Text style={{ color: C.surface, fontWeight: "700" }}>
              {fetching ? "Refreshing..." : `Refresh ${Glyphs.sparkle}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Stat cards ── */}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {[
            { label: "Matched Products", value: pageInfo.totalProducts, color: C.inkText },
            { label: "Active",           value: activeCount,            color: C.primaryStrong },
            { label: "Inactive",         value: inactiveCount,          color: "#92400e" },
          ].map((s) => (
            <View key={s.label} style={statCard}>
              <Text style={{ color: C.mutedText, fontSize: 12 }}>{s.label}</Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: s.color, marginTop: 2 }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Search + filter ── */}
        <View style={{ marginTop: 18, gap: 12 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search product name or description…"
            placeholderTextColor={C.mutedText}
            style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 420, color: C.inkText, fontFamily: F?.sans } as any}
          />

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity onPress={() => setSelectedCategories([])} style={selectedCategories.length === 0 ? pillActive : pillInactive}>
              <Text style={{ color: selectedCategories.length === 0 ? C.surface : C.inkText, fontWeight: "600" }}>All</Text>
            </TouchableOpacity>
            {CATEGORY_OPTIONS.map((item) => {
              const active = selectedCategories.includes(item);
              return (
                <TouchableOpacity key={item} onPress={() => handleToggleCategory(item)} style={active ? pillActive : pillInactive}>
                  <Text style={{ color: active ? C.surface : C.inkText, fontWeight: "600" }}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!selectedCategories.length && (
            <Text style={{ color: C.mutedText, fontSize: 13 }}>Exact tag match: {selectedCategories.join(", ")}</Text>
          )}
        </View>

        {/* ── Toast ── */}
        {toast && (
          <View style={{ marginTop: 16, backgroundColor: toastColors[toast.type].bg, borderWidth: 1, borderColor: toastColors[toast.type].border, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: toastColors[toast.type].text, fontWeight: "600" }}>{toast.message}</Text>
          </View>
        )}

        {/* ── Error ── */}
        {error && (
          <View style={{ marginTop: 16, backgroundColor: C.logoutSoft, borderWidth: 1, borderColor: C.logoutBorder, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: C.logout, fontWeight: "600" }}>{error}</Text>
          </View>
        )}

        {/* ── Product list ── */}
        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
          {products.length === 0 ? (
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, alignItems: "center" }}>
              <Text style={{ fontSize: 20, marginBottom: 8 }}>{Glyphs.floral}</Text>
              <Text style={{ color: C.mutedText }}>No products found</Text>
            </View>
          ) : (
            products.map((product) => (
              <View
                key={product._id}
                style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: C.inkText, fontFamily: F?.sans }}>{product.name}</Text>
                    <Text style={{ color: C.mutedText, marginTop: 4, fontSize: 13 }}>{product.description || "-"}</Text>
                  </View>

                  {/* Active badge */}
                  <View style={{ backgroundColor: product.isActive ? C.primarySoft : "#fef3c7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: product.isActive ? C.border : "#fde68a" }}>
                    <Text style={{ color: product.isActive ? C.primaryStrong : "#92400e", fontWeight: "700", fontSize: 12 }}>
                      {product.isActive ? `Active ${Glyphs.sparkle}` : "Inactive"}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 12 }} />

                <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap" }}>
                  {[
                    { label: "Price",    value: formatPrice(product.salePrice) },
                    { label: "Stock",    value: String(product.stock) },
                    { label: "Category", value: product.category.join(", ") },
                    { label: "Rarity",   value: product.rarity },
                  ].map((row) => (
                    <View key={row.label} style={{ flexDirection: "row", gap: 4 }}>
                      <Text style={{ color: C.mutedText, fontSize: 13 }}>{row.label}:</Text>
                      <Text style={{ color: C.inkText, fontSize: 13, fontWeight: "500" }}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => handleToggleActive(product)}
                    style={{ backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 8 }}
                  >
                    <Text style={{ color: C.surface, fontWeight: "700" }}>
                      {product.isActive ? "Disable" : "Enable"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleArchive(product)}
                    style={{ backgroundColor: C.logoutSoft, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.logoutBorder }}
                  >
                    <Text style={{ color: C.logout, fontWeight: "700" }}>Archive</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/shop/[id]", params: { id: product._id } })}
                    style={{ backgroundColor: C.primarySoft, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
                  >
                    <Text style={{ color: C.inkText, fontWeight: "600" }}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </WebLayout>
  );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import WebLayout from "../common/WebLayout";
import {
  archiveProduct,
  getProducts,
  updateProduct,
  withRetry,
  type Product,
} from "@/services/productService";
import { useAuth } from "@/contexts/AuthContext";

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const CATEGORY_OPTIONS = ["Title", "Badge", "Theme"] as const;

// เปลี่ยนเป็น true ถ้าต้องการใช้ mock data ตอน backend ยังไม่พร้อม
const USE_MOCK_DATA = false;

const MOCK_PRODUCTS: Product[] = [
  {
    _id: "mock-1",
    name: "Pro Coder",
    description: "Special title for users who love coding every day.",
    category: ["Title"],
    originalPrice: 120,
    discountPercent: 10,
    salePrice: 108,
    stock: 25,
    imageUrl: "",
    rarity: "Common",
    isActive: true,
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  {
    _id: "mock-2",
    name: "Bug Hunter",
    description: "A rare badge for fearless debuggers.",
    category: ["Badge"],
    originalPrice: 250,
    discountPercent: 20,
    salePrice: 200,
    stock: 12,
    imageUrl: "",
    rarity: "Rare",
    isActive: true,
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  {
    _id: "mock-3",
    name: "Galaxy Theme",
    description: "A premium profile theme with cosmic vibes.",
    category: ["Theme"],
    originalPrice: 450,
    discountPercent: 15,
    salePrice: 382.5,
    stock: 8,
    imageUrl: "",
    rarity: "Epic",
    isActive: true,
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  {
    _id: "mock-4",
    name: "Legend Dev Pack",
    description: "Includes both a title and badge for legendary members.",
    category: ["Title", "Badge"],
    originalPrice: 790,
    discountPercent: 25,
    salePrice: 592.5,
    stock: 5,
    imageUrl: "",
    rarity: "Legendary",
    isActive: true,
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
  {
    _id: "mock-5",
    name: "Dark Neon Pack",
    description: "Theme and badge combo for night mode lovers.",
    category: ["Badge", "Theme"],
    originalPrice: 680,
    discountPercent: 10,
    salePrice: 612,
    stock: 0,
    imageUrl: "",
    rarity: "Epic",
    isActive: false,
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-14T00:00:00.000Z",
  },
];

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function matchMockProducts(
  products: Product[],
  query: string,
  categories: string[]
): Product[] {
  const q = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchQuery =
      !q ||
      product.name.toLowerCase().includes(q) ||
      (product.description || "").toLowerCase().includes(q);

    const matchCategory =
      categories.length === 0 ||
      categories.every((cat) => product.category.includes(cat as any));

    return matchQuery && matchCategory;
  });
}

export default function AdminProductManagementScreen() {
  const { user, hasRole, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    limit: 12,
    totalPages: 0,
    totalProducts: 0,
  });

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      setFetching(true);

      if (USE_MOCK_DATA) {
        const filtered = matchMockProducts(
          MOCK_PRODUCTS,
          query,
          selectedCategories
        );

        setProducts(filtered);
        setPageInfo({
          page: 1,
          limit: filtered.length || 12,
          totalPages: filtered.length ? 1 : 0,
          totalProducts: filtered.length,
        });
        return;
      }

      const response = await getProducts({
        q: query.trim(),
        category: selectedCategories,
        activeOnly: "false",
        sort: "newest",
        page: 1,
        limit: 50,
      });

      setProducts(response.data);
      setPageInfo({
        page: response.metadata.page,
        limit: response.metadata.limit,
        totalPages: response.metadata.totalPages,
        totalProducts: response.metadata.totalProducts,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [query, selectedCategories]);

  useEffect(() => {
    if (!authLoading && !hasRole("editor", "manager")) {
      router.replace("/community");
    }
  }, [authLoading, hasRole]);

  useEffect(() => {
    if (!authLoading && hasRole("editor", "manager")) {
      loadProducts();
    }
  }, [authLoading, hasRole, loadProducts]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeCount = useMemo(
    () => products.filter((item) => item.isActive).length,
    [products]
  );

  const inactiveCount = useMemo(
    () => products.filter((item) => !item.isActive).length,
    [products]
  );

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleToggleActive = async (product: Product) => {
    const previousItems = [...products];
    const nextActive = !product.isActive;

    setToast({
      type: "info",
      message: `${nextActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}สินค้าแล้ว (กำลังซิงก์...)`,
    });

    setProducts((prev) =>
      prev.map((item) =>
        item._id === product._id ? { ...item, isActive: nextActive } : item
      )
    );

    try {
      if (!USE_MOCK_DATA) {
        await withRetry(() =>
          updateProduct(product._id, {
            isActive: nextActive,
          })
        );
      }

      setToast({
        type: "success",
        message: "บันทึกสถานะสินค้าเรียบร้อย",
      });
    } catch (err) {
      setProducts(previousItems);
      setToast({
        type: "error",
        message: "ไม่สามารถดำเนินการได้ ระบบคืนค่าเดิมให้แล้ว",
      });
    }
  };

  const handleArchive = async (product: Product) => {
    const previousItems = [...products];

    setToast({
      type: "info",
      message: "ลบสินค้าแล้ว (กำลังซิงก์...)",
    });

    setProducts((prev) => prev.filter((item) => item._id !== product._id));

    try {
      if (!USE_MOCK_DATA) {
        await withRetry(() => archiveProduct(product._id));
      }

      setToast({
        type: "success",
        message: "ลบสินค้าเรียบร้อย",
      });
    } catch (err) {
      setProducts(previousItems);
      setToast({
        type: "error",
        message: "ไม่สามารถดำเนินการได้ ระบบคืนค่าเดิมให้แล้ว",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <WebLayout>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      </WebLayout>
    );
  }

  if (!hasRole("editor", "manager")) {
    return (
      <WebLayout>
        <View style={{ flex: 1, padding: 24, backgroundColor: "#f8fafc" }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}>
            Forbidden
          </Text>
          <Text style={{ color: "#6b7280", marginTop: 8 }}>
            คุณไม่มีสิทธิ์เข้าหน้านี้
          </Text>
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 24 }}>
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
            <Text style={{ fontSize: 30, fontWeight: "800", color: "#111827" }}>
              Admin Product Management
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 6 }}>
              Signed in as {user?.username} • {user?.role}
            </Text>
          </View>

          <TouchableOpacity
            onPress={loadProducts}
            style={{
              backgroundColor: "#111827",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {fetching ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
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
            <Text style={{ color: "#6b7280" }}>Matched Products</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>
              {pageInfo.totalProducts}
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
            <Text style={{ color: "#6b7280" }}>Active</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#166534" }}>
              {activeCount}
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
            <Text style={{ color: "#6b7280" }}>Inactive</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#92400e" }}>
              {inactiveCount}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 18, gap: 12 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search product name or description..."
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              maxWidth: 420,
            }}
          />

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity
              onPress={() => setSelectedCategories([])}
              style={{
                backgroundColor: selectedCategories.length === 0 ? "#111827" : "#fff",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor:
                  selectedCategories.length === 0 ? "#111827" : "#d1d5db",
              }}
            >
              <Text
                style={{
                  color: selectedCategories.length === 0 ? "#fff" : "#111827",
                  fontWeight: "700",
                }}
              >
                All
              </Text>
            </TouchableOpacity>

            {CATEGORY_OPTIONS.map((item) => {
              const active = selectedCategories.includes(item);

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleToggleCategory(item)}
                  style={{
                    backgroundColor: active ? "#111827" : "#fff",
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: active ? "#111827" : "#d1d5db",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#fff" : "#111827",
                      fontWeight: "700",
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!selectedCategories.length ? (
            <Text style={{ color: "#4b5563" }}>
              Exact tag match: {selectedCategories.join(", ")}
            </Text>
          ) : null}
        </View>

        {toast ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor:
                toast.type === "error"
                  ? "#fef2f2"
                  : toast.type === "success"
                  ? "#f0fdf4"
                  : "#eff6ff",
              borderWidth: 1,
              borderColor:
                toast.type === "error"
                  ? "#fecaca"
                  : toast.type === "success"
                  ? "#bbf7d0"
                  : "#bfdbfe",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text
              style={{
                color:
                  toast.type === "error"
                    ? "#b91c1c"
                    : toast.type === "success"
                    ? "#166534"
                    : "#1d4ed8",
                fontWeight: "700",
              }}
            >
              {toast.message}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ color: "#b91c1c", fontWeight: "700" }}>{error}</Text>
          </View>
        ) : null}

        <ScrollView style={{ marginTop: 20 }}>
          {products.length === 0 ? (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ color: "#6b7280" }}>No products found</Text>
            </View>
          ) : (
            products.map((product) => (
              <View
                key={product._id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 18,
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
                      {product.name}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 6 }}>
                      {product.description || "-"}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: product.isActive ? "#dcfce7" : "#fef3c7",
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        color: product.isActive ? "#166534" : "#92400e",
                        fontWeight: "800",
                      }}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
                  <Text style={{ color: "#374151" }}>
                    Price: {formatPrice(product.salePrice)}
                  </Text>
                  <Text style={{ color: "#374151" }}>Stock: {product.stock}</Text>
                  <Text style={{ color: "#374151" }}>
                    Category: {product.category.join(", ")}
                  </Text>
                  <Text style={{ color: "#374151" }}>Rarity: {product.rarity}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => handleToggleActive(product)}
                    style={{
                      backgroundColor: "#111827",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {product.isActive ? "Disable" : "Enable"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleArchive(product)}
                    style={{
                      backgroundColor: "#fee2e2",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Archive</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/shop/[id]",
                        params: { id: product._id },
                      })
                    }
                    style={{
                      backgroundColor: "#f3f4f6",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: "#111827", fontWeight: "700" }}>View</Text>
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
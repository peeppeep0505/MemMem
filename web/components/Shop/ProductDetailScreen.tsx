import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import WebLayout from "../common/WebLayout";
import {
  getProductById,
  isFavoriteProduct,
  toggleFavoriteProduct,
  type Product,
} from "@/services/productService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCartStore } from "@/store/useCartStore";

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function parseCategoryParam(value?: string | string[]) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(",");
  return value;
}

export default function ProductDetailScreen() {
  const { id, q, category } = useLocalSearchParams<{
    id: string;
    q?: string;
    category?: string | string[];
  }>();
  const router = useRouter();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setLoading(true);

        const data = await getProductById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      try {
        setFavoriteLoading(true);
        const value = await isFavoriteProduct(id);
        setIsFavorite(value);
      } finally {
        setFavoriteLoading(false);
      }
    };

    if (id) loadFavoriteState();
  }, [id]);

  const handleFavorite = async () => {
    if (!id) return;

    try {
      const next = await toggleFavoriteProduct(id);
      setIsFavorite(next);
    } catch (err: any) {
      setError(err?.message || "Failed to update favorite");
    }
  };

  const handleBack = () => {
    router.push({
      pathname: "/shop",
      params: {
        q: typeof q === "string" ? q : undefined,
        category: parseCategoryParam(category) || undefined,
        favId: id,
        favAction: isFavorite ? "add" : "remove",
        favTick: String(Date.now()),
      },
    });
  };

  return (
    <WebLayout>
      <View style={{ flex: 1, padding: 24, backgroundColor: "#f8fafc" }}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>Back</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ paddingTop: 40 }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 12, color: "#6b7280" }}>Loading...</Text>
          </View>
        ) : error || !product ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: "#b91c1c", fontSize: 16 }}>
              {error || "Product not found"}
            </Text>
          </View>
        ) : (
          <View
            style={{
              marginTop: 20,
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              maxWidth: 720,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <Text style={{ fontSize: 30, fontWeight: "800", color: "#111827", flex: 1 }}>
                {product.name}
              </Text>

              <TouchableOpacity
                disabled={favoriteLoading}
                onPress={handleFavorite}
                style={{
                  backgroundColor: isFavorite ? "#fee2e2" : "#f3f4f6",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontWeight: "800", color: "#111827" }}>
                  {favoriteLoading
                    ? "..."
                    : isFavorite
                    ? "❤️ Favorited"
                    : "🤍 Mark as Favorite"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#6b7280", marginTop: 12 }}>
              {product.description || "No description available."}
            </Text>

            <Text style={{ marginTop: 16, fontSize: 20, fontWeight: "800", color: "#111827" }}>
              {formatPrice(product.salePrice)}
            </Text>

            {product.discountPercent > 0 ? (
              <Text style={{ color: "#9ca3af", marginTop: 6, textDecorationLine: "line-through" }}>
                {formatPrice(product.originalPrice)}
              </Text>
            ) : null}

            <Text style={{ color: "#6b7280", marginTop: 8 }}>
              Category: {product.category.join(", ")}
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>Rarity: {product.rarity}</Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>Stock: {product.stock}</Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => addToCart(product)}
                style={{
                  backgroundColor: "#111827",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Add to cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFavorite}
                style={{
                  backgroundColor: isFavorite ? "#fee2e2" : "#f3f4f6",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "800" }}>
                  {isFavorite ? "Remove Favorite" : "Mark as Favorite"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </WebLayout>
  );
}
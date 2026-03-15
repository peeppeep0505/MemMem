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
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

function parseCategoryParam(value?: string | string[]) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(",");
  return value;
}

function getFriendlyProductError(err: any) {
  const message =
    err?.message ||
    err?.response?.data?.message ||
    err?.data?.message ||
    "";

  const lower = String(message).toLowerCase();

  if (
    lower.includes("cast to objectid failed") ||
    lower.includes("product not found") ||
    lower.includes("not found") ||
    lower.includes("invalid product id")
  ) {
    return "Product not found";
  }

  return "Unable to load product";
}

export default function ProductDetailScreen() {
  const { id, q, category } = useLocalSearchParams<{
    id: string;
    q?: string;
    category?: string | string[];
  }>();
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

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
        setProduct(null);
        setError(getFriendlyProductError(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
    else {
      setProduct(null);
      setError("Product not found");
      setLoading(false);
    }
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
    if (!id || !product) return;

    try {
      const next = await toggleFavoriteProduct(id);
      setIsFavorite(next);
    } catch (err: any) {
      setError(err?.message || "Failed to update favorite");
    }
  };

  const handleBack = () => {
    if (!id) {
      router.push("/shop");
      return;
    }

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
      <View style={{ flex: 1, padding: 24, backgroundColor: C.background }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{ alignSelf: "flex-start", marginBottom: 8 }}
        >
          <Text style={{ color: C.primary, fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 5 }}>
            {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 12 }}>{Glyphs.floral}</Text>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ marginTop: 12, color: C.mutedText }}>Loading…</Text>
          </View>
        ) : error || !product ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: C.logout, fontSize: 16 }}>
              {error || "Product not found"}
            </Text>
          </View>
        ) : (
          <View
            style={{
              marginTop: 8,
              backgroundColor: C.surface,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
              maxWidth: 720,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
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
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: C.inkText,
                  flex: 1,
                  fontFamily: F?.display ?? F?.serif,
                }}
              >
                {product.name}
              </Text>

              <TouchableOpacity
                disabled={favoriteLoading}
                onPress={handleFavorite}
                style={{
                  backgroundColor: isFavorite ? C.primarySoft2 : C.primarySoft,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isFavorite ? C.accent : C.border,
                }}
              >
                <Text style={{ fontWeight: "700", color: C.inkText, fontSize: 13 }}>
                  {favoriteLoading ? "…" : isFavorite ? `❤️ Favorited` : `🤍 Mark as Favorite`}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: C.ruledLine,
                marginVertical: 16,
              }}
            />

            <Text
              style={{
                color: C.mutedText,
                lineHeight: 22,
                fontFamily: F?.sans,
              }}
            >
              {product.description || "No description available."}
            </Text>

            <View style={{ marginTop: 16, gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: C.primary }}>
                {formatPrice(product.salePrice)}
              </Text>
              {product.discountPercent > 0 && (
                <Text
                  style={{
                    color: C.mutedText,
                    textDecorationLine: "line-through",
                    fontSize: 14,
                  }}
                >
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
            </View>

            <View style={{ marginTop: 14, gap: 6 }}>
              {[
                { label: "Category", value: product.category.join(", ") },
                { label: "Rarity", value: product.rarity },
                { label: "Stock", value: String(product.stock) },
              ].map((row) => (
                <View key={row.label} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: C.mutedText, fontSize: 13, width: 72 }}>
                    {row.label}
                  </Text>
                  <Text
                    style={{
                      color: C.inkText,
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: C.ruledLine,
                marginVertical: 18,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => addToCart(product)}
                style={{
                  backgroundColor: C.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 14,
                  alignSelf: "flex-start",
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 12,
                }}
              >
                <Text style={{ color: C.surface, fontWeight: "700" }}>
                  {`Add to cart ${Glyphs.heart}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </WebLayout>
  );
}
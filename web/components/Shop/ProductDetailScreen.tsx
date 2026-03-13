import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import WebLayout from "../common/WebLayout";
import { getProductById, type Product } from "@/services/productService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCartStore } from "@/store/useCartStore";

function formatPrice(value: number) {
  return `฿${value.toFixed(2)}`;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
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

  return (
    <WebLayout>
      <View style={{ flex: 1, padding: 24, backgroundColor: "#f8fafc" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>Back</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ paddingTop: 40 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : error || !product ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: "#b91c1c", fontSize: 16 }}>{error || "Product not found"}</Text>
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
            <Text style={{ fontSize: 30, fontWeight: "800", color: "#111827" }}>{product.name}</Text>
            <Text style={{ color: "#6b7280", marginTop: 12 }}>{product.description}</Text>
            <Text style={{ marginTop: 16, fontSize: 20, fontWeight: "800", color: "#111827" }}>
              {formatPrice(product.salePrice)}
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 8 }}>Category: {product.category}</Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>Rarity: {product.rarity}</Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>Stock: {product.stock}</Text>

            <TouchableOpacity
              onPress={() => addToCart(product)}
              style={{
                marginTop: 22,
                backgroundColor: "#111827",
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: 14,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Add to cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </WebLayout>
  );
}
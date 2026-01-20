// MealBoxWindow.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "http://10.0.2.2:3000";

export default function MealBoxWindow({ productName, email, close }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  const [isPer100g, setIsPer100g] = useState();
  useEffect(() => {
    (async () => {
      try {
        const storedValue = await AsyncStorage.getItem("isPer100g");
        if (storedValue !== null) {
          setIsPer100g(JSON.parse(storedValue));
        }
      } catch (err) {
        console.error("Chyba pri načítaní nastavení:", err);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!email) {
      setError("User email not available");
      setLoading(false);
      return;
    }
    if (!productName) {
      setError("No product selected");
      setLoading(false);
      return;
    }

    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const url = `${SERVER_URL}/api/getProductByName?email=${encodeURIComponent(
          email,
        )}&name=${encodeURIComponent(productName)}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Server returned ${res.status}`);
        }
        const body = await res.json();
        if (!mounted) return;
        setProduct(body.product || null);
      } catch (err) {
        console.error("Fetch error:", err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProduct();
    return () => (mounted = false);
  }, [email, productName]);

  return (
    <View style={localStyles.overlay}>
      <View style={localStyles.windowContainer}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : error ? (
          <>
            <Text style={localStyles.errorText}>Error: {error}</Text>
            <Pressable onPress={close} style={localStyles.closeButton}>
              <Text style={localStyles.closeButtonText}>Close</Text>
            </Pressable>
          </>
        ) : !product ? (
          <>
            <Text style={localStyles.title}>Product not found</Text>
            <Pressable onPress={close} style={localStyles.closeButton}>
              <Text style={localStyles.closeButtonText}>Close</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={localStyles.windowTitle}>{product.name}</Text>
            <Image
              source={{ uri: product.image }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                marginBottom: 12,
              }}
              resizeMode="cover"
            />

            <View style={localStyles.nutritionRow}>
              <Text style={{ margin: "auto", fontWeight: "bold" }}>
                {" "}
                {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Kalórie</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.calories ?? "N/A"} kcal`
                  : `${product.totalCalories ?? "N/A"} kcal`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Bielkoviny</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.proteins ?? "N/A"} g`
                  : `${product.totalProteins ?? "N/A"} g`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Sacharidy</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.carbs ?? "N/A"} g`
                  : `${product.totalCarbs ?? "N/A"} g`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Tuky</Text>
              <Text style={localStyles.value}>
                {" "}
                {isPer100g
                  ? `${product.fat ?? "N/A"} g`
                  : `${product.totalFat ?? "N/A"} g`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Vlákniny</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.fiber ?? "N/A"} g`
                  : `${product.totalFiber ?? "N/A"} g`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Cukry</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.sugar ?? "N/A"} g`
                  : `${product.totalSugar ?? "N/A"} g`}
              </Text>
            </View>

            <View style={localStyles.nutritionRow}>
              <Text style={localStyles.label}>Soľ</Text>
              <Text style={localStyles.value}>
                {isPer100g
                  ? `${product.salt ?? "N/A"} g`
                  : `${product.totalSalt ?? "N/A"} g`}
              </Text>
            </View>

            <Pressable onPress={close} style={localStyles.closeButton}>
              <Text style={localStyles.closeButtonText}>Zatvoriť</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  windowContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 10,
  },
  windowTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    fontWeight: "700",
    color: "#111",
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: "#hsla(129, 56%, 43%, 1)",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "700",
  },

  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

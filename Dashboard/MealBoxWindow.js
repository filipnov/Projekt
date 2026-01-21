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
import styles from "../styles"

const SERVER_URL = "https://app.bitewise.it.com";

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
    <View style={styles.overlay}>
  <View style={styles.window}>
    {loading ? (
      <ActivityIndicator size="large" />
    ) : error ? (
      <>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Pressable onPress={close} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </>
    ) : !product ? (
      <>
        <Text style={styles.title}>Product not found</Text>
        <Pressable onPress={close} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </>
    ) : (
      <>
        <Text style={styles.windowTitle}>{product.name}</Text>
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

        <View style={styles.nutritionRow}>
          <Text style={{ margin: "auto", fontWeight: "bold" }}>
            {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Kalórie</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.calories ?? "N/A"} kcal`
              : `${product.totalCalories ?? "N/A"} kcal`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Bielkoviny</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.proteins ?? "N/A"} g`
              : `${product.totalProteins ?? "N/A"} g`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Sacharidy</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.carbs ?? "N/A"} g`
              : `${product.totalCarbs ?? "N/A"} g`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Tuky</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.fat ?? "N/A"} g`
              : `${product.totalFat ?? "N/A"} g`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Vlákniny</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.fiber ?? "N/A"} g`
              : `${product.totalFiber ?? "N/A"} g`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Cukry</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.sugar ?? "N/A"} g`
              : `${product.totalSugar ?? "N/A"} g`}
          </Text>
        </View>

        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Soľ</Text>
          <Text style={styles.nutritionValue}>
            {isPer100g
              ? `${product.salt ?? "N/A"} g`
              : `${product.totalSalt ?? "N/A"} g`}
          </Text>
        </View>

        <Pressable onPress={close} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Zatvoriť</Text>
        </Pressable>
      </>
    )}
  </View>
</View>
  );
}


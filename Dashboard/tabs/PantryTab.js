// PantryTab.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Image,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import styles from "../../styles"; // pôvodné globálne štýly

export default function PantryTab({ removeMealBox, removeProduct, addEatenValues }) {
  const SERVER_URL = "https://app.bitewise.it.com";
  const [userEmail, setUserEmail] = useState(null);
  const [mealBoxes, setMealBoxes] = useState([]);
  const [activeBox, setActiveBox] = useState(null);

  // načítanie produktov z backendu
  const fetchMealBoxes = async (email) => {
    try {
      const res = await fetch(
        `${SERVER_URL}/api/getProducts?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (data.success) {
        const boxes = data.products.map((p) => ({
          id: p.productId || p.name,
          productId: p.productId,
          name: p.name,
          image: p.image,
          calories: p.calories || 0,
          proteins: p.proteins || 0,
          carbs: p.carbs || 0,
          fat: p.fat || 0,
          fiber: p.fiber || 0,
          sugar: p.sugar || 0,
          salt: p.salt || 0,
          totalCalories: p.totalCalories || 0,
          totalProteins: p.totalProteins || 0,
          totalCarbs: p.totalCarbs || 0,
          totalFat: p.totalFat || 0,
          totalFiber: p.totalFiber || 0,
          totalSugar: p.totalSugar || 0,
          totalSalt: p.totalSalt || 0,
        }));
        setMealBoxes(boxes);
      }
    } catch (err) {
      console.error("Error fetching meal boxes:", err);
    }
  };

  // načítanie emailu z AsyncStorage
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("userEmail")
      .then((email) => {
        if (mounted && email) setUserEmail(email);
      })
      .catch((err) => console.error("AsyncStorage error:", err));
    return () => (mounted = false);
  }, []);

  // automatické načítanie pri zobrazení tabu
  useFocusEffect(
    React.useCallback(() => {
      if (userEmail) fetchMealBoxes(userEmail);
    }, [userEmail])
  );

  const openWindow = (box) => setActiveBox(box);
  const closeWindow = () => setActiveBox(null);

  const handleRemoveMealBox = async (id, productId, box) => {
    removeMealBox(id, productId, box);
    setTimeout(() => {
      if (userEmail) fetchMealBoxes(userEmail);
    }, 300);
  };

  // ---------------------------
  // MealBoxItem definícia inline
  const MealBoxItem = ({ box, removeMealBox, removeProduct, openWindow }) => (
    <Pressable onPress={() => openWindow(box)} style={styles.box}>
      <ImageBackground
        source={{ uri: box.image }}
        style={{ flex: 1, justifyContent: "space-between" }}
      >
        <Text style={styles.mealBoxText}>{box.name}</Text>
        <View>
          <Pressable onPress={() => removeMealBox(box.id)}>
            <Text style={styles.eatenButton}>Zjedené ✅</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </Pressable>
  );

  // ---------------------------
  // MealBoxWindow definícia inline
  const MealBoxWindow = ({ productName, email, close }) => {
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);
    const [isPer100g, setIsPer100g] = useState();

    useEffect(() => {
      (async () => {
        try {
          const storedValue = await AsyncStorage.getItem("isPer100g");
          if (storedValue !== null) setIsPer100g(JSON.parse(storedValue));
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
            email
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

              {[
                { label: "Kalórie", value: isPer100g ? product.calories : product.totalCalories },
                { label: "Bielkoviny", value: isPer100g ? product.proteins : product.totalProteins },
                { label: "Sacharidy", value: isPer100g ? product.carbs : product.totalCarbs },
                { label: "Tuky", value: isPer100g ? product.fat : product.totalFat },
                { label: "Vlákniny", value: isPer100g ? product.fiber : product.totalFiber },
                { label: "Cukry", value: isPer100g ? product.sugar : product.totalSugar },
                { label: "Soľ", value: isPer100g ? product.salt : product.totalSalt },
              ].map((nutrient) => (
                <View key={nutrient.label} style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>{nutrient.label}</Text>
                  <Text style={styles.nutritionValue}>
                    {nutrient.value ?? "N/A"} {nutrient.label === "Kalórie" ? "kcal" : "g"}
                  </Text>
                </View>
              ))}

              <Pressable onPress={close} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Zatvoriť</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  // ---------------------------
  return (
    <View style={styles.mealBox}>
      <Pressable onPress={() => userEmail && fetchMealBoxes(userEmail)}>
        <Text
          style={{
            color: "black",
            backgroundColor: "yellow",
            borderRadius: 20,
            width: "40%",
            textAlign: "center",
            alignSelf: "center",
            padding: 10,
            marginTop: 10,
          }}
        >
          Obnoviť
        </Text>
      </Pressable>

      <Modal visible={!!activeBox} animationType="slide" transparent={true} onRequestClose={closeWindow}>
        <MealBoxWindow productName={activeBox?.name} email={userEmail} close={closeWindow} />
      </Modal>

      <ScrollView style={styles.mealContainer}>
        <View style={styles.row}>
          {mealBoxes.map((box) => (
            <MealBoxItem
              key={box.id}
              box={box}
              removeMealBox={(id) => handleRemoveMealBox(id, box.productId, box)}
              removeProduct={removeProduct}
              openWindow={openWindow}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

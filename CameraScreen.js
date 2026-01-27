// CameraScreen.js 577
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import arrow from "./assets/left_arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function CameraScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [showContent, setShowContent] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");
  const [productData, setProductData] = useState(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [awaitingQuantity, setAwaitingQuantity] = useState(false);
  const [showNutriValues] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
  const SERVER_URL = "https://app.bitewise.it.com";

  const API_URL = "https://world.openfoodfacts.org/api/v0/product";

  async function debugFetch(url, options = {}) {
    console.log("🌐 FETCH →", url, options);
    const response = await fetch(url, options);
    console.log("📥 RESPONSE STATUS:", response.status);
    return response;
  }

  async function handleAddProduct(
    productName,
    totalCalories,
    totalProteins,
    totalCarbs,
    totalFat,
    totalFiber,
    totalSalt,
    totalSugar,
    calories,
    proteins,
    carbs,
    fat,
    fiber,
    salt,
    sugar,
    image,
  ) {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      console.log(
        "📤 Sending product to backend:",
        productName,
        "Calories:",
        totalCalories,
        "Email:",
        email,
      );

      const response = await debugFetch(`${SERVER_URL}/api/addProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          product: productName,
          totalCalories,
          totalProteins,
          totalCarbs,
          totalFat,
          totalFiber,
          totalSalt,
          totalSugar,
          calories,
          proteins,
          carbs,
          fat,
          fiber,
          salt,
          sugar,
          image,
        }),
      });

      const data = await response.json();
      console.log("📥 Server response:", data);

      if (data.success && Array.isArray(data.products)) {
        // 🔁 ulož celý nový stav produktov
        await AsyncStorage.setItem("products", JSON.stringify(data.products));
        console.log("✅ AsyncStorage(products) updated");
      }
    } catch (err) {
      console.error("❌ Error sending product:", err);
    }
  }

  function calculateTotals(product, weight) {
    return {
      ...product,
      quantity: weight,
      totalCalories: Number(((product.calories / 100) * weight).toFixed(0)),
      totalFat: Number(((product.fat / 100) * weight).toFixed(1)),
      totalCarbs: Number(((product.carbs / 100) * weight).toFixed(1)),
      totalSugar: Number(((product.sugar / 100) * weight).toFixed(1)),
      totalProteins: Number(((product.proteins / 100) * weight).toFixed(1)),
      totalSalt: Number(((product.salt / 100) * weight).toFixed(1)),
      totalFiber: Number(((product.fiber / 100) * weight).toFixed(1)),
    };
  }

  async function fetchProductData(barcode) {
    setLoading(true);
    setAwaitingQuantity(false);
    setQuantityInput("");
    setProductData(null);

    try {
      const response = await debugFetch(`${API_URL}/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        const product = data.product;
        const n = product.nutriments;
        const weight = Number(product.product_quantity);

        const productInfo = {
          name: product.product_name || "Neznámy produkt",
          image: product.image_url,
          calories: n?.["energy-kcal_100g"] || 0,
          fat: n?.fat_100g || 0,
          carbs: n?.carbohydrates_100g || 0,
          sugar: n?.sugars_100g || 0,
          proteins: n?.proteins_100g || 0,
          salt: n?.salt_100g || 0,
          fiber: n?.fiber_100g || 0,
          quantity: weight,
        };

        let finalProduct = productInfo;

        if (weight && !isNaN(weight) && weight > 0) {
          finalProduct = calculateTotals(productInfo, weight);
        } else {
          setAwaitingQuantity(true);
        }

        setProductData(finalProduct);
        // ❗ kamera ostáva STOP, lebo productData != null
      } else {
        setNotFound(true);

        setTimeout(() => {
          setNotFound(false);
          setScanned(false);
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Chyba pri načítaní produktu:", err);

      setNotFound(true);

      setTimeout(() => {
        setNotFound(false);
        setScanned(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned || loading || productData) return;

    setScanned(true);
    fetchProductData(data);
  }

  const handleShowContent = () => setShowContent(!showContent);

  const renderContent = () => {
    if (!showContent || productData) return null;

    return (
      <KeyboardWrapper scroll={false} style={styles.manualAddContainer}>
        <Text style={styles.manualAddText}>
          Zadajte EAN pre pridanie produktu.
        </Text>

        <TextInput
          style={styles.manualAddInput}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
        />

        <Pressable
          onPress={() => {
            fetchProductData(code);
          }}
          style={styles.primaryActionButton}
        >
          <Text style={styles.primaryActionButtonText}>Pridať</Text>
        </Pressable>
      </KeyboardWrapper>
    );
  };

  const saveToDatabase = async () => {
    if (!productData) return;

    try {
      await handleAddProduct(
        productData.name,
        productData.totalCalories,
        productData.totalProteins,
        productData.totalCarbs,
        productData.totalFat,
        productData.totalFiber,
        productData.totalSalt,
        productData.totalSugar,
        productData.calories,
        productData.proteins,
        productData.carbs,
        productData.fat,
        productData.fiber,
        productData.salt,
        productData.sugar,
        productData.image,
      );

      setProductData(null);
      setScanned(false); // 🔁 znovu povolí skenovanie
    } catch (err) {
      Alert.alert("Chyba", "Nepodarilo sa uložiť produkt.");
    }
  };

  const addDirectlyToEaten = async () => {
    if (!productData) return;

    try {
      const storedTotals = await AsyncStorage.getItem("eatenTotals");
      const baseTotals = {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
        drunkWater: 0,
      };

      const currentTotals = storedTotals
        ? { ...baseTotals, ...JSON.parse(storedTotals) }
        : baseTotals;

      const updatedTotals = {
        calories: currentTotals.calories + (productData.totalCalories || 0),
        proteins: currentTotals.proteins + (productData.totalProteins || 0),
        carbs: currentTotals.carbs + (productData.totalCarbs || 0),
        fat: currentTotals.fat + (productData.totalFat || 0),
        fiber: currentTotals.fiber + (productData.totalFiber || 0),
        sugar: currentTotals.sugar + (productData.totalSugar || 0),
        salt: currentTotals.salt + (productData.totalSalt || 0),
        drunkWater: currentTotals.drunkWater,
      };

      await AsyncStorage.setItem("eatenTotals", JSON.stringify(updatedTotals));

      setProductData(null);
      setScanned(false); // 🔁 znovu skenovať
    } catch (err) {
      Alert.alert("Chyba", "Nepodarilo sa pridať produkt.");
    }
  };

  if (!permission) return <Text>Načítavam oprávnenia...</Text>;
  if (!permission.granted)
    return (
      <View style={{ marginTop: 500, width: "80%", alignSelf: "center" }}>
        <Text style={{ textAlign: "center" }}>
          Táto aplikácia potrebuje prístup ku kamere.
        </Text>
        <Button title="Povoliť kameru" onPress={requestPermission} />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {/* 🔄 SPINNER – VŽDY NAD VŠETKÝM */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129,56%,43%,1)" />
            <Text style={styles.generatingModalTitle}>Hľadám produkt…</Text>
          </View>
        </View>
      </Modal>
      {/* ❌ PRODUKT NENÁJDENÝ */}
      <Modal visible={notFound} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: "#c62828" }}
            >
              Produkt nenájdený
            </Text>
          </View>
        </View>
      </Modal>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
      />

      <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
        {renderContent()}

        {!productData && (
          <Pressable style={styles.manualAddButton} onPress={handleShowContent}>
            <Text style={styles.manualAddButtonText}>Zadať manuálne</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.backArrowPressed : styles.backArrowContainer
          }
          onPress={() => navigation.goBack()}
        >
          <Image source={arrow} style={styles.backArrowImage} />
        </Pressable>

        {productData && (
          <ScrollView
            style={{
              maxHeight: 450,
              marginBottom: 300,
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 10,
              width: 300,
            }}
            contentContainerStyle={{
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}
            >
              {productData.name}
            </Text>

            {productData.image && (
              <Image
                source={{ uri: productData.image }}
                style={{ width: 100, height: 100, marginTop: 10 }}
              />
            )}

            {awaitingQuantity ? (
              <KeyboardWrapper scroll={false} style={{ marginTop: 10 }}>
                <Text>Zadajte hmotnosť produktu (g) :</Text>

                <TextInput
                  style={styles.manualAddInput}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="50"
                  keyboardType="numeric"
                />

                <Pressable
                  style={styles.primaryActionButton}
                  onPress={async () => {
                    const weight = Number(quantityInput);

                    if (isNaN(weight) || weight <= 0) {
                      Alert.alert(
                        "Chyba",
                        "Zadajte platnú hmotnosť (číslo väčšie ako 0)!",
                      );
                      return;
                    }

                    setProductData(calculateTotals(productData, weight));
                    setAwaitingQuantity(false);
                  }}
                >
                  <Text style={styles.primaryActionButtonText}>
                    Uložiť hmotnosť
                  </Text>
                </Pressable>
              </KeyboardWrapper>
            ) : (
              <Text>Hmotnosť: {productData.quantity} g</Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Kalórie (100g): ${productData.calories ?? "N/A"} kcal`
                  : `Kalórie: ${productData.totalCalories ?? "N/A"} kcal`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Tuky (100g): ${productData.fat ?? "N/A"} g`
                  : `Tuky: ${productData.totalFat ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Bielkoviny (100g): ${productData.proteins ?? "N/A"} g`
                  : `Bielkoviny: ${productData.totalProteins ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Sacharidy (100g): ${productData.carbs ?? "N/A"} g`
                  : `Sacharidy: ${productData.totalCarbs ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Cukry (100g): ${productData.sugar ?? "N/A"} g`
                  : `Cukry: ${productData.totalSugar ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Soľ (100g): ${productData.salt ?? "N/A"} g`
                  : `Soľ: ${productData.totalSalt ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Text>
                {showNutriValues && isPer100g
                  ? `Vláknina (100g): ${productData.fiber ?? "N/A"} g`
                  : `Vláknina: ${productData.totalFiber ?? "N/A"} g`}
              </Text>
            )}

            {!awaitingQuantity && (
              <Pressable
                style={styles.primaryActionButton}
                onPress={saveToDatabase}
              >
                <Text style={styles.primaryActionButtonText}>Špajza</Text>
              </Pressable>
            )}

            {!awaitingQuantity && (
              <Pressable
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: "#2196F3" },
                ]}
                onPress={addDirectlyToEaten}
              >
                <Text style={styles.primaryActionButtonText}>Zjedené</Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

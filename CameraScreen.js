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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import arrow from "./assets/left-arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    image
  ) {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      console.log(
        "📤 Sending product to backend:",
        productName,
        "Calories:",
        totalCalories,
        "Email:",
        email
      );

      const response = await debugFetch("http://10.0.2.2:3000/api/addProduct", {
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
          image,
        }),
      });

      const data = await response.json();
      console.log("📥 Server response:", data);
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
    setProductData(null);
    setAwaitingQuantity(false);
    setQuantityInput("");

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
          saturatedFat: n?.["saturated-fat_100g"] || 0,
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
      } else {
        Alert.alert("❌ Produkt sa nenašiel", `Kód: ${barcode}`);
      }
    } catch (err) {
      console.error("❌ Chyba pri načítaní produktu:", err);
      Alert.alert("Chyba", "Nepodarilo sa načítať dáta.");
    }
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned) return;
    setScanned(true);
    await fetchProductData(data);
    setTimeout(() => setScanned(false), 900000);
  }

  const handleShowContent = () => setShowContent(!showContent);

  const renderContent = () => {
    if (!showContent || productData) return null;

    return (
      <View style={styles.manual_add_container}>
        <Text style={styles.manual_add_text}>
          Zadajte EAN pre pridanie produktu.
        </Text>

        <TextInput
          style={styles.manual_add_input}
          value={code}
          onChangeText={setCode}
        />

        <Pressable
          onPress={() => {
            fetchProductData(code);
          }}
          style={styles.manual_add_container_button}
        >
          <Text style={styles.manual_add_container_button_text}>Pridať</Text>
        </Pressable>
      </View>
    );
  };

  const saveToDatabase = async () => {
    if (!productData) {
      Alert.alert("Chyba", "Nie je načítaný žiaden produkt.");
      return;
    }

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
        productData.image
      );
      setCode();
      setProductData(null);
    } catch (err) {
      console.error("❌ Chyba pri ukladaní:", err);
      Alert.alert("Chyba", "Nepodarilo sa uložiť produkt.");
    }
  };

  const addDirectlyToEaten = async () => {
    if (!productData) {
      Alert.alert("Chyba", "Nie je načítaný žiaden produkt.");
      return;
    }

    try {
      const storedTotals = await AsyncStorage.getItem("eatenTotals");
      let currentTotals = storedTotals
        ? JSON.parse(storedTotals)
        : {
            calories: 0,
            proteins: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            salt: 0,
          };

      const updatedTotals = {
        calories: currentTotals.calories + (productData.totalCalories || 0),
        proteins: currentTotals.proteins + (productData.totalProteins || 0),
        carbs: currentTotals.carbs + (productData.totalCarbs || 0),
        fat: currentTotals.fat + (productData.totalFat || 0),
        fiber: currentTotals.fiber + (productData.totalFiber || 0),
        sugar: currentTotals.sugar + (productData.totalSugar || 0),
        salt: currentTotals.salt + (productData.totalSalt || 0),
      };

      await AsyncStorage.setItem("eatenTotals", JSON.stringify(updatedTotals));

      setCode("");
      setProductData(null);
    } catch (err) {
      console.error("❌ Chyba pri pridávaní:", err);
      Alert.alert("Chyba", "Nepodarilo sa pridať produkt do zjedených hodnôt.");
    }
  };

  if (!permission) return <Text>Načítavam oprávnenia...</Text>;
  if (!permission.granted)
    return (
      <View>
        <Text>Táto aplikácia potrebuje prístup ku kamere.</Text>
        <Button title="Povoliť kameru" onPress={requestPermission} />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
      />

      <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
        {renderContent()}

        {!productData && (
          <Pressable
            style={styles.manual_add_button}
            onPress={handleShowContent}
          >
            <Text style={styles.manual_add_button_text}>Zadať manuálne</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.arrow_pressed : styles.arrow_container
          }
          onPress={() => navigation.goBack()}
        >
          <Image source={arrow} style={styles.arrow} />
        </Pressable>

        {productData && (
          <ScrollView
            style={{
              maxHeight: 450,
              marginBottom: 130,
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
              <View style={{ marginTop: 10 }}>
                <Text>Zadajte hmotnosť produktu (g) :</Text>
                <TextInput
                  style={styles.manual_add_input}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="50"
                  keyboardType="numeric"
                />
                <Pressable
                  style={styles.manual_add_container_button}
                  onPress={async () => {
                    const weight = Number(quantityInput);

                    if (isNaN(weight) || weight <= 0) {
                      Alert.alert(
                        "Chyba",
                        "Zadajte platnú hmotnosť (číslo väčšie ako 0)!"
                      );
                      return;
                    }

                    setProductData(calculateTotals(productData, weight));
                    setAwaitingQuantity(false);
                  }}
                >
                  <Text style={styles.manual_add_container_button_text}>
                    Uložiť hmotnosť
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text>Hmotnosť: {productData.quantity} g</Text>
            )}

            <Text>
              {showNutriValues && isPer100g
                ? `Kalórie (100g): ${productData.calories ?? "N/A"} kcal`
                : `Kalórie: ${productData.totalCalories ?? "N/A"} kcal`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Tuky (100g): ${productData.fat ?? "N/A"} g`
                : `Tuky: ${productData.totalFat ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Bielkoviny (100g): ${productData.proteins ?? "N/A"} g`
                : `Bielkoviny: ${productData.totalProteins ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Sacharidy (100g): ${productData.carbs ?? "N/A"} g`
                : `Sacharidy: ${productData.totalCarbs ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Cukry (100g): ${productData.sugar ?? "N/A"} g`
                : `Cukry: ${productData.totalSugar ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Soľ (100g): ${productData.salt ?? "N/A"} g`
                : `Soľ: ${productData.totalSalt ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues && isPer100g
                ? `Vláknina (100g): ${productData.fiber ?? "N/A"} g`
                : `Vláknina: ${productData.totalFiber ?? "N/A"} g`}
            </Text>

            <Pressable
              style={styles.manual_add_container_button}
              onPress={saveToDatabase}
            >
              <Text style={styles.manual_add_container_button_text}>
                Špajza
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.manual_add_container_button,
                { backgroundColor: "#2196F3" },
              ]}
              onPress={addDirectlyToEaten}
            >
              <Text style={styles.manual_add_container_button_text}>
                Zjedené
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrow_container: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    alignSelf: "center",
  },
  arrow: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50,
    marginBottom: 40,
  },
  arrow_pressed: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 40,
    opacity: 0.8,
  },
  manual_add_button: {
    backgroundColor: "white",
    padding: 5,
    width: 160,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    alignSelf: "center",
  },
  manual_add_button_text: {
    fontSize: 18,
    fontWeight: "700",
  },
  manual_add_container: {
    backgroundColor: "white",
    borderRadius: 15,
    width: 250,
    height: 270,
    alignSelf: "center",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  manual_add_text: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
  },
  manual_add_input: {
    backgroundColor: "white",
    fontSize: 18,
    width: 180,
    height: 45,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 10,
    textAlign: "center",
  },
  manual_add_container_button: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 180,
    height: 35,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  manual_add_container_button_text: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
});

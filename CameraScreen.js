import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
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

  // Funkcia pre správne fetchovanie a výpočet nutričných hodnôt
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

        // Extrahovanie hmotnosti z API
        const qty = product.quantity;
        const nums = qty != null ? String(qty).match(/\d+(\.\d+)?/g) : null;
        const weight = nums ? Math.max(...nums.map(Number)) : null;

        const productInfo = {
          name: product.product_name,
          image: product.image_url,
          calories: n?.["energy-kcal_100g"],
          fat: n?.fat_100g,
          saturatedFat: n?.["saturated-fat_100g"],
          carbs: n?.carbohydrates_100g,
          sugar: n?.sugars_100g,
          proteins: n?.proteins_100g,
          salt: n?.salt_100g,
          fiber: n?.fiber_100g,
          ingredients: product.ingredients_text,
          quantity: qty,
        };

        if (weight) {
          productInfo.totalCalories = productInfo.calories
            ? (productInfo.calories / 100) * weight
            : 0;
          productInfo.totalFat = productInfo.fat
            ? (productInfo.fat / 100) * weight
            : 0;
          productInfo.totalCarbs = productInfo.carbs
            ? (productInfo.carbs / 100) * weight
            : 0;
          productInfo.totalSugar = productInfo.sugar
            ? (productInfo.sugar / 100) * weight
            : 0;
          productInfo.totalProteins = productInfo.proteins
            ? (productInfo.proteins / 100) * weight
            : 0;
          productInfo.totalSalt = productInfo.salt
            ? (productInfo.salt / 100) * weight
            : 0;
          productInfo.totalFiber = productInfo.fiber
            ? (productInfo.fiber / 100) * weight
            : 0;

          //  Zaokrúhlenie na jedno desatinné miesto
          productInfo.totalCalories = Number(
            productInfo.totalCalories.toFixed(0)
          );
          productInfo.totalFat = Number(productInfo.totalFat.toFixed(0));
          productInfo.totalCarbs = Number(productInfo.totalCarbs.toFixed(0));
          productInfo.totalSugar = Number(productInfo.totalSugar.toFixed(0));
          productInfo.totalProteins = Number(
            productInfo.totalProteins.toFixed(0)
          );
          productInfo.totalSalt = Number(productInfo.totalSalt.toFixed(0));
          productInfo.totalFiber = Number(productInfo.totalFiber.toFixed(0));

          // push do DB
          await handleAddProduct(
            productInfo.name,
            productInfo.totalCalories,
            productInfo.totalProteins,
            productInfo.totalCarbs,
            productInfo.totalFat,
            productInfo.totalFiber,
            productInfo.totalSalt,
            productInfo.totalSugar,
            productInfo.image
          );

          Alert.alert(
            "Produkt nájdený",
            product.product_name || "Neznámy názov"
          );
        } else {
          setAwaitingQuantity(true);
        }

        setProductData(productInfo);
      } else {
        Alert.alert("❌ Produkt sa nenašiel", `Kód: ${barcode}`);
      }
    } catch (err) {
      console.error("❌ Chyba pri načítaní produktu:", err);
      Alert.alert("Chyba", "Nepodarilo sa načítať dáta.");
    }
  }

  // handleBarCodeScanned
  async function handleBarCodeScanned({ data }) {
    if (scanned) return;
    setScanned(true);
    await fetchProductData(data);
    setTimeout(() => setScanned(false), 3000);
  }

  const handleShowContent = () => setShowContent(!showContent);

  const renderContent = () => {
    if (!showContent || productData) return null;

    return (
      <View style={styles.manual_add_container}>
        <Text style={styles.manual_add_text}>
          Zadajte čísla pod čiarovým kódom pre pridanie produktu.
        </Text>

        <TextInput
          style={styles.manual_add_input}
          value={code}
          onChangeText={setCode}
        />

        <Pressable
          onPress={() => {
            fetchProductData(code);
            setTimeout(() => setProductData(null), 9000);
          }}
          style={styles.manual_add_container_button}
        >
          <Text style={styles.manual_add_container_button_text}>Pridať</Text>
        </Pressable>
      </View>
    );
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
              maxHeight: 400,
              marginTop: 10,
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 10,
              width: 300,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
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
                    const weight = parseFloat(quantityInput);
                    if (isNaN(weight) || weight <= 0) {
                      Alert.alert(
                        "Chyba",
                        "Zadajte platnú hmotnosť (číslo väčšie ako 0)!"
                      );
                      return;
                    }

                    const updatedProduct = {
                      ...productData,
                      quantity: quantityInput,
                      totalCalories: productData.calories
                        ? (productData.calories / 100) * weight
                        : 0,
                      totalFat: productData.fat
                        ? (productData.fat / 100) * weight
                        : 0,
                      totalCarbs: productData.carbs
                        ? (productData.carbs / 100) * weight
                        : 0,
                      totalSugar: productData.sugar
                        ? (productData.sugar / 100) * weight
                        : 0,
                      totalProteins: productData.proteins
                        ? (productData.proteins / 100) * weight
                        : 0,
                      totalSalt: productData.salt
                        ? (productData.salt / 100) * weight
                        : 0,
                      totalFiber: productData.fiber
                        ? (productData.fiber / 100) * weight
                        : 0,
                    };

                    // Zaokrúhlenie pri manuálnom zadaní
                    updatedProduct.totalCalories = Number(
                      updatedProduct.totalCalories.toFixed(0)
                    );
                    updatedProduct.totalFat = Number(
                      updatedProduct.totalFat.toFixed(0)
                    );
                    updatedProduct.totalCarbs = Number(
                      updatedProduct.totalCarbs.toFixed(0)
                    );
                    updatedProduct.totalSugar = Number(
                      updatedProduct.totalSugar.toFixed(0)
                    );
                    updatedProduct.totalProteins = Number(
                      updatedProduct.totalProteins.toFixed(0)
                    );
                    updatedProduct.totalSalt = Number(
                      updatedProduct.totalSalt.toFixed(0)
                    );
                    updatedProduct.totalFiber = Number(
                      updatedProduct.totalFiber.toFixed(0)
                    );

                    setProductData(updatedProduct);
                    setAwaitingQuantity(false);

                    await handleAddProduct(
                      updatedProduct.name,
                      updatedProduct.totalCalories,
                      updatedProduct.totalProteins,
                      updatedProduct.totalCarbs,
                      updatedProduct.totalFat,
                      updatedProduct.totalFiber,
                      updatedProduct.totalSalt,
                      updatedProduct.totalSugar
                    );

                    Alert.alert(
                      "Produkt uložený",
                      `${updatedProduct.name} (${weight} g)`
                    );
                  }}
                >
                  <Text style={styles.manual_add_container_button_text}>
                    Uložiť hmotnosť
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text>Hmotnosť: {productData.quantity}</Text>
            )}

            <Text>
              {showNutriValues
                ? `Kalórie: ${productData.totalCalories ?? "N/A"} kcal`
                : `Kalórie (100g): ${productData.calories ?? "N/A"} kcal`}
            </Text>

            <Text>
              {showNutriValues
                ? `Tuky: ${productData.totalFat ?? "N/A"} g`
                : `Tuky (100g): ${productData.fat ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues
                ? `Bielkoviny: ${productData.totalProteins ?? "N/A"} g`
                : `Bielkoviny (100g): ${productData.proteins ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues
                ? `Sacharidy: ${productData.totalCarbs ?? "N/A"} g`
                : `Sacharidy (100g): ${productData.carbs ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues
                ? `Cukry: ${productData.totalSugar ?? "N/A"} g`
                : `Cukry (100g): ${productData.sugar ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues
                ? `Soľ: ${productData.totalSalt ?? "N/A"} g`
                : `Soľ (100g): ${productData.salt ?? "N/A"} g`}
            </Text>

            <Text>
              {showNutriValues
                ? `Vláknina: ${productData.totalFiber ?? "N/A"} g`
                : `Vláknina (100g): ${productData.fiber ?? "N/A"} g`}
            </Text>
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
    width: 300,
    height: 250,
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

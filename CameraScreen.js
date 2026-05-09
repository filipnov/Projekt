// CameraScreen.js 577
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Pressable,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import arrow from "./assets/left_arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { scheduleExpirationNotificationForProduct } from "./notifications";
import { updateTotalsForDate } from "./dailyTotalsStorage";

const SERVER_URL = "https://app.bitewise.it.com";
const API_URL = "https://world.openfoodfacts.org/api/v0/product";
const OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_SEARCH_FIELDS =
  "code,product_name,brands,quantity,product_quantity,image_url,nutriments";

export default function CameraScreen() {
  const getTodayKey = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [showContent, setShowContent] = useState(false);
  const [lookupMode, setLookupMode] = useState("scan");
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [productData, setProductData] = useState(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [awaitingQuantity, setAwaitingQuantity] = useState(false);
  const showNutriValues = true;
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [expiration, setExpiration] = useState();
  const [isPer100g, setIsPer100g] = useState();
  const [showExpInput, setShowExpInput] = useState(false);
  const [selectedExpirationDate, setSelectedExpirationDate] = useState(
    new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [awaitingExpirationDate, setAwaitingExpirationDate] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("isPer100g").then((storedValue) => {
      if (storedValue !== null) setIsPer100g(JSON.parse(storedValue));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("expiration").then((storedValue) => {
      if (storedValue !== null) setExpiration(JSON.parse(storedValue));
    });
  }, []);

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
    expirationDate,
  ) {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const response = await fetch(`${SERVER_URL}/api/addProduct`, {
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
          expirationDate,
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.products)) {
        await AsyncStorage.setItem("products", JSON.stringify(data.products));
        await scheduleExpirationNotificationForProduct({
          name: productName,
          expirationDate,
        });
      }
    } catch {}
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

  function resetLookupState() {
    setAwaitingQuantity(false);
    setQuantityInput("");
    setProductData(null);
    setShowExpInput(false);
    setShowDatePicker(false);
    setAwaitingExpirationDate(false);
    setSelectedExpirationDate(new Date());
    setSearchError("");
  }

  function showProductNotFound() {
    setNotFound(true);

    setTimeout(() => {
      setNotFound(false);
      setScanned(false);
    }, 2000);
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function convertToGrams(amount, unit) {
    const normalizedUnit = String(unit || "g").toLowerCase();
    if (normalizedUnit === "kg" || normalizedUnit === "l") return amount * 1000;
    if (normalizedUnit === "cl") return amount * 10;
    return amount;
  }

  function getProductWeight(product) {
    const directWeight = Number(product?.product_quantity);
    if (Number.isFinite(directWeight) && directWeight > 0) {
      return directWeight;
    }

    const quantityText = String(
      product?.quantity || product?.serving_size || "",
    );
    const normalizedQuantity = quantityText.replace(",", ".");
    const totalMatch = normalizedQuantity.match(
      /=\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl)/i,
    );

    if (totalMatch) {
      const totalAmount = Number(totalMatch[1]);
      return Number.isFinite(totalAmount) && totalAmount > 0
        ? convertToGrams(totalAmount, totalMatch[2])
        : 0;
    }

    const multipackMatch = normalizedQuantity.match(
      /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl)/i,
    );

    if (multipackMatch) {
      const count = Number(multipackMatch[1]);
      const unitAmount = Number(multipackMatch[2]);
      if (Number.isFinite(count) && Number.isFinite(unitAmount)) {
        return count * convertToGrams(unitAmount, multipackMatch[3]);
      }
    }

    const match = normalizedQuantity.match(
      /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl)?/i,
    );

    if (!match) return 0;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return 0;

    return convertToGrams(amount, match[2]);
  }

  function mapOpenFoodFactsProduct(product) {
    const n = product?.nutriments || {};
    const weight = getProductWeight(product);

    return {
      name:
        product?.product_name ||
        product?.generic_name ||
        product?.brands ||
        "Neznámy produkt",
      image: product?.image_url || product?.image_front_url || null,
      calories: toNumber(n?.["energy-kcal_100g"]),
      fat: toNumber(n?.fat_100g),
      carbs: toNumber(n?.carbohydrates_100g),
      sugar: toNumber(n?.sugars_100g),
      proteins: toNumber(n?.proteins_100g),
      salt: toNumber(n?.salt_100g),
      fiber: toNumber(n?.fiber_100g),
      quantity: weight,
    };
  }

  function setSelectedProduct(productInfo) {
    let finalProduct = productInfo;

    if (productInfo.quantity && productInfo.quantity > 0) {
      finalProduct = calculateTotals(productInfo, productInfo.quantity);
      setAwaitingQuantity(false);
    } else {
      setAwaitingQuantity(true);
    }

    setProductData(finalProduct);
    setSearchResults([]);
    setSearchError("");
  }

  function buildOpenFoodFactsSearchUrl(query) {
    return `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(
      query,
    )}&search_simple=1&action=process&json=1&page_size=10&page=1&sort_by=unique_scans_n&fields=${encodeURIComponent(
      OFF_SEARCH_FIELDS,
    )}`;
  }

  async function fetchSearchResults(query) {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/searchFoodFacts?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        throw new Error("Server search failed");
      }

      return await response.json();
    } catch {
      const response = await fetch(buildOpenFoodFactsSearchUrl(query), {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Open Food Facts search failed");
      }

      return await response.json();
    }
  }

  async function searchProductsByName() {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchError("Zadajte aspoň 2 znaky.");
      setSearchResults([]);
      return;
    }

    setLoading(true);
    resetLookupState();
    setScanned(false);

    try {
      const data = await fetchSearchResults(query);
      const products = Array.isArray(data.products) ? data.products : [];
      const visibleProducts = products.filter((product) => {
        return Boolean(product?.product_name || product?.brands);
      });

      setSearchResults(visibleProducts);
      setSearchError(
        visibleProducts.length ? "" : "Nenašli sa žiadne produkty.",
      );
    } catch {
      setSearchResults([]);
      setSearchError("Vyhľadávanie sa nepodarilo. Skúste to znova.");
    } finally {
      setLoading(false);
    }
  }

  function selectSearchProduct(product) {
    resetLookupState();
    setSelectedProduct(mapOpenFoodFactsProduct(product));
  }

  function changeLookupMode(nextMode) {
    setLookupMode(nextMode);
    setShowContent(false);
    setScanned(false);
    setSearchError("");
    setNotFound(false);
  }

  async function fetchProductData(barcode) {
    setLoading(true);
    resetLookupState();
    try {
      const response = await fetch(`${API_URL}/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        setSelectedProduct(mapOpenFoodFactsProduct(data.product));
      } else {
        showProductNotFound();
      }
    } catch {
      showProductNotFound();
    } finally {
      setLoading(false);
    }
  }

  async function handleBarCodeScanned({ data }) {
    if (lookupMode !== "scan" || scanned || loading || productData) return;

    setScanned(true);
    fetchProductData(data);
  }

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

  const renderLookupModeSwitch = () => {
    if (productData) return null;

    return (
      <View style={styles.lookupModeSwitch}>
        <Pressable
          onPress={() => changeLookupMode("scan")}
          style={[
            styles.lookupModeTab,
            lookupMode === "scan" && styles.lookupModeTabActive,
          ]}
        >
          <Text
            style={[
              styles.lookupModeText,
              lookupMode === "scan" && styles.lookupModeTextActive,
            ]}
          >
            Skenovať
          </Text>
        </Pressable>
        <Pressable
          onPress={() => changeLookupMode("search")}
          style={[
            styles.lookupModeTab,
            lookupMode === "search" && styles.lookupModeTabActive,
          ]}
        >
          <Text
            style={[
              styles.lookupModeText,
              lookupMode === "search" && styles.lookupModeTextActive,
            ]}
          >
            Hľadať
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderSearchResult = (product, index) => {
    const title = product?.product_name || product?.brands || "Neznámy produkt";
    const brand = product?.brands;
    const quantity = product?.quantity;
    const image = product?.image_url;
    const key = product?.code || `${title}-${index}`;

    return (
      <Pressable
        key={key}
        onPress={() => selectSearchProduct(product)}
        style={styles.productSearchResult}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.productSearchImage} />
        ) : (
          <View style={styles.productSearchImagePlaceholder}>
            <Text style={styles.productSearchImagePlaceholderText}>?</Text>
          </View>
        )}
        <View style={styles.productSearchResultTextBox}>
          <Text style={styles.productSearchResultName} numberOfLines={2}>
            {title}
          </Text>
          {!!brand && (
            <Text style={styles.productSearchResultMeta} numberOfLines={1}>
              {brand}
            </Text>
          )}
          {!!quantity && (
            <Text style={styles.productSearchResultMeta} numberOfLines={1}>
              {quantity}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSearchContent = () => {
    if (lookupMode !== "search" || productData) return null;

    return (
      <KeyboardWrapper scroll={false} style={styles.productSearchContainer}>
        <Text style={styles.manualAddText}>Vyhľadajte produkt podľa názvu.</Text>

        <TextInput
          style={styles.productSearchInput}
          value={searchQuery}
          onChangeText={(value) => {
            setSearchQuery(value);
            setSearchError("");
          }}
          placeholder="napr. horalky"
          returnKeyType="search"
          onSubmitEditing={searchProductsByName}
        />

        <Pressable
          onPress={searchProductsByName}
          style={styles.primaryActionButton}
        >
          <Text style={styles.primaryActionButtonText}>Hľadať</Text>
        </Pressable>

        {!!searchError && (
          <Text style={styles.productSearchError}>{searchError}</Text>
        )}

        {searchResults.length > 0 && (
          <ScrollView style={styles.productSearchResults}>
            {searchResults.map(renderSearchResult)}
          </ScrollView>
        )}
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
        selectedExpirationDate?.toISOString?.(),
      );

      setProductData(null);
      setScanned(false); // 🔁 znovu povolí skenovanie
      setAwaitingExpirationDate(false);
      setShowDatePicker(false);
      setSelectedExpirationDate(new Date());
    } catch (err) {
      Alert.alert("Chyba", "Nepodarilo sa uložiť produkt.");
    }
  };

  const addDirectlyToEaten = async () => {
    if (!productData) return;

    try {
      const email = await AsyncStorage.getItem("userEmail");
      const todayKey = getTodayKey();
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
      const updatedTotals = await updateTotalsForDate(
        todayKey,
        baseTotals,
        (currentTotals) => ({
          calories: currentTotals.calories + (productData.totalCalories || 0),
          proteins: currentTotals.proteins + (productData.totalProteins || 0),
          carbs: currentTotals.carbs + (productData.totalCarbs || 0),
          fat: currentTotals.fat + (productData.totalFat || 0),
          fiber: currentTotals.fiber + (productData.totalFiber || 0),
          sugar: currentTotals.sugar + (productData.totalSugar || 0),
          salt: currentTotals.salt + (productData.totalSalt || 0),
          drunkWater: currentTotals.drunkWater,
        }),
        true,
      );

      if (email) {
        await fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: todayKey,
            totals: updatedTotals,
          }),
        });
      }

      setProductData(null);
      setScanned(false); // 🔁 znovu skenovať
      setAwaitingExpirationDate(false);
      setShowDatePicker(false);
      setSelectedExpirationDate(new Date());
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
        onBarcodeScanned={
          lookupMode === "scan" ? handleBarCodeScanned : undefined
        }
      />

      {renderLookupModeSwitch()}

      <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
        {lookupMode === "search" ? renderSearchContent() : renderContent()}

        {!productData && lookupMode === "scan" && (
          <Pressable
            style={styles.manualAddButton}
            onPress={() => setShowContent((prev) => !prev)}
          >
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
              // maxHeight: 450,
              marginBottom: 100,
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
              !awaitingExpirationDate && (
                <Text>Hmotnosť: {productData.quantity} g</Text>
              )
            )}

            {!awaitingQuantity && !awaitingExpirationDate && (
              <>
                {[
                  {
                    label: "Kalórie",
                    per100: productData.calories,
                    total: productData.totalCalories,
                    unit: "kcal",
                  },
                  {
                    label: "Tuky",
                    per100: productData.fat,
                    total: productData.totalFat,
                    unit: "g",
                  },
                  {
                    label: "Bielkoviny",
                    per100: productData.proteins,
                    total: productData.totalProteins,
                    unit: "g",
                  },
                  {
                    label: "Sacharidy",
                    per100: productData.carbs,
                    total: productData.totalCarbs,
                    unit: "g",
                  },
                  {
                    label: "Cukry",
                    per100: productData.sugar,
                    total: productData.totalSugar,
                    unit: "g",
                  },
                  {
                    label: "Soľ",
                    per100: productData.salt,
                    total: productData.totalSalt,
                    unit: "g",
                  },
                  {
                    label: "Vláknina",
                    per100: productData.fiber,
                    total: productData.totalFiber,
                    unit: "g",
                  },
                ].map((row) => (
                  <Text key={row.label}>
                    {showNutriValues && isPer100g
                      ? `${row.label} (100g): ${row.per100 ?? "N/A"} ${row.unit}`
                      : `${row.label}: ${row.total ?? "N/A"} ${row.unit}`}
                  </Text>
                ))}
              </>
            )}

            {!awaitingQuantity && !awaitingExpirationDate && (
              <Pressable
                style={styles.primaryActionButton}
                onPress={() => {
                  if (expiration) {
                    setSelectedExpirationDate(new Date());
                    setAwaitingExpirationDate(true);
                    // Auto-open date picker for each product (Android + iOS)
                    setShowDatePicker(true);
                  } else {
                    saveToDatabase();
                  }
                }}
              >
                <Text style={styles.primaryActionButtonText}>Špajza</Text>
              </Pressable>
            )}

            {!awaitingQuantity && !awaitingExpirationDate && (
              <Pressable
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: "#2196F3" },
                ]}
                onPress={() => {
                  addDirectlyToEaten();
                }}
              >
                <Text style={styles.primaryActionButtonText}>Zjedené</Text>
              </Pressable>
            )}

            {awaitingExpirationDate && expiration && (
              <View
                style={{
                  width: "100%",
                  marginTop: 12,
                  paddingTop: 10,
                  // borderTopWidth: 1,
                  // borderTopColor: "#eee",
                }}
              >
                <View style={{ backgroundColor: "#eee", borderRadius: 15, paddingTop: 10 }}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      textAlign: "center",
                      fontSize: 17,
                    }}
                  >
                    Vyberte dátum spotreby
                  </Text>

                  {/*<Text style={{ textAlign: "center", marginTop: 6 }}>
                  {selectedExpirationDate
                    ? selectedExpirationDate.toLocaleDateString("sk-SK")
                    : "—"}
                  </Text>*/}

                  {Platform.OS === "android" && (
                    <Pressable
                      style={[styles.primaryActionButton, { marginTop: 10 }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.primaryActionButtonText}>
                        Vybrať dátum
                      </Text>
                    </Pressable>
                  )}

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedExpirationDate || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date()}
                      onChange={(event, date) => {
                        if (Platform.OS === "android") {
                          setShowDatePicker(false);
                        }
                        if (event?.type === "dismissed") return;
                        if (date) setSelectedExpirationDate(date);
                      }}
                    />
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <Pressable
                    style={[
                      styles.primaryActionButton,
                      { flex: 1, backgroundColor: "#9e9e9e" },
                    ]}
                    onPress={() => {
                      setShowExpInput(false);
                      setShowDatePicker(false);
                      setAwaitingExpirationDate(false);
                      setSelectedExpirationDate(new Date());
                    }}
                  >
                    <Text style={styles.primaryActionButtonText}>Zrušiť</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.primaryActionButton, { flex: 1 }]}
                    onPress={async () => {
                      await saveToDatabase();
                      setShowExpInput(false);
                      setShowDatePicker(false);
                      setAwaitingExpirationDate(false);
                      setSelectedExpirationDate(new Date());
                    }}
                  >
                    <Text style={styles.primaryActionButtonText}>Uložiť</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

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
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Keyboard,
  Linking,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import arrow from "./assets/left_arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { scheduleExpirationNotificationForProduct } from "./notifications";
import { updateTotalsForDate } from "./dailyTotalsStorage";
import { useAppTheme } from "./ThemeContext";
import { useAlert } from "./AlertContext";
import {
  buildProductListKey,
  getCategoryEmoji,
} from "./productPresentation";
import {
  buildConsumedProductTotals,
  getProductQuantity,
  normalizeProductQuantity,
  withProductQuantity,
} from "./productQuantity";
import { SERVER_URL } from "./config/serverConfig";

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
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const [showContent, setShowContent] = useState(false);
  const [lookupMode, setLookupMode] = useState("search");
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [loadingMoreSearchResults, setLoadingMoreSearchResults] = useState(false);
  const [productData, setProductData] = useState(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [eatenQuantityInput, setEatenQuantityInput] = useState("");
  const [pendingPantryProduct, setPendingPantryProduct] = useState(null);
  const [awaitingEatenQuantity, setAwaitingEatenQuantity] = useState(false);
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
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Hľadám produkt…");
  const [visibleSearchCount, setVisibleSearchCount] = useState(10);
  const [showNoMoreSearchResults, setShowNoMoreSearchResults] = useState(false);
  const themedInputStyle = {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.text,
  };
  const themedPanelStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  };
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
    category,
    source,
    sourceProductId,
    expirationDate,
    originalQuantity,
    remainingQuantity,
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
          category,
          source,
          sourceProductId,
          expirationDate,
          originalQuantity,
          remainingQuantity,
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
    return withProductQuantity(product, weight, product.originalQuantity || weight);
  }

  function resetLookupState() {
    setAwaitingQuantity(false);
    setQuantityInput("");
    setEatenQuantityInput("");
    setPendingPantryProduct(null);
    setAwaitingEatenQuantity(false);
    setProductData(null);
    setShowExpInput(false);
    setShowDatePicker(false);
    setAwaitingExpirationDate(false);
    setSelectedExpirationDate(new Date());
    setSearchError("");
    setShowNoMoreSearchResults(false);
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
      setEatenQuantityInput(String(Math.round(productInfo.quantity)));
    } else {
      setAwaitingQuantity(true);
    }

    setProductData(normalizeProductQuantity(finalProduct));
    setSearchError("");
  }

  function buildOpenFoodFactsSearchUrl(query, page = 1) {
    return `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(
      query,
    )}&search_simple=1&action=process&json=1&page_size=10&page=${page}&sort_by=unique_scans_n&fields=${encodeURIComponent(
      OFF_SEARCH_FIELDS,
    )}`;
  }

  async function fetchSearchResults(query, page = 1) {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/searchCombined?q=${encodeURIComponent(query)}&page=${page}`,
      );

      if (!response.ok) throw new Error("Server search failed");

      return await response.json();
    } catch (e) {
      // Fallback: query Open Food Facts directly to preserve existing behavior
      try {
        const response = await fetch(buildOpenFoodFactsSearchUrl(query, page), {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("Open Food Facts search failed");

        return await response.json();
      } catch (err) {
        throw err;
      }
    }
  }

  async function searchProductsByName() {
    const query = searchQuery.trim();
    Keyboard.dismiss();

    if (query.length < 2) {
      setSearchError("Zadajte aspoň 2 znaky.");
      setSearchResults([]);
      setHasMoreSearchResults(false);
      return;
    }

    setLoading(true);
  setLoadingMessage("Hľadám produkt…");
    resetLookupState();
    setScanned(false);
    setSearchPage(1);
    setHasMoreSearchResults(false);
  setSearchAttempted(true);
    setVisibleSearchCount(10);

    try {
      const data = await fetchSearchResults(query, 1);
      const products = Array.isArray(data.products) ? data.products : [];
      const visibleProducts = products.filter((product) => Boolean(product?.name));

      setSearchResults(visibleProducts);
      setHasMoreSearchResults(visibleProducts.length > 10);
      setSearchError(visibleProducts.length ? "" : "Nenašli sa žiadne produkty.");
    } catch {
      setSearchResults([]);
      setHasMoreSearchResults(false);
      setSearchError("Vyhľadávanie sa nepodarilo. Skúste to znova.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAI() {
    if (!searchQuery || String(searchQuery).trim().length < 1) return;
    setLoading(true);
    setLoadingMessage("Generujem produkt…");
    try {
      const response = await fetch(`${SERVER_URL}/api/generateProductAI`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchQuery.trim() }),
      });

      const data = await response.json();
      if (data && data.success && data.product) {
        const aiProduct = {
          ...data.product,
          source: "ai",
          category: data.product.category || "",
          image: data.product.image || null,
        };
        showAlert(
          "Upozornenie",
          data.warning ||
            "Nutričné hodnoty vygenerované umelou inteligenciou nemusia byť presné. Skontrolujte ich.",
        );
        setSearchResults((currentResults) => [aiProduct, ...currentResults]);
        setSearchAttempted(true);
        setSearchError("");
        setVisibleSearchCount(10);
        setShowNoMoreSearchResults(false);
        setHasMoreSearchResults(true);
      } else {
        setSearchError(data?.error || "AI generovanie zlyhalo. Skúste znova.");
      }
    } catch (err) {
      setSearchError("AI generovanie zlyhalo. Skúste znova.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreSearchResults() {
    if (loadingMoreSearchResults) return;

    Keyboard.dismiss();
    setLoadingMoreSearchResults(true);

    try {
      const nextVisibleCount = visibleSearchCount + 10;
      if (nextVisibleCount >= searchResults.length) {
        if (searchResults.length <= visibleSearchCount) {
          setShowNoMoreSearchResults(true);
        }
        setVisibleSearchCount(searchResults.length);
        setHasMoreSearchResults(false);
      } else {
        setVisibleSearchCount(nextVisibleCount);
        setHasMoreSearchResults(true);
        setShowNoMoreSearchResults(false);
      }
    } finally {
      setLoadingMoreSearchResults(false);
    }
  }

  function selectSearchProduct(product) {
    resetLookupState();
    // Server returns normalized product shape for combined search
    setSelectedProduct(product);
  }

  function changeLookupMode(nextMode) {
    setLookupMode(nextMode);
    setShowContent(false);
    setScanned(false);
    setSearchError("");
    setNotFound(false);
    setSearchAttempted(false);
    setVisibleSearchCount(10);
    setShowNoMoreSearchResults(false);
  }

  function returnToSearchResults() {
    setProductData(null);
    setAwaitingQuantity(false);
    setQuantityInput("");
    setShowExpInput(false);
    setShowDatePicker(false);
    setAwaitingExpirationDate(false);
    setSelectedExpirationDate(new Date());
  }

  function returnToProductResults() {
    if (lookupMode === "search") {
      returnToSearchResults();
      return;
    }

    resetLookupState();
    setScanned(false);
  }

  function clearSearchState() {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setSearchPage(1);
    setHasMoreSearchResults(false);
    setLoadingMoreSearchResults(false);
    setSearchAttempted(false);
    setVisibleSearchCount(10);
    setShowNoMoreSearchResults(false);
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
      <KeyboardWrapper
        scroll={false}
        style={[styles.manualAddContainer, themedPanelStyle]}
      >
        <Text style={[styles.manualAddText, { color: colors.text }]}>
          Zadajte EAN pre pridanie produktu.
        </Text>

        <TextInput
          style={[styles.manualAddInput, themedInputStyle]}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          placeholderTextColor={colors.placeholder}
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
      <View
        style={[
          styles.lookupModeSwitch,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            elevation: isDark ? 0 : 5,
          },
        ]}
      >
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
              { color: colors.text },
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
              { color: colors.text },
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
    const title = product?.name || "Neznámy produkt";
    const brand = product?.brand || null;
    const quantity = product?.quantity;
    const image = product?.image || null;
    const key = buildProductListKey(product, index, product?.source || "openfoodfacts");

    return (
      <Pressable
        key={key}
        onPress={() => selectSearchProduct(product)}
        style={[
          styles.productSearchResult,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.productSearchImage}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.productSearchImagePlaceholder,
              { backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Text
              style={[
                styles.productSearchResultName,
                { color: colors.mutedText, fontSize: 24 },
              ]}
            >
              {getCategoryEmoji(product)}
            </Text>
          </View>
        )}
        <View style={styles.productSearchResultTextBox}>
          <Text
            style={[styles.productSearchResultName, { color: colors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {!!brand && (
            <Text
              style={[
                styles.productSearchResultMeta,
                { color: colors.mutedText },
              ]}
              numberOfLines={1}
            >
              {brand}
            </Text>
          )}
          {!!quantity && (
            <Text
              style={[
                styles.productSearchResultMeta,
                { color: colors.mutedText },
              ]}
              numberOfLines={1}
            >
              {quantity}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSearchContent = () => {
    if (lookupMode !== "search" || productData) return null;

    const displayedSearchResults = searchResults.slice(0, visibleSearchCount);
    const hasHiddenSearchResults = searchResults.length > visibleSearchCount;

    return (
      <KeyboardWrapper
        scroll={false}
        style={styles.productSearchKeyboardArea}
        contentContainerStyle={styles.productSearchKeyboardContent}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <View style={[styles.productSearchContainer, themedPanelStyle]}>
          <Text style={[styles.manualAddText, { color: colors.text }]}>
            Vyhľadajte produkt podľa názvu.
          </Text>

          <TextInput
            style={[styles.productSearchInput, themedInputStyle]}
            value={searchQuery}
            onChangeText={(value) => {
              setSearchQuery(value);
              setSearchError("");
            }}
            placeholder="napr. horalky"
            placeholderTextColor={colors.placeholder}
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
            <Text style={[styles.productSearchError, { color: colors.danger }]}>
              {searchError}
            </Text>
          )}
          {!loading && searchAttempted && !searchResults.length && searchQuery.trim().length >= 2 && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.text, marginBottom: 6 }}>
                Nenašli ste správnu potravinu? Napíšte nám a pridáme ju.
              </Text>
              <Pressable
                onPress={() => Linking.openURL("mailto:support.bitewise@gmail.com")}
                style={[styles.primaryActionButton, { marginBottom: 8 }]}
              >
                <Text style={styles.primaryActionButtonText}>Napísať support</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateAI}
                style={[styles.primaryActionButton, { backgroundColor: colors.surfaceAlt, marginTop: 6 }]}
              >
                <Text style={[styles.primaryActionButtonText, { color: colors.text }]}>Vygenerovať informácie o potravine pomocou AI</Text>
              </Pressable>
            </View>
          )}
        </View>

        {searchAttempted && (
          <ScrollView
            style={styles.productSearchResults}
            contentContainerStyle={styles.productSearchResultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {displayedSearchResults.map(renderSearchResult)}
            <Pressable
              onPress={loadMoreSearchResults}
              style={styles.productSearchLoadMoreButton}
              disabled={loadingMoreSearchResults}
            >
              <Text style={styles.productSearchLoadMoreText}>
                {loadingMoreSearchResults
                  ? "Načítavam..."
                  : "Zobraziť ďalšie"}
              </Text>
            </Pressable>
            {showNoMoreSearchResults && !hasHiddenSearchResults && (
              <Text style={[styles.productSearchError, { color: colors.mutedText, textAlign: "center" }]}>Ďalšie produkty nie sú.</Text>
            )}
            {showNoMoreSearchResults && hasHiddenSearchResults && (
              <Text style={[styles.productSearchError, { color: colors.mutedText, textAlign: "center" }]}>Ďalšie produkty nie sú.</Text>
            )}
            {searchAttempted && (
              <View style={{ marginTop: 12, paddingHorizontal: 4, alignItems: "center" }}>
                <Text style={{ color: colors.text, marginBottom: 6, textAlign: "center" }}>
                  Nenašli ste správnu potravinu? Napíšte nám a pridáme ju.
                </Text>
                <Pressable
                  onPress={() => Linking.openURL("mailto:support.bitewise@gmail.com")}
                  style={[styles.primaryActionButton, { marginBottom: 8 }]}
                >
                  <Text style={styles.primaryActionButtonText}>Napísať support</Text>
                </Pressable>
                <Pressable
                  onPress={handleGenerateAI}
                  style={[styles.primaryActionButton, { backgroundColor: colors.surfaceAlt, marginTop: 6 }]}
                >
                  <Text style={[styles.primaryActionButtonText, { color: colors.text }]}>Vygenerovať informácie o potravine pomocou AI</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardWrapper>
    );
  };

  const renderSearchBackground = () => (
    <View
      style={[
        styles.productSearchBackground,
        { backgroundColor: colors.dashboardBackground },
      ]}
    >
      <View
        style={[
          styles.productSearchBackgroundBand,
          { backgroundColor: isDark ? colors.surfaceAlt : "#d8f0dc" },
        ]}
      />
    </View>
  );

  const renderCameraLayer = () => {
    if (lookupMode !== "scan") return renderSearchBackground();

    if (!permission) {
      return (
        <View
          style={[
            styles.cameraPermissionContainer,
            { backgroundColor: colors.dashboardBackground },
          ]}
        >
          <Text style={[styles.cameraPermissionText, { color: colors.text }]}>
            Načítavam oprávnenia...
          </Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View
          style={[
            styles.cameraPermissionContainer,
            { backgroundColor: colors.dashboardBackground },
          ]}
        >
          <Text style={[styles.cameraPermissionText, { color: colors.text }]}>
            Táto aplikácia potrebuje prístup ku kamere.
          </Text>
          <Button title="Povoliť kameru" onPress={requestPermission} />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
        />
        {/* QR Код индикатор - šedé zaoblené rohy */}
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 250,
            height: 250,
            marginLeft: -125,
            marginTop: -125,
            pointerEvents: "none",
          }}
        >
          {/* Top-left roh */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 50,
              height: 50,
              borderTopWidth: 6,
              borderLeftWidth: 6,
              borderColor: "#999999",
              borderTopLeftRadius: 15,
            }}
          />
          {/* Top-right roh */}
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 50,
              height: 50,
              borderTopWidth: 6,
              borderRightWidth: 6,
              borderColor: "#999999",
              borderTopRightRadius: 15,
            }}
          />
          {/* Bottom-left roh */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 50,
              height: 50,
              borderBottomWidth: 6,
              borderLeftWidth: 6,
              borderColor: "#999999",
              borderBottomLeftRadius: 15,
            }}
          />
          {/* Bottom-right roh */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 50,
              height: 50,
              borderBottomWidth: 6,
              borderRightWidth: 6,
              borderColor: "#999999",
              borderBottomRightRadius: 15,
            }}
          />
        </View>
      </View>
    );
  };

  const saveToDatabase = async (productOverride = null) => {
    const productToSave = productOverride || pendingPantryProduct || productData;
    if (!productToSave) return;
    const expirationDateToSave =
      awaitingExpirationDate || expiration
        ? selectedExpirationDate?.toISOString?.()
        : null;

    try {
      await handleAddProduct(
        productToSave.name,
        productToSave.totalCalories,
        productToSave.totalProteins,
        productToSave.totalCarbs,
        productToSave.totalFat,
        productToSave.totalFiber,
        productToSave.totalSalt,
        productToSave.totalSugar,
        productToSave.calories,
        productToSave.proteins,
        productToSave.carbs,
        productToSave.fat,
        productToSave.fiber,
        productToSave.salt,
        productToSave.sugar,
        productToSave.image,
        productToSave.category,
        productToSave.source,
        productToSave.sourceProductId || productToSave.productId || productToSave.id,
        expirationDateToSave,
        productToSave.originalQuantity || productToSave.quantity,
        productToSave.remainingQuantity || productToSave.quantity,
      );

      showAlert("Hotovo", "Produkt bol úspešne pridaný do špajze.");

      setProductData(null);
      setScanned(false); // 🔁 znovu povolí skenovanie
      setAwaitingExpirationDate(false);
      setAwaitingEatenQuantity(false);
      setShowDatePicker(false);
      setSelectedExpirationDate(new Date());
      setEatenQuantityInput("");
      setPendingPantryProduct(null);
      clearSearchState();
    } catch (err) {
      showAlert("Chyba", "Nepodarilo sa uložiť produkt.");
    }
  };

  const addDirectlyToEaten = async (overrideGrams = null) => {
    if (!productData) return;

    try {
      const availableGrams = getProductQuantity(productData);
      const requestedGrams = Number(
        overrideGrams !== null ? overrideGrams : eatenQuantityInput,
      );

      if (!Number.isFinite(requestedGrams) || requestedGrams <= 0) {
        showAlert("Chyba", "Zadaj koľko gramov si zjedol/la.");
        return;
      }

      if (requestedGrams > availableGrams) {
        showAlert(
          "Chyba",
          `Produkt má iba ${Math.round(availableGrams)} g. Zadaj menšie množstvo.`,
        );
        return;
      }

      const consumedTotals = buildConsumedProductTotals(productData, requestedGrams);
      const remainingGrams = Math.max(0, availableGrams - requestedGrams);
      const remainingProduct =
        remainingGrams > 0
          ? withProductQuantity(
              productData,
              remainingGrams,
              productData.originalQuantity || availableGrams,
            )
          : null;
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
          calories: currentTotals.calories + consumedTotals.calories,
          proteins: currentTotals.proteins + consumedTotals.proteins,
          carbs: currentTotals.carbs + consumedTotals.carbs,
          fat: currentTotals.fat + consumedTotals.fat,
          fiber: currentTotals.fiber + consumedTotals.fiber,
          sugar: currentTotals.sugar + consumedTotals.sugar,
          salt: currentTotals.salt + consumedTotals.salt,
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

      showAlert("Hotovo", "Produkt bol úspešne zjedený.");

      if (remainingProduct) {
        if (expiration) {
          setPendingPantryProduct(remainingProduct);
          setProductData(remainingProduct);
          setSelectedExpirationDate(new Date());
          setAwaitingExpirationDate(true);
          setShowDatePicker(true);
        } else {
          await saveToDatabase(remainingProduct);
        }
        return;
      }

      setProductData(null);
      setScanned(false); // 🔁 znovu skenovať
      setAwaitingExpirationDate(false);
      setAwaitingEatenQuantity(false);
      setShowDatePicker(false);
      setSelectedExpirationDate(new Date());
      setEatenQuantityInput("");
      setPendingPantryProduct(null);
      clearSearchState();
    } catch (err) {
      showAlert("Chyba", "Nepodarilo sa pridať produkt.");
    }
  };

  const maxEatenAmount = productData ? Math.round(getProductQuantity(productData)) : 0;
  const parsedEatenAmount = Number(eatenQuantityInput);
  const isEatenAmountValid =
    Number.isFinite(parsedEatenAmount) &&
    parsedEatenAmount > 0 &&
    parsedEatenAmount <= maxEatenAmount;
  const showEatenAmountError =
    awaitingEatenQuantity && eatenQuantityInput.length > 0 && !isEatenAmountValid;
  const eatenAmountError =
    parsedEatenAmount > maxEatenAmount
      ? `Maximum je ${maxEatenAmount} g.`
      : "Zadaj platnú gramáž.";

  return (
    <View style={{ flex: 1, backgroundColor: colors.dashboardBackground }}>
      {/* 🔄 SPINNER – VŽDY NAD VŠETKÝM */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.generatingModalContainer, themedPanelStyle]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.generatingModalTitle, { color: colors.text }]}>
              {loadingMessage}
            </Text>
          </View>
        </View>
      </Modal>
      {/* ❌ PRODUKT NENÁJDENÝ */}
      <Modal visible={notFound} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.generatingModalContainer, themedPanelStyle]}>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: colors.danger }}
            >
              Produkt nenájdený
            </Text>
          </View>
        </View>
      </Modal>
      {renderCameraLayer()}

      {renderLookupModeSwitch()}
      {renderSearchContent()}

      <Pressable
        style={({ pressed }) =>
          pressed
            ? [styles.screenBackButton, styles.screenBackButtonPressed]
            : styles.screenBackButton
        }
        onPress={() => navigation.goBack()}
      >
        <Image source={arrow} style={styles.screenBackButtonImage} />
      </Pressable>

      <View
        style={{
          position: "absolute",
          top: productData ? 108 : undefined,
          bottom: productData ? 78 : 20,
          alignSelf: "center",
          width: "100%",
          justifyContent: productData ? "center" : "flex-end",
        }}
      >
        {lookupMode === "scan" && renderContent()}

        {!productData && lookupMode === "scan" && (
          <Pressable
            style={({ pressed }) => [
              styles.manualAddButton,
              {
                backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setShowContent((prev) => !prev)}
          >
            <Text style={[styles.manualAddButtonText, { color: colors.text }]}>
              Zadať manuálne
            </Text>
          </Pressable>
        )}

        {productData && (
          <View
            style={{
              marginBottom: 0,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 2,
              borderRadius: 20,
              padding: awaitingEatenQuantity ? 16 : 14,
              width: "92%",
              maxWidth: 360,
              minHeight: awaitingEatenQuantity ? 260 : undefined,
              elevation: 8,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              alignSelf: "center",
              alignItems: "center",
              gap: awaitingEatenQuantity ? 12 : 8,
            }}
          >
            {lookupMode === "search" && searchResults.length > 0 && (
              <Pressable
                style={[
                  styles.backToSearchResultsButton,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={returnToProductResults}
              >
                <Text style={styles.backToSearchResultsButtonText}>
                  Späť na výsledky
                </Text>
              </Pressable>
            )}

            {lookupMode === "scan" && (
              <Pressable
                style={[
                  styles.backToSearchResultsButton,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={returnToProductResults}
              >
                <Text style={styles.backToSearchResultsButtonText}>
                  Späť na skenovanie
                </Text>
              </Pressable>
            )}

            {!awaitingEatenQuantity && !awaitingExpirationDate && (
              <>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 8,
                    letterSpacing: 0.3,
                  }}
                >
                  {productData.name}
                </Text>

                {productData.image && (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      marginBottom: 8,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceAlt,
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: productData.image }}
                      style={{ width: 92, height: 92 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </>
            )}

            {awaitingQuantity ? (
              <KeyboardWrapper
                scroll={false}
                style={{ marginTop: 10, flex: 0, width: "100%" }}
                contentContainerStyle={{ width: "100%" }}
              >
                <Text style={{ color: colors.text }}>
                  Zadajte hmotnosť produktu (g) :
                </Text>

                <TextInput
                  style={[styles.manualAddInput, themedInputStyle]}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="50"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />

                <Pressable
                  style={styles.primaryActionButton}
                  onPress={async () => {
                    const weight = Number(quantityInput);

                    if (isNaN(weight) || weight <= 0) {
                      showAlert(
                        "Chyba",
                        "Zadajte platnú hmotnosť (číslo väčšie ako 0)!",
                      );
                      return;
                    }

                    setProductData(calculateTotals(productData, weight));
                    setEatenQuantityInput(String(Math.round(weight)));
                    setAwaitingQuantity(false);
                  }}
                >
                  <Text style={styles.primaryActionButtonText}>
                    Uložiť hmotnosť
                  </Text>
                </Pressable>
              </KeyboardWrapper>
            ) : (
              !awaitingExpirationDate && !awaitingEatenQuantity && (
                <View
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    marginBottom: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                    Hmotnosť
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {productData.quantity} g
                  </Text>
                </View>
              )
            )}

            {!awaitingQuantity && !awaitingExpirationDate && !awaitingEatenQuantity && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: colors.primarySoft,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    textAlign: "center",
                    fontSize: 15,
                    marginBottom: 12,
                  }}
                >
                  {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
                </Text>
                {[
                  {
                    label: "Kalórie",
                    per100: productData.calories,
                    total: productData.totalCalories,
                    unit: "kcal",
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
                    label: "Tuky",
                    per100: productData.fat,
                    total: productData.totalFat,
                    unit: "g",
                  },
                  {
                    label: "Vláknina",
                    per100: productData.fiber,
                    total: productData.totalFiber,
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
                ].map((row, index) => (
                  <View
                    key={row.label}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: index < 6 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.mutedText,
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {row.label}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        {showNutriValues && isPer100g
                          ? row.per100 ?? "N/A"
                          : row.total ?? "N/A"}
                        {" "}
                        <Text style={{ fontSize: 13, fontWeight: "500" }}>
                          {row.unit}
                        </Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!awaitingQuantity && !awaitingExpirationDate && awaitingEatenQuantity && (
              <KeyboardWrapper
                scroll={false}
                style={{ width: "100%", marginBottom: 12, flex: 0 }}
                contentContainerStyle={{ width: "100%" }}
              >
                <View
                  style={{
                    width: "100%",
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 14,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.mutedText,
                      fontSize: 13,
                      fontWeight: "800",
                      marginBottom: 8,
                    }}
                  >
                    Koľko z produktu si zjedol/la?
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TextInput
                      style={[styles.manualAddInput, themedInputStyle, { flex: 1, margin: 0 }]}
                      value={eatenQuantityInput}
                      onChangeText={(value) => setEatenQuantityInput(value.replace(/[^0-9]/g, ""))}
                      placeholder="napr. 174"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                    />
                    <Text style={{ color: colors.mutedText, fontWeight: "700" }}>g</Text>
                  </View>
                  {showEatenAmountError && (
                    <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>
                      {eatenAmountError}
                    </Text>
                  )}
                </View>
              </KeyboardWrapper>
            )}

            {!awaitingQuantity && !awaitingExpirationDate && awaitingEatenQuantity && (
              <View style={{ width: "100%", gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: pressed
                          ? "hsla(208, 100%, 55%, 0.85)"
                          : "#2196F3",
                        elevation: pressed ? 2 : 4,
                        opacity: !isEatenAmountValid ? 0.6 : 1,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        minHeight: 48,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    disabled={!isEatenAmountValid}
                    onPress={() => addDirectlyToEaten()}
                  >
                    <Text style={[styles.primaryActionButtonText, { fontSize: 16 }]}>
                      Potvrdiť
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: pressed
                          ? "hsla(129, 56%, 38%, 1)"
                          : colors.primary,
                        elevation: pressed ? 2 : 4,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        minHeight: 48,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => {
                      if (!Number.isFinite(maxEatenAmount) || maxEatenAmount <= 0) return;
                      setEatenQuantityInput(String(maxEatenAmount));
                      addDirectlyToEaten(maxEatenAmount);
                    }}
                  >
                    <Text
                      style={[styles.primaryActionButtonText, { fontSize: 16 }]}
                      numberOfLines={1}
                    >
                      Celý produkt
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed ? "#8b8b8b" : "#9e9e9e",
                      elevation: pressed ? 2 : 4,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => setAwaitingEatenQuantity(false)}
                >
                  <Text style={[styles.primaryActionButtonText, { fontSize: 16 }]}>Zrušiť</Text>
                </Pressable>
              </View>
            )}

            {!awaitingQuantity && !awaitingExpirationDate && !awaitingEatenQuantity && (
              <View style={{ width: "100%", flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: pressed
                        ? "hsla(129, 56%, 38%, 1)"
                        : colors.primary,
                      elevation: pressed ? 2 : 4,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => {
                    setPendingPantryProduct(null);
                    setAwaitingEatenQuantity(false);
                    if (expiration) {
                      setSelectedExpirationDate(new Date());
                      setAwaitingExpirationDate(true);
                      setShowDatePicker(true);
                    } else {
                      saveToDatabase();
                    }
                  }}
                >
                  <Text style={[styles.primaryActionButtonText, { fontSize: 16 }]}>Špajza</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: pressed
                        ? "hsla(208, 100%, 55%, 0.85)"
                        : "#2196F3",
                      elevation: pressed ? 2 : 4,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => {
                    setEatenQuantityInput(
                      String(Math.round(getProductQuantity(productData))),
                    );
                    setAwaitingEatenQuantity(true);
                  }}
                >
                  <Text style={[styles.primaryActionButtonText, { fontSize: 16 }]}>Zjedené</Text>
                </Pressable>
              </View>
            )}

            {awaitingExpirationDate && (expiration || pendingPantryProduct) && (
              <View
                style={{
                  width: "100%",
                  marginTop: 8,
                  backgroundColor: colors.primarySoft,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    textAlign: "center",
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                >
                  📅 Dátum spotreby
                </Text>

                {selectedExpirationDate && (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                      Vybrané:
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 18,
                        fontWeight: "700",
                        marginTop: 4,
                      }}
                    >
                      {selectedExpirationDate.toLocaleDateString("sk-SK")}
                    </Text>
                  </View>
                )}

                {Platform.OS === "android" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryActionButton,
                      {
                        marginBottom: 10,
                        backgroundColor: pressed
                          ? "hsla(129, 56%, 38%, 1)"
                          : colors.primary,
                      },
                    ]}
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
                    display={Platform.OS === "ios" ? "compact" : "default"}
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

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryActionButton,
                    {
                      marginTop: 8,
                      marginBottom: 10,
                      backgroundColor: pressed ? "#757575" : colors.surfaceAlt,
                    },
                  ]}
                  onPress={async () => {
                    setSelectedExpirationDate(null);
                    setAwaitingExpirationDate(false);
                    setShowDatePicker(false);
                    setShowExpInput(false);
                    await saveToDatabase();
                  }}
                >
                  <Text style={[styles.primaryActionButtonText, { color: colors.text }]}>Bez expirácie</Text>
                </Pressable>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryActionButton,
                      {
                        flex: 1,
                        backgroundColor: pressed ? "#8b8b8b" : "#9e9e9e",
                      },
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
                    style={({ pressed }) => [
                      styles.primaryActionButton,
                      {
                        flex: 1,
                        backgroundColor: pressed
                          ? "hsla(129, 56%, 38%, 1)"
                          : colors.primary,
                      },
                    ]}
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
          </View>
        )}
      </View>
    </View>
  );
}

import React, { useEffect, useState, useCallback, useMemo } from "react";
  import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    Modal,
    ImageBackground,
    ActivityIndicator,
  } from "react-native";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { useFocusEffect } from "@react-navigation/native";
  import styles from "../../styles";

  const SERVER_URL = "https://app.bitewise.it.com";

  export default function PantryTab({ removeMealBox, removeProduct, addEatenValues }) {
    const [email, setEmail] = useState(null);
    const [mealBoxes, setMealBoxes] = useState([]);
    const [activeBox, setActiveBox] = useState(null);
    const [loading, setLoading] = useState(true);

    const groupedMealBoxes = useMemo(() => {
      const map = new Map();
      for (const box of mealBoxes) {
        const normalizedName =
          typeof box?.name === "string" ? box.name.trim().toLowerCase() : null;
        const key = normalizedName
          ? `name:${normalizedName}`
          : String(box?.productId ?? box?.id ?? "unknown");
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          existing.instances.push(box);
        } else {
          map.set(key, { key, box, count: 1, instances: [box] });
        }
      }
      return Array.from(map.values());
    }, [mealBoxes]);

    // --- Load email from AsyncStorage ---
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const storedEmail = await AsyncStorage.getItem("userEmail");
          if (mounted && storedEmail) setEmail(storedEmail);
        } catch (err) {
          console.error("❌ Error loading email:", err);
        }
      })();
      return () => (mounted = false);
    }, []);

    // --- Fetch mealBoxes with AsyncStorage first, server fallback ---
    const fetchMealBoxes = useCallback(async () => {
      if (!email) return;

      setLoading(true);
      let boxes = null;

      try {
        // 1️⃣ Try AsyncStorage
        const storedMealBox = await AsyncStorage.getItem("products");
        if (storedMealBox) {
          boxes = JSON.parse(storedMealBox);
          console.log("✅ Loaded mealBoxes from AsyncStorage:", boxes.length);
        }

        // 2️⃣ Fallback server if AsyncStorage empty
        if (!boxes || boxes.length === 0) {
          console.log("⚠️ AsyncStorage empty, fetching from server...");
          const res = await fetch(`${SERVER_URL}/api/getProducts?email=${encodeURIComponent(email)}`);
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const data = await res.json();
          boxes = data.products || [];
          console.log("✅ Loaded mealBoxes from server:", boxes.length);

          // Save to AsyncStorage
          await AsyncStorage.setItem("products", JSON.stringify(boxes));
          console.log("✅ Saved server mealBoxes to AsyncStorage");
        }

        setMealBoxes(boxes);
      } catch (err) {
        console.error("❌ Error fetching mealBoxes:", err);
        setMealBoxes([]);
      } finally {
        setLoading(false);
      }
    }, [email]);

    // --- Auto fetch on tab focus ---
    useFocusEffect(
      useCallback(() => {
        if (email) fetchMealBoxes();
      }, [email, fetchMealBoxes])
    );

    const openWindow = (group) => setActiveBox(group);
    const closeWindow = () => setActiveBox(null);

  const handleRemoveMealBox = async (id, productId, box) => {
    try {
      // 1️⃣ zavolaj pôvodnú funkciu, ktorá maže na serveri/databáze
      await removeMealBox(id, productId, box);

      // 2️⃣ načítaj aktuálne produkty z AsyncStorage
      const stored = await AsyncStorage.getItem("products");
      let allProducts = stored ? JSON.parse(stored) : [];

      // 3️⃣ odstráň iba 1 kus (ak je tam viac rovnakých)
      const idx = allProducts.findIndex(
        (p) =>
          (productId && p.productId === productId) ||
          (!productId && box?.name && p.name === box.name),
      );
      if (idx !== -1) allProducts.splice(idx, 1);

      // 4️⃣ ulož späť do AsyncStorage
      await AsyncStorage.setItem("products", JSON.stringify(allProducts));

      // 5️⃣ aktualizuj stav komponentu ihneď
      setMealBoxes(allProducts);


      console.log("✅ Product removed locally and AsyncStorage updated");
    } catch (err) {
      console.error("❌ Error removing mealBox:", err);
    }
  };

    // --- MealBoxItem ---
    const MealBoxItem = ({ group }) => (
      <Pressable onPress={() => openWindow(group)} style={styles.box}>
        <ImageBackground
          source={{ uri: group.box.image }}
          style={{ flex: 1, justifyContent: "space-between" }}
        >
          <Text style={styles.mealBoxText}>{group.box.name}</Text>
          {group.count > 1 && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                x{group.count}
              </Text>
            </View>
          )}
          <View>
            <Pressable
              onPress={() => {
                const instance = group.instances[0];
                if (!instance) return;
                handleRemoveMealBox(instance.id, instance.productId, instance);
              }}
            >
              <Text style={styles.eatenButton}>Zjedené ✅</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Pressable>
    );

    // --- Modal window ---
    const MealBoxWindow = ({ productName, count, email, close }) => {
      const [product, setProduct] = useState(null);
      const [error, setError] = useState(null);
      const [loadingWindow, setLoadingWindow] = useState(true);
      const [isPer100g, setIsPer100g] = useState();

      useEffect(() => {
        (async () => {
          try {
            const stored = await AsyncStorage.getItem("isPer100g");
            if (stored !== null) setIsPer100g(JSON.parse(stored));
          } catch (err) {
            console.error("❌ Error loading isPer100g:", err);
          }
        })();
      }, []);

      useEffect(() => {
        if (!email || !productName) {
          setProduct(null);
          setLoadingWindow(false);
          return;
        }

        let mounted = true;

        const fetchProduct = async () => {
          setLoadingWindow(true);
          setError(null);

          try {
            // 1️⃣ AsyncStorage first
            const storedMealBox = await AsyncStorage.getItem("products");
            if (storedMealBox) {
              const found = JSON.parse(storedMealBox).find((p) => p.name === productName);
              if (found && mounted) {
                setProduct(found);
                setLoadingWindow(false);
                return;
              }
            }

            // 2️⃣ Server fallback
            const url = `${SERVER_URL}/api/getProductByName?email=${encodeURIComponent(
              email,
            )}&name=${encodeURIComponent(productName)}`;
            const res = await fetch(url);
            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new Error(body.error || `Server returned ${res.status}`);
            }

            if (mounted) setProduct(body.product || null);

            // Save to AsyncStorage if found
            if (body.product) {
              const stored = await AsyncStorage.getItem("products");
              const allProducts = stored ? JSON.parse(stored) : [];
              const exists = allProducts.some((p) => p.name === body.product.name);
              const next = exists ? allProducts : [...allProducts, body.product];
              await AsyncStorage.setItem("products", JSON.stringify(next));
              console.log("✅ Saved product to AsyncStorage");
            }
          } catch (err) {
            console.error("❌ Error fetching product:", err);
            if (mounted) setError(err.message);
          } finally {
            if (mounted) setLoadingWindow(false);
          }
        };

        fetchProduct();
        return () => {
          mounted = false;
        };
      }, [email, productName]);

      if (loadingWindow) return <ActivityIndicator size="large" color="#0000ff" />;
      if (error) return <Text style={{ color: "red" }}>{error}</Text>;
      if (!product) return <Text>Produkt nebol nájdený</Text>;

      return (
        <View style={styles.overlay}>
          <View style={styles.window}>
            {loadingWindow ? (
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
                  <React.Fragment key={nutrient.label}>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>{nutrient.label}</Text>
                      <Text style={styles.nutritionValue}>
                        {nutrient.value ?? "N/A"} {nutrient.label === "Kalórie" ? "kcal" : "g"}
                      </Text>
                    </View>
                    {nutrient.label === "Soľ" && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionLabel}>Počet kusov</Text>
                        <Text style={styles.nutritionValue}>{count ?? 1}</Text>
                      </View>
                    )}
                  </React.Fragment>
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
        <Pressable onPress={() => email && fetchMealBoxes(email)}>
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
          <MealBoxWindow
            productName={activeBox?.box?.name}
            count={activeBox?.count}
            email={email}
            close={closeWindow}
          />
        </Modal>

        <ScrollView style={styles.mealContainer}>
          <View style={styles.row}>
            {groupedMealBoxes.map((group) => (
              <MealBoxItem key={group.key} group={group} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
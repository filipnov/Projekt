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

export default function PantryTab({
  removeMealBox,
  removeProduct,
  addEatenValues,
}) {
  const [email, setEmail] = useState(null);
  const [mealBoxes, setMealBoxes] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [loading, setLoading] = useState(true);

  const getExpirationMs = useCallback((p) => {
    const raw = p?.expirationDate ?? p?.expiration ?? p?.expiryDate;
    if (!raw) return Number.POSITIVE_INFINITY;
    const d = new Date(raw);
    const ms = d.getTime();
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  }, []);

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
    // Ensure deterministic behavior when multiple instances exist:
    // sort by earliest expiration first, then by id/productId/name.
    const values = Array.from(map.values());
    for (const g of values) {
      g.instances.sort((a, b) => {
        const diff = getExpirationMs(a) - getExpirationMs(b);
        if (diff !== 0) return diff;
        const aid = a?.id ?? a?.productId ?? a?.name ?? "";
        const bid = b?.id ?? b?.productId ?? b?.name ?? "";
        return String(aid).localeCompare(String(bid));
      });
      // Keep the representative box aligned with the earliest expiring instance.
      g.box = g.instances[0] ?? g.box;
    }
    return values;
  }, [mealBoxes, getExpirationMs]);

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
  const loadMealBoxes = useCallback(
    async ({ forceServer = false } = {}) => {
      if (!email) return;

      setLoading(true);
      let boxes = null;

      try {
        // 1️⃣ Try AsyncStorage (unless forceServer)
        if (!forceServer) {
          const storedMealBox = await AsyncStorage.getItem("products");
          if (storedMealBox) {
            boxes = JSON.parse(storedMealBox);
            console.log("✅ Loaded mealBoxes from AsyncStorage:", boxes.length);
          }
        }

        // 2️⃣ Fallback server if AsyncStorage empty
        if (!boxes || boxes.length === 0) {
          console.log("⚠️ Fetching mealBoxes from server...");
          const res = await fetch(
            `${SERVER_URL}/api/getProducts?email=${encodeURIComponent(email)}`,
          );
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
    },
    [email],
  );

  // --- Auto fetch on tab focus ---
  useFocusEffect(
    useCallback(() => {
      if (email) loadMealBoxes();
    }, [email, loadMealBoxes]),
  );

  const openWindow = (group) => setActiveKey(group?.key ?? null);
  const closeWindow = () => setActiveKey(null);

  const formatExpiration = (value) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("sk-SK");
  };

  const activeGroup = useMemo(() => {
    if (!activeKey) return null;
    return groupedMealBoxes.find((g) => g.key === activeKey) ?? null;
  }, [groupedMealBoxes, activeKey]);

  // If the active product disappears (eaten/removed), close the modal.
  useEffect(() => {
    if (activeKey && !activeGroup) setActiveKey(null);
  }, [activeKey, activeGroup]);

  const handleRemoveMealBox = async (id, productId, box) => {
    let shouldForceRefresh = false;
    try {
      // 1️⃣ zavolaj pôvodnú funkciu, ktorá maže na serveri/databáze
      try {
        await removeMealBox(id, productId, box);
      } catch (err) {
        // Ak už produkt v DB nie je, stále ho odstránime lokálne a zosyncneme zo servera.
        shouldForceRefresh = true;
        console.warn("⚠️ removeMealBox failed, forcing refresh:", err);
      }

      // 2️⃣ načítaj aktuálne produkty z AsyncStorage
      const stored = await AsyncStorage.getItem("products");
      let allProducts = stored ? JSON.parse(stored) : [];

      // 3️⃣ odstráň iba 1 kus (ak je tam viac rovnakých)
      const boxExp = box?.expirationDate ?? box?.expiration ?? box?.expiryDate;
      const idx = allProducts.findIndex((p) => {
        if (id && p?.id === id) return true;
        if (productId && p?.productId === productId) {
          // If we know expiration for the instance, prefer removing that exact one.
          if (boxExp) {
            const pExp = p?.expirationDate ?? p?.expiration ?? p?.expiryDate;
            return String(pExp ?? "") === String(boxExp);
          }
          return true;
        }
        if (!productId && box?.name && p?.name === box.name) {
          if (boxExp) {
            const pExp = p?.expirationDate ?? p?.expiration ?? p?.expiryDate;
            return String(pExp ?? "") === String(boxExp);
          }
          return true;
        }
        return false;
      });
      if (idx !== -1) allProducts.splice(idx, 1);

      // 4️⃣ ulož späť do AsyncStorage
      await AsyncStorage.setItem("products", JSON.stringify(allProducts));

      // 5️⃣ aktualizuj stav komponentu ihneď
      setMealBoxes(allProducts);

      if (shouldForceRefresh) {
        await loadMealBoxes({ forceServer: true });
      }

      console.log("✅ Product removed locally and AsyncStorage updated");
    } catch (err) {
      console.error("❌ Error removing mealBox:", err);
    }
  };

  // --- MealBoxItem ---
  const MealBoxItem = ({ group }) => (
    <Pressable onPress={() => openWindow(group)} style={styles.pantryBox}>
      <ImageBackground
        source={{ uri: group.box.image }}
        style={styles.pantryImageBackground}
      >
        <Text style={styles.pantryMealBoxText}>{group.box.name}</Text>
        {group.count > 1 && (
          <View style={styles.pantryCountBadge}>
            <Text style={styles.pantryCountBadgeText}>{group.count} ks</Text>
          </View>
        )}
        {/* <View>
          <Pressable
            onPress={() => {
              const instance = group.instances[0];
              if (!instance) return;
              handleRemoveMealBox(instance.id, instance.productId, instance);
            }}
          >
            <Text style={styles.pantryEatenButton}>Zjedené ✅</Text>
          </Pressable>
        </View>*/}
      </ImageBackground>
    </Pressable>
  );

  // --- Modal window ---
  const MealBoxWindow = ({ productName, count, email, close, instances }) => {
    const [product, setProduct] = useState(null);
    const [loadingWindow, setLoadingWindow] = useState(true);
    const [isPer100g, setIsPer100g] = useState();
    const [expiration, setExpiration] = useState();

    useEffect(() => {
      (async () => {
        try {
          const storedValue = await AsyncStorage.getItem("expiration");
          if (storedValue !== null) {
            setExpiration(JSON.parse(storedValue));
          }
        } catch (err) {
          console.error("Chyba pri načítaní nastavení:", err);
        }
      })();
    }, []);

    const expirationLabel = useMemo(() => {
      const candidates = (instances ?? [])
        .map((p) => p?.expirationDate ?? p?.expiration ?? p?.expiryDate)
        .filter(Boolean)
        .map((v) => {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? null : d;
        })
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

      const earliest = candidates[0];
      return formatExpiration(earliest);
    }, [instances]);

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

    // Product data already exists in pantry items (`instances`).
    // Using it avoids fragile DB lookup by exact name and prevents 404 after eating.
    useEffect(() => {
      setLoadingWindow(true);
      const p = instances?.[0] ?? null;
      setProduct(p);
      setLoadingWindow(false);
    }, [instances]);

    //  if (loadingWindow) return <ActivityIndicator size="large" color="#0000ff" />;

    return (
      <View style={styles.pantryOverlay}>
        <View style={styles.pantryWindow}>
          {loadingWindow ? (
            <ActivityIndicator size="large" />
          ) : !product ? (
            <>
              <Text style={styles.pantryTitle}>Product not found</Text>
              <Pressable onPress={close} style={styles.pantryCloseButton}>
                <Text style={styles.pantryCloseButtonText}>Close</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.pantryWindowTitle}>{product.name}</Text>
              <Image
                source={{ uri: product.image }}
                style={styles.pantryModalImage}
                resizeMode="cover"
              />

              <View style={styles.pantryNutritionRow}>
                <Text style={styles.pantryNutritionHeaderText}>
                  {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
                </Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                  backgroundColor: "white",
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Kalórie: {""}</Text>
                <Text>
                  {isPer100g ? product.calories : product.totalCalories} kcal
                </Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Bielkoviny: </Text>
                <Text>
                  {isPer100g ? product.proteins : product.totalProteins} g
                </Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Sacharidy:</Text>
                <Text>{isPer100g ? product.carbs : product.totalCarbs} g</Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Tuky:</Text>
                <Text>{isPer100g ? product.fat : product.totalFat} g</Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Vlákniny:</Text>
                <Text>{isPer100g ? product.fiber : product.totalFiber} g</Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Cukry:</Text>
                <Text>{isPer100g ? product.sugar : product.totalSugar} g</Text>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 7,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Soľ:</Text>
                <Text>{isPer100g ? product.salt : product.totalSalt} g</Text>
              </View>

              <View
                style={{
                  justifyContent: "space-evenly",
                  alignSelf: "center",
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 5,
                  borderRadius: 6,
                  //marginBottom: 4,
                  //backgroundColor: "white",
                  width: "60%",
                  backgroundColor: "hsla(0, 100%, 50%, 0.2)",
                  marginTop: 10,
                }}
              >
                <Text style={styles.pantryNutritionLabel}>Počet v špajzi:</Text>
                <Text>{count ?? 1}</Text>
              </View>

              {expiration && (
                <View
                  style={{
                    justifyContent: "space-evenly",
                    alignSelf: "center",
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 5,
                    borderRadius: 6,
                    //marginBottom: 4,
                    //backgroundColor: "white",
                    width: "60%",
                    backgroundColor: "hsla(227, 100%, 50%, 0.40)",
                    marginTop: 10,
                  }}
                >
                  <Text style={styles.pantryNutritionLabel}>Exspirácia:</Text>
                  <Text>{expirationLabel ?? "—"}</Text>
                </View>
              )}

              <Pressable
                onPress={() => {
                  const instance = instances?.[0];
                  if (!instance) return;
                  // Close immediately so UI doesn't look like it "switches" to the next date.
                  close?.();
                  (async () => {
                    await handleRemoveMealBox(
                      instance.id,
                      instance.productId,
                      instance,
                    );
                  })();
                }}
                style={styles.pantryEatenBtn}
              >
                <Text style={styles.pantryCloseButtonText}>Zjedené ✅</Text>
              </Pressable>

              <Pressable onPress={close} style={styles.pantryCloseButton}>
                <Text style={styles.pantryCloseButtonText}>Zatvoriť</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  // ---------------------------
  return (
    <View style={styles.pantryRoot}>
      <Modal
        visible={!!activeKey}
        animationType="slide"
        transparent={true}
        onRequestClose={closeWindow}
      >
        <MealBoxWindow
          productName={activeGroup?.box?.name}
          count={activeGroup?.count}
          email={email}
          instances={activeGroup?.instances ?? []}
          close={closeWindow}
        />
      </Modal>

      <ScrollView style={styles.pantryMealContainer}>
        <View style={styles.pantryRow}>
          {groupedMealBoxes.map((group) => (
            <MealBoxItem key={group.key} group={group} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

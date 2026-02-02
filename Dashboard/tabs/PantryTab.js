import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
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
}) {
  const [email, setEmail] = useState(null);
  const [mealBoxes, setMealBoxes] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [customName, setCustomName] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);

  const getExpirationMs = useCallback((p) => {
    const time = new Date(p?.expirationDate).getTime();
    return Number.isNaN(time) ? Infinity : time;
  }, []);

  const scannedMealBoxes = useMemo(
    () => mealBoxes.filter((p) => !p?.isCustom),
    [mealBoxes],
  );

  const customMealBoxes = useMemo(
    () => mealBoxes.filter((p) => p?.isCustom),
    [mealBoxes],
  );

  const groupedMealBoxes = useMemo(() => {
    const map = new Map();

    for (const box of scannedMealBoxes) {
      const name = typeof box?.name === "string" ? box.name.trim() : "";
      const normalized = name ? name.toLowerCase() : null;
      const idKey = box?.productId ?? box?.id ?? "unknown";
      const key = normalized ? `name:${normalized}` : String(idKey);

      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.instances.push(box);
      } else {
        map.set(key, { key, box, count: 1, instances: [box] });
      }
    }

    const values = Array.from(map.values());

    for (const group of values) {
      group.instances.sort((a, b) => getExpirationMs(a) - getExpirationMs(b));
      group.box = group.instances[0] ?? group.box;
    }

    return values;
  }, [scannedMealBoxes, getExpirationMs]);

  // --- Load email from AsyncStorage ---
  useEffect(() => {
    AsyncStorage.getItem("userEmail").then((storedEmail) => {
      if (storedEmail) setEmail(storedEmail);
    });
  }, []);

  // --- Fetch mealBoxes with AsyncStorage first, server fallback ---
  const loadMealBoxes = useCallback(
    async ({ forceServer = false } = {}) => {
      if (!email) return;

      let boxes = [];

      if (!forceServer) {
        const storedMealBox = await AsyncStorage.getItem("products");
        if (storedMealBox) boxes = JSON.parse(storedMealBox);
      }

      if (!boxes.length) {
        const res = await fetch(
          `${SERVER_URL}/api/getProducts?email=${encodeURIComponent(email)}`,
        );
        const data = await res.json();
        boxes = data.products || [];
        await AsyncStorage.setItem("products", JSON.stringify(boxes));
      }

      setMealBoxes(boxes);
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
      await removeMealBox(id, productId, box);
    } catch {
      shouldForceRefresh = true;
    }

    const stored = await AsyncStorage.getItem("products");
    const allProducts = stored ? JSON.parse(stored) : [];
    const boxExp = box?.expirationDate;

    const idx = allProducts.findIndex((p) => {
      if (id && p?.id === id) return true;
      if (productId && p?.productId === productId) {
        return boxExp
          ? String(p?.expirationDate ?? "") === String(boxExp)
          : true;
      }
      if (!productId && box?.name && p?.name === box.name) {
        return boxExp
          ? String(p?.expirationDate ?? "") === String(boxExp)
          : true;
      }
      return false;
    });

    if (idx !== -1) allProducts.splice(idx, 1);
    await AsyncStorage.setItem("products", JSON.stringify(allProducts));
    setMealBoxes(allProducts);

    if (shouldForceRefresh) await loadMealBoxes({ forceServer: true });
  };

  const addCustomMealBox = async () => {
    const name = customName.trim();
    if (!name || !email) return;

    setSavingCustom(true);
    const res = await fetch(`${SERVER_URL}/api/addCustomProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    const data = await res.json();
    const nextProducts = data.products || [];

    await AsyncStorage.setItem("products", JSON.stringify(nextProducts));
    setMealBoxes(nextProducts);
    setCustomName("");
    setSavingCustom(false);
  };

  const removeCustomMealBox = async (productId) => {
    if (!email || !productId) return;

    await fetch(`${SERVER_URL}/api/removeProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, productId }),
    });

    const stored = await AsyncStorage.getItem("products");
    const allProducts = stored ? JSON.parse(stored) : [];
    const filtered = allProducts.filter((p) => p.productId !== productId);
    await AsyncStorage.setItem("products", JSON.stringify(filtered));
    setMealBoxes(filtered);
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
  const MealBoxWindow = ({ count, close, instances }) => {
    const [product, setProduct] = useState(null);
    const [loadingWindow, setLoadingWindow] = useState(true);
    const [isPer100g, setIsPer100g] = useState();
    const [expiration, setExpiration] = useState();

    useEffect(() => {
      AsyncStorage.getItem("expiration").then((storedValue) => {
        if (storedValue !== null) setExpiration(JSON.parse(storedValue));
      });
    }, []);

    const expirationLabel = useMemo(() => {
      const candidates = (instances ?? [])
        .map((p) => p?.expirationDate)
        .filter(Boolean)
        .map((v) => {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? null : d;
        })
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

      return formatExpiration(candidates[0]);
    }, [instances]);

    useEffect(() => {
      AsyncStorage.getItem("isPer100g").then((stored) => {
        if (stored !== null) setIsPer100g(JSON.parse(stored));
      });
    }, []);

    // Product data already exists in pantry items (`instances`).
    // Using it avoids fragile DB lookup by exact name and prevents 404 after eating.
    useEffect(() => {
      setLoadingWindow(true);
      setProduct(instances?.[0] ?? null);
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

              {expiration && (
                <View
                  style={[
                    styles.pantryInfoRowBase,
                    styles.pantryInfoRowExpiration,
                  ]}
                >
                  <Text style={styles.pantryNutritionLabel}>Exspirácia:</Text>
                  <Text>{expirationLabel ?? "—"}</Text>
                </View>
              )}

              <View
                style={[styles.pantryInfoRowBase, styles.pantryInfoRowCount]}
              >
                <Text style={styles.pantryNutritionLabel}>Počet v špajzi:</Text>
                <Text>{count ?? 1}</Text>
              </View>

              <View style={styles.pantryNutritionCard}>
                <View style={styles.pantryNutritionRow}>
                  <Text style={styles.pantryNutritionHeaderText}>
                    {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pantryNutritionValueRowBase,
                    styles.pantryNutritionValueRowGap3,
                  ]}
                >
                  <Text style={styles.pantryNutritionLabel}>Kalórie: {""}</Text>
                  <Text>
                    {isPer100g ? product.calories : product.totalCalories} kcal
                  </Text>
                </View>
                <View
                  style={[
                    styles.pantryNutritionValueRowBase,
                    styles.pantryNutritionValueRowGap1,
                  ]}
                >
                  <Text style={styles.pantryNutritionLabel}>Bielkoviny: </Text>
                  <Text>
                    {isPer100g ? product.proteins : product.totalProteins} g
                  </Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Sacharidy:</Text>
                  <Text>
                    {isPer100g ? product.carbs : product.totalCarbs} g
                  </Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Tuky:</Text>
                  <Text>{isPer100g ? product.fat : product.totalFat} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Vlákniny:</Text>
                  <Text>
                    {isPer100g ? product.fiber : product.totalFiber} g
                  </Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Cukry:</Text>
                  <Text>
                    {isPer100g ? product.sugar : product.totalSugar} g
                  </Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Soľ:</Text>
                  <Text>{isPer100g ? product.salt : product.totalSalt} g</Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  const instance = instances?.[0];
                  if (!instance) return;
                  close?.();
                  handleRemoveMealBox(
                    instance.id,
                    instance.productId,
                    instance,
                  );
                }}
                style={styles.pantryEatenBtn}
              >
                <Text style={styles.pantryCloseButtonText}>Zjedené</Text>
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
          count={activeGroup?.count}
          instances={activeGroup?.instances ?? []}
          close={closeWindow}
        />
      </Modal>

      <ScrollView style={styles.pantryMealContainer}>
        <Text style={styles.pantrySectionTitle}>Naskenované položky</Text>
        {groupedMealBoxes.length === 0 && (
          <Text style={styles.pantryEmptyMessage}>Nemáš naskenované položky.</Text>
        )}
        <View style={styles.pantryRow}>
          {groupedMealBoxes.map((group) => (
            <MealBoxItem key={group.key} group={group} />
          ))}
        </View>

        <Text style={styles.pantrySectionTitle}>Vlastné položky</Text>
        <View style={styles.pantryCustomInputRow}>
          <TextInput
            placeholder="Názov potraviny"
            value={customName}
            onChangeText={setCustomName}
            style={styles.pantryCustomInput}
          />
          <Pressable
            onPress={addCustomMealBox}
            style={styles.pantryCustomButton}
            disabled={savingCustom}
          >
            <Text style={styles.pantryCustomButtonText}>
              {savingCustom ? "..." : "Pridať"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.pantryCustomList}>
          {customMealBoxes.length === 0 ? (
            <Text style={styles.pantryItemText}>
              Zatiaľ nemáš vlastné položky.
            </Text>
          ) : (
            customMealBoxes.map((item) => (
              <View key={item.productId} style={styles.pantryCustomItemRow}>
                <Text style={styles.pantryCustomItemText}>{item.name}</Text>
                <Pressable
                  onPress={() => removeCustomMealBox(item.productId)}
                  style={styles.pantryCustomRemove}
                >
                  <Text style={styles.pantryCustomRemoveText}>Zmazať</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
  // removeProduct,
  // addEatenValues,
}) {
  const [email, setEmail] = useState(null);
  const [mealBoxes, setMealBoxes] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [customName, setCustomName] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  //const [loading, setLoading] = useState(true);

  const getExpirationMs = useCallback((p) => {
    const expiration = p?.expirationDate; // Dátum spotreby z produktu
    if (!expiration) {
      return Infinity; //Žiaden dátum = nekonečno
    } else {
      const miliseconds = new Date(expiration).getTime(); //Dátum na ms

      if (Number.isNaN(miliseconds)) {
        return Infinity; //Nesprávny dátum = nekonečno
      } else {
        return miliseconds;
      }
    }
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
    const map = new Map(); // Map = "slovník" (kľúč -> hodnota)

    // Prejdeme všetky produkty/krabičky v špajzi a budeme ich grupovať.
    for (const box of scannedMealBoxes) {
      let normalizedName = null;

      // Overení či box.name je text
      if (box && typeof box.name === "string") {
        const trimmed = box.name.trim(); // Odstráni medzery na začiatku a konci
        if (trimmed.length > 0) {
          normalizedName = trimmed.toLowerCase(); // Zmení na malé písmená
        }
      }

      let key = "unknown"; //Defaultný kľúč skupiny

      // Groupovanie podľa názvu
      if (normalizedName) {
        key = `name:${normalizedName}`;
      } else {
        // Ak nie je názov = grupovanie podľa ID.
        let idForKey = "unknown"; // Default, ak nie je id ani productId

        // ProductId má prednosť
        if (box && box.productId != null) {
          idForKey = box.productId;
        } else if (box && box.id != null) {
          idForKey = box.id;
        }

        key = String(idForKey); // Prevedenie na text
      }

      // Kontrola, či už skupina existuje
      const existing = map.get(key);

      //Pridanie, ak existuje
      if (existing) {
        existing.count += 1; // Zvýšenie počtu kusov
        existing.instances.push(box); // Uloženie konkrétneho kusu
      } else {
        // Ak neexistuje, vytvorenie novej skupiny
        map.set(key, { key, box, count: 1, instances: [box] });
      }
    }

    // Map -> Array, aby sa to dalo jednoducho renderovať v Reacte.
    const values = Array.from(map.values());

    // Zoradenie kusov v každej skupine podľa exspirácie
    for (const group of values) {
      group.instances.sort((a, b) => {
        const aMs = getExpirationMs(a); // Dátum exspirácie na ms pre produkt a
        const bMs = getExpirationMs(b); // Dátum exspirácie na ms pre produkt b
        const diff = aMs - bMs;

        if (diff !== 0) {
          return diff; // Rovnaké = poradie rozhodne exspirácia.
        } else {
          return 0; //Nie sú rovnaké = poradie je jedno
        }
      });

      const firstInstance = group.instances[0] ?? null; // Prvý kus = najbližšia exspirácia
      if (firstInstance) {
        group.box = firstInstance;
      }
    }

    return values; // Pole skupín pre UI
  }, [scannedMealBoxes, getExpirationMs]);

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

      //setLoading(true);
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
        //setLoading(false);
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
      const boxExp = box?.expirationDate;
      const idx = allProducts.findIndex((p) => {
        if (id && p?.id === id) return true;
        if (productId && p?.productId === productId) {
          // If we know expiration for the instance, prefer removing that exact one.
          if (boxExp) {
            const pExp = p?.expirationDate;
            return String(pExp ?? "") === String(boxExp);
          }
          return true;
        }
        if (!productId && box?.name && p?.name === box.name) {
          if (boxExp) {
            const pExp = p?.expirationDate;
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

  const addCustomMealBox = async () => {
    const name = customName.trim();
    if (!name || !email) return;

    setSavingCustom(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/addCustomProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) throw new Error("Failed to add custom product");

      const data = await res.json();
      const nextProducts = data.products || [];

      await AsyncStorage.setItem("products", JSON.stringify(nextProducts));
      setMealBoxes(nextProducts);
      setCustomName("");
    } catch (err) {
      console.error("❌ Error adding custom product:", err);
    } finally {
      setSavingCustom(false);
    }
  };

  const removeCustomMealBox = async (productId) => {
    if (!email || !productId) return;
    try {
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
    } catch (err) {
      console.error("❌ Error removing custom product:", err);
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
        .map((p) => p?.expirationDate)
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
          productName={activeGroup?.box?.name}
          count={activeGroup?.count}
          email={email}
          instances={activeGroup?.instances ?? []}
          close={closeWindow}
        />
      </Modal>

      <ScrollView style={styles.pantryMealContainer}>
        <Text style={styles.pantrySectionTitle}>Naskenované položky</Text>
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

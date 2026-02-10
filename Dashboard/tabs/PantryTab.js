// Hlavné React importy: hooky pre stav, memoizáciu a side‑efekty.
import React, { useEffect, useState, useCallback, useMemo } from "react";
// Základné RN komponenty pre UI, vstup, obrázky, modal a loader.
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
// Perzistentné úložisko na zariadení (cache produktov, preferencie).
import AsyncStorage from "@react-native-async-storage/async-storage";
// Hook, ktorý spúšťa logiku pri fokusnutí tabu.
import { useFocusEffect } from "@react-navigation/native";
// Centrálne štýly aplikácie.
import styles from "../../styles";
import { rescheduleExpirationNotifications } from "../../notifications";

// Základná URL servera – všetky API volania idú cez tento hostname.
const SERVER_URL = "https://app.bitewise.it.com";

// Základná štruktúra denných súhrnov
// (používa sa ako bezpečný „štart“ keď ešte nemáme dáta)
const DEFAULT_TOTALS = {
  calories: 0,
  proteins: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  salt: 0,
  drunkWater: 0,
};

// Pomocná funkcia na dnešný dátum (YYYY-MM-DD) v lokálnom čase
// Tento formát vyžaduje aj backend API
const getTodayKey = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function PantryTab() {
  // Email prihláseného používateľa (načítaný z AsyncStorage).
  const [email, setEmail] = useState(null);
  // Lokálny zoznam všetkých produktov v špajzi.
  const [mealBoxes, setMealBoxes] = useState([]);
  // Kľúč aktívnej skupiny (otvorená modálka).
  const [activeKey, setActiveKey] = useState(null);
  // Text z inputu pre vlastnú položku.
  const [customName, setCustomName] = useState("");
  // Flag, či práve prebieha ukladanie vlastnej položky.
  const [savingCustom, setSavingCustom] = useState(false);

  // Načíta lokálne uložené súhrny (ak existujú)
  // Ak lokálne súbory chýbajú alebo sú poškodené, použijeme DEFAULT_TOTALS
  const loadStoredTotals = useCallback(async () => {
    const storedTotalsRaw = await AsyncStorage.getItem("eatenTotals");
    if (!storedTotalsRaw) return { ...DEFAULT_TOTALS };
    try {
      return { ...DEFAULT_TOTALS, ...JSON.parse(storedTotalsRaw) };
    } catch (e) {
      console.error("Error parsing stored eatenTotals:", e);
      return { ...DEFAULT_TOTALS };
    }
  }, []);

  // Pridá skonzumované hodnoty do denného súhrnu
  // (kalórie, makrá, vláknina, cukor, soľ)
  const addEatenValues = useCallback(
    async (box) => {
      if (!box) return;

      const todayKey = getTodayKey();
      const storedTotalsDate = await AsyncStorage.getItem("eatenTotalsDate");
      let totals = await loadStoredTotals();

      if (storedTotalsDate !== todayKey) {
        totals = { ...DEFAULT_TOTALS };
        await AsyncStorage.setItem("eatenTotalsDate", todayKey);
      }

      const updatedTotals = {
        ...totals,
        calories: totals.calories + (box.totalCalories || 0),
        proteins: totals.proteins + (box.totalProteins || 0),
        carbs: totals.carbs + (box.totalCarbs || 0),
        fat: totals.fat + (box.totalFat || 0),
        fiber: totals.fiber + (box.totalFiber || 0),
        sugar: totals.sugar + (box.totalSugar || 0),
        salt: totals.salt + (box.totalSalt || 0),
      };

      // Uložíme denné súhrny lokálne
      await AsyncStorage.setItem("eatenTotals", JSON.stringify(updatedTotals));
      await AsyncStorage.setItem("eatenTotalsDate", todayKey);

      // Bez emailu nevieme synchronizovať so serverom
      if (!email) return;

      try {
        await fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: todayKey,
            totals: updatedTotals,
          }),
        });
      } catch (err) {
        console.error("Error pushing consumed totals:", err);
      }
    },
    [email, loadStoredTotals],
  );

  // Vráti čas exspirácie v ms; ak je dátum neplatný, hodnota je Infinity.
  const getExpirationMs = useCallback((product) => {
    // Vytiahneme uloženú hodnotu exspirácie (môže byť string/Date/undefined).
    const expirationValue = product?.expirationDate;
    // Prevedieme na Date objekt (invalid dátum dá NaN time).
    const expirationDate = new Date(expirationValue);
    // Date.getTime() vracia čas v ms od epochy (NaN pri invalid).
    const expirationMs = expirationDate.getTime();

    // Ak je NaN alebo 0, vrátime Infinity, aby sa zoradilo až na koniec.
    return expirationMs || Infinity;
  }, []);

  // Rozdelí všetky položky na naskenované a vlastné.
  const scannedMealBoxes = useMemo(() => {
    // Všetky produkty v jednej premennej kvôli čitateľnosti.
    const allProducts = mealBoxes;
    // Naskenované položky: tie, ktoré nemajú isCustom = true.
    const scannedOnly = allProducts.filter((product) => {
      return !product?.isCustom;
    });

    // Memoizovaná návratová hodnota.
    return scannedOnly;
  }, [mealBoxes]);

  const customMealBoxes = useMemo(() => {
    // Všetky produkty v jednej premennej kvôli čitateľnosti.
    const allProducts = mealBoxes;
    // Vlastné položky: tie, ktoré majú isCustom = true.
    const customOnly = allProducts.filter((product) => {
      return product?.isCustom;
    });

    // Memoizovaná návratová hodnota.
    return customOnly;
  }, [mealBoxes]);

  const groupedMealBoxes = useMemo(() => {
    // Map pre efektívne zhlukovanie podľa názvu alebo ID.
    const groupedMap = new Map();

    for (const box of scannedMealBoxes) {
      // Normalizácia názvu (trim + lowercase) pre stabilné zoskupenie.
      const nameValue = typeof box?.name === "string" ? box.name.trim() : "";
      const normalizedName = nameValue ? nameValue.toLowerCase() : null;
      // Fallback ID ak názov nie je dostupný.
      const idKey = box?.productId ?? box?.id ?? "unknown";
      // Kľúč skupiny – preferujeme názov (ľudskejšie), inak ID.
      const groupKey = normalizedName ? `name:${normalizedName}` : String(idKey);

      // Skúsime nájsť už existujúcu skupinu.
      const existingGroup = groupedMap.get(groupKey);

      if (existingGroup) {
        // Ak existuje, zvýšime počet a pridáme ďalšiu inštanciu.
        existingGroup.count += 1;
        existingGroup.instances.push(box);
      } else {
        // Inak vytvoríme novú skupinu so základnými dátami.
        groupedMap.set(groupKey, {
          key: groupKey,
          box,
          count: 1,
          instances: [box],
        });
      }
    }

    // Prevod Map -> Array pre jednoduché renderovanie.
    const groupedValues = Array.from(groupedMap.values());

    for (const group of groupedValues) {
      // Zoradenie inštancií podľa najbližšej exspirácie.
      const sortedInstances = group.instances.sort((a, b) => {
        return getExpirationMs(a) - getExpirationMs(b);
      });

      // Najskôr sa zobrazí produkt s najbližšou exspiráciou.
      group.instances = sortedInstances;
      group.box = sortedInstances[0] ?? group.box;
    }

    // Memoizovaná návratová hodnota.
    return groupedValues;
  }, [scannedMealBoxes, getExpirationMs]);

  // --- Load email from AsyncStorage ---
  useEffect(() => {
    // Po prvom renderi sa načíta email z cache.
    AsyncStorage.getItem("userEmail").then((storedEmail) => {
      // Ak existuje, uložíme ho do state.
      if (storedEmail) setEmail(storedEmail);
    });
  }, []);

  // --- Fetch mealBoxes from AsyncStorage only ---
  const loadMealBoxes = useCallback(async () => {
    // Bez emailu nevieme filtrovať produkty pre používateľa.
    if (!email) return;

    // Skúsime načítať cache (rýchlejšie a offline-friendly).
    const storedMealBox = await AsyncStorage.getItem("products");
    const boxes = storedMealBox ? JSON.parse(storedMealBox) : [];

    // Aktualizujeme stav v UI.
    setMealBoxes(boxes);
  }, [email]);

  // --- Auto fetch on tab focus ---
  useFocusEffect(
    useCallback(() => {
      // Kontrola, či máme email (používateľ je prihlásený).
      const hasEmail = Boolean(email);

      if (hasEmail) {
        // Pri focusnutí tabu načítame produkty.
        loadMealBoxes();
      }
    }, [email, loadMealBoxes]),
  );

  const openWindow = (group) => {
    // Otvorenie modálu – nastavíme kľúč aktívnej skupiny.
    const nextKey = group?.key ?? null;
    setActiveKey(nextKey);
  };

  const closeWindow = () => {
    // Zatvorenie modálu.
    setActiveKey(null);
  };

  const formatExpiration = (value) => {
    // Ak nemáme hodnotu, nič nezobrazíme.
    if (!value) return null;

    // Normalizujeme na Date.
    const dateValue = value instanceof Date ? value : new Date(value);
    // Overíme validitu dátumu.
    const isInvalid = Number.isNaN(dateValue.getTime());

    // Pri invalidnom dátume nič nezobrazíme.
    if (isInvalid) return null;

    // Lokalizované SK formátovanie.
    return dateValue.toLocaleDateString("sk-SK");
  };

  const activeGroup = useMemo(() => {
    // Bez aktívneho kľúča nie je čo hľadať.
    if (!activeKey) return null;

    // Nájdeme skupinu zodpovedajúcu aktívnemu kľúču.
    const foundGroup = groupedMealBoxes.find((group) => {
      return group.key === activeKey;
    });

    // Ak sa nenašla, vrátime null.
    return foundGroup ?? null;
  }, [groupedMealBoxes, activeKey]);

  // If the active product disappears (eaten/removed), close the modal.
  useEffect(() => {
    // Ak je modál otvorený, ale skupina zmizla (produkt odstránený), zatvoríme.
    const hasActiveKey = Boolean(activeKey);
    const activeGroupMissing = !activeGroup;

    if (hasActiveKey && activeGroupMissing) {
      setActiveKey(null);
    }
  }, [activeKey, activeGroup]);

  // Odstráni produkt z lokálneho zoznamu a pripočíta jeho hodnoty do súhrnov
  // 1) vymaže zo servera
  // 2) upraví lokálnu cache
  // 3) pripočíta výživové hodnoty do denného súhrnu
  const handleRemoveMealBox = async (id, productId, box) => {
    try {
      if (email && productId) {
        await fetch(`${SERVER_URL}/api/removeProduct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, productId }),
        });
      }
    } catch {
      console.error("Error removing product from server:", err);
    }

    await addEatenValues(box);

    // Najprv upravíme lokálnu cache.
    const stored = await AsyncStorage.getItem("products");
    const allProducts = stored ? JSON.parse(stored) : [];
    const boxExpiration = box?.expirationDate;

    const removeIndex = allProducts.findIndex((item) => {
      // Najpresnejší match je podľa interného `id`.
      const matchesId = id && item?.id === id;

      // Ak je k dispozícii `productId`, použijeme ho.
      const matchesProductId = productId && item?.productId === productId;
      // Pri `productId` ešte porovnáme exspiráciu (aby sme odstránili správnu inštanciu).
      const matchesExpirationForProductId = boxExpiration
        ? String(item?.expirationDate ?? "") === String(boxExpiration)
        : true;

      // Ak `productId` nie je k dispozícii, skúšame podľa názvu.
      const matchesNameOnly = !productId && box?.name && item?.name === box.name;
      // Aj tu kontrolujeme exspiráciu pre presnosť.
      const matchesExpirationForName = boxExpiration
        ? String(item?.expirationDate ?? "") === String(boxExpiration)
        : true;

      if (matchesId) return true;

      if (matchesProductId) {
        return matchesExpirationForProductId;
      }

      if (matchesNameOnly) {
        return matchesExpirationForName;
      }

      return false;
    });

    if (removeIndex !== -1) {
      // Odstránime prvý nájdený výskyt.
      allProducts.splice(removeIndex, 1);
    }

    // Uložíme novú cache a prepíšeme state.
    await AsyncStorage.setItem("products", JSON.stringify(allProducts));
    setMealBoxes(allProducts);
    await rescheduleExpirationNotifications(allProducts);

  };

  const addCustomMealBox = async () => {
    // Očistíme text (trim), aby nevznikali prázdne názvy.
    const trimmedName = customName.trim();
    const hasName = Boolean(trimmedName);
    const hasEmail = Boolean(email);

    // Bez názvu alebo emailu nič nerobíme.
    if (!hasName || !hasEmail) return;

    // Spustíme loading state pre tlačidlo.
    setSavingCustom(true);

    // Pripravíme telo requestu.
    const requestBody = { email, name: trimmedName };
    // Volanie API na pridanie vlastnej položky.
    const response = await fetch(`${SERVER_URL}/api/addCustomProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // Parse JSON odpovede.
    const data = await response.json();
    // Server vráti celý zoznam produktov.
    const nextProducts = data.products || [];

    // Cache update.
    await AsyncStorage.setItem("products", JSON.stringify(nextProducts));

    // UI update + reset inputu.
    setMealBoxes(nextProducts);
    await rescheduleExpirationNotifications(nextProducts);
    setCustomName("");
    setSavingCustom(false);
  };

  const removeCustomMealBox = async (productId) => {
    // Validácia vstupov.
    const hasEmail = Boolean(email);
    const hasProductId = Boolean(productId);

    // Bez týchto hodnôt nič nerobíme.
    if (!hasEmail || !hasProductId) return;

    // Pripravíme payload.
    const requestBody = { email, productId };

    // Serverový delete.
    await fetch(`${SERVER_URL}/api/removeProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // Lokálna cache aktualizácia (odfiltrujeme produkt).
    const stored = await AsyncStorage.getItem("products");
    const allProducts = stored ? JSON.parse(stored) : [];
    const filteredProducts = allProducts.filter((item) => {
      return item.productId !== productId;
    });

    // Uloženie a aktualizácia state.
    await AsyncStorage.setItem("products", JSON.stringify(filteredProducts));
    setMealBoxes(filteredProducts);
    await rescheduleExpirationNotifications(filteredProducts);
  };

  // --- MealBoxItem ---
  const MealBoxItem = ({ group }) => {
    // Zástupný produkt skupiny (najbližšia exspirácia).
    const box = group.box;
    // URL obrázka.
    const boxImage = box?.image;
    // Názov produktu.
    const boxName = box?.name;
    // Počet rovnakých položiek.
    const count = group.count;
    // Zobraziť badge iba ak je viac kusov.
    const hasMoreThanOne = count > 1;

    return (
      // Celý box je klikateľný – otvorí modál.
      <Pressable onPress={() => openWindow(group)} style={styles.pantryBox}>
        <ImageBackground
          source={{ uri: boxImage }}
          style={styles.pantryImageBackground}
        >
          {/* Názov položky */}
          <Text style={styles.pantryMealBoxText}>{boxName}</Text>
          {hasMoreThanOne && (
            <View style={styles.pantryCountBadge}>
              {/* Zobrazenie počtu kusov v skupine */}
              <Text style={styles.pantryCountBadgeText}>{count} ks</Text>
            </View>
          )}
        </ImageBackground>
      </Pressable>
    );
  };

  // --- Modal window ---
  const MealBoxWindow = ({ count, close, instances }) => {
    // Vybraný produkt (detail) – vezmeme z inštancií.
    const [product, setProduct] = useState(null);
    // Lokálny loading pre modál.
    const [loadingWindow, setLoadingWindow] = useState(true);
    // Nastavenie zobrazenia na 100 g alebo na celý produkt.
    const [isPer100g, setIsPer100g] = useState();
    // Nastavenie, či sa má zobrazovať exspirácia.
    const [expiration, setExpiration] = useState();

    useEffect(() => {
      // Preferencia zobrazovania exspirácie uložená v AsyncStorage.
      AsyncStorage.getItem("expiration").then((storedValue) => {
        const hasStoredValue = storedValue !== null;

        if (hasStoredValue) {
          // JSON -> boolean.
          const parsedValue = JSON.parse(storedValue);
          setExpiration(parsedValue);
        }
      });
    }, []);

    const expirationLabel = useMemo(() => {
      // Zozbierame všetky exspirácie zo všetkých inštancií.
      const expirationDates = (instances ?? []).map((item) => {
        return item?.expirationDate;
      });

      // Prevod na Date objekty.
      const parsedDates = expirationDates.map((value) => {
        return new Date(value);
      });

      // Filtrujeme iba validné dátumy.
      const validDates = parsedDates.filter((date) => {
        return !Number.isNaN(date.getTime());
      });

      // Najskorší dátum exspirácie z listu.
      const sortedDates = validDates.sort((a, b) => {
        return a.getTime() - b.getTime();
      });

      const earliestDate = sortedDates[0];

      // Finálny formát pre UI.
      return formatExpiration(earliestDate);
    }, [instances]);

    useEffect(() => {
      // Načítanie preferencie „na 100 g“.
      AsyncStorage.getItem("isPer100g").then((stored) => {
        const hasStoredValue = stored !== null;

        if (hasStoredValue) {
          // JSON -> boolean.
          const parsedValue = JSON.parse(stored);
          setIsPer100g(parsedValue);
        }
      });
    }, []);

    // Product data already exists in pantry items (`instances`).
    // Using it avoids fragile DB lookup by exact name and prevents 404 after eating.
    useEffect(() => {
      // Pri každej zmene inštancií obnovíme detail.
      setLoadingWindow(true);

      // Zoberieme prvú inštanciu ako reprezentatívny produkt.
      const nextProduct = instances?.[0] ?? null;
      setProduct(nextProduct);

      // Už máme dáta, loading vypneme.
      setLoadingWindow(false);
    }, [instances]);

    const handleEatPress = () => {
      // Odstráni prvú dostupnú inštanciu produktu.
      const instance = instances?.[0];

      if (!instance) return;

      // Najprv zavrieme modál, potom odstránime položku.
      close?.();
      handleRemoveMealBox(instance.id, instance.productId, instance);
    };

    // Voľba výživových hodnôt podľa preferencie.
    const caloriesValue = isPer100g ? product?.calories : product?.totalCalories;
    const proteinsValue = isPer100g ? product?.proteins : product?.totalProteins;
    const carbsValue = isPer100g ? product?.carbs : product?.totalCarbs;
    const fatValue = isPer100g ? product?.fat : product?.totalFat;
    const fiberValue = isPer100g ? product?.fiber : product?.totalFiber;
    const sugarValue = isPer100g ? product?.sugar : product?.totalSugar;
    const saltValue = isPer100g ? product?.salt : product?.totalSalt;

    //  if (loadingWindow) return <ActivityIndicator size="large" color="#0000ff" />;

    return (
      // Polopriesvitné pozadie modálu.
      <View style={styles.pantryOverlay}>
        {/* Samotné okno modálu */}
        <View style={styles.pantryWindow}>
          {loadingWindow ? (
            // Loading stav.
            <ActivityIndicator size="large" />
          ) : !product ? (
            // Keď produkt neexistuje (napr. vymazaný).
            <>
              <Text style={styles.pantryTitle}>Product not found</Text>
              <Pressable onPress={close} style={styles.pantryCloseButton}>
                <Text style={styles.pantryCloseButtonText}>Close</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Názov produktu */}
              <Text style={styles.pantryWindowTitle}>{product.name}</Text>
              <Image
                source={{ uri: product.image }}
                style={styles.pantryModalImage}
                resizeMode="cover"
              />

              {expiration && (
                // Blok exspirácie sa zobrazí iba ak je povolený.
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
                {/* Počet kusov v špajzi */}
                <Text style={styles.pantryNutritionLabel}>Počet v špajzi:</Text>
                <Text>{count ?? 1}</Text>
              </View>

              {/* Karta s výživovými hodnotami */}
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
                  <Text>{caloriesValue} kcal</Text>
                </View>
                <View
                  style={[
                    styles.pantryNutritionValueRowBase,
                    styles.pantryNutritionValueRowGap1,
                  ]}
                >
                  <Text style={styles.pantryNutritionLabel}>Bielkoviny: </Text>
                  <Text>{proteinsValue} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Sacharidy:</Text>
                  <Text>{carbsValue} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Tuky:</Text>
                  <Text>{fatValue} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Vlákniny:</Text>
                  <Text>{fiberValue} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Cukry:</Text>
                  <Text>{sugarValue} g</Text>
                </View>
                <View style={styles.pantryNutritionValueRowBase}>
                  <Text style={styles.pantryNutritionLabel}>Soľ:</Text>
                  <Text>{saltValue} g</Text>
                </View>
              </View>
              {/* Akcia: zjesť (odstrániť) */}
              <Pressable onPress={handleEatPress} style={styles.pantryEatenBtn}>
                <Text style={styles.pantryCloseButtonText}>Zjedené</Text>
              </Pressable>

              {/* Zavrieť modál bez akcie */}
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
  // Logické premenne pre UI (čitateľnosť a menej inline logiky v JSX).
  const isModalVisible = Boolean(activeKey);
  const activeInstances = activeGroup?.instances ?? [];
  const hasScannedItems = groupedMealBoxes.length > 0;
  const hasCustomItems = customMealBoxes.length > 0;
  const addButtonLabel = savingCustom ? "..." : "Pridať";

  return (
    // Root kontajner celej obrazovky.
    <View>
      {/* Modál s detailom produktu */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeWindow}
      >
        <MealBoxWindow
          count={activeGroup?.count}
          instances={activeInstances}
          close={closeWindow}
        />
      </Modal>

      {/* Hlavný scrollovateľný obsah */}
      <ScrollView style={styles.pantryMealContainer}>
        {/* Sekcia naskenovaných položiek */}
        <Text style={styles.pantrySectionTitle}>Naskenované položky</Text>
        {!hasScannedItems && (
          <Text style={styles.pantryEmptyMessage}>Nemáš naskenované položky.</Text>
        )}
        <View style={styles.pantryRow}>
          {groupedMealBoxes.map((group) => (
            <MealBoxItem key={group.key} group={group} />
          ))}
        </View>

        {/* Sekcia vlastných položiek */}
        <Text style={styles.pantrySectionTitle}>Vlastné položky</Text>
        {/* Riadok s inputom a tlačidlom pridania */}
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
            <Text style={styles.pantryCustomButtonText}>{addButtonLabel}</Text>
          </Pressable>
        </View>

        {/* Zoznam vlastných položiek */}
        <View style={styles.pantryCustomList}>
          {!hasCustomItems ? (
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

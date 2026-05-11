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
import { removeExpirationNotificationForProduct } from "../../notifications";
import { updateTotalsForDate } from "../../dailyTotalsStorage";
import { useAppTheme } from "../../ThemeContext";
import { API_BASE_URL } from "../../apiConfig";

// Základná URL servera – všetky API volania idú cez tento hostname.
const SERVER_URL = API_BASE_URL;

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

const buildExpirationKey = (product) => {
  const rawExpiration = product?.expirationDate;
  if (!rawExpiration) return null;

  const expirationDate = new Date(rawExpiration);
  if (Number.isNaN(expirationDate.getTime())) return null;

  const localDate = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate(),
  );
  const dateKey = getTodayKey(localDate);
  const nameValue = typeof product?.name === "string" ? product.name.trim() : "";
  const normalizedName = nameValue ? nameValue.toLowerCase() : "potravina";

  return `${normalizedName}::${dateKey}`;
};

export default function PantryTab() {
  const { colors } = useAppTheme();
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

  // Pridá skonzumované hodnoty do denného súhrnu
  // (kalórie, makrá, vláknina, cukor, soľ)
  const addEatenValues = useCallback(
    async (box) => {
      if (!box) return;

      const todayKey = getTodayKey();
      const updatedTotals = await updateTotalsForDate(
        todayKey,
        DEFAULT_TOTALS,
        (totals) => ({
          ...totals,
          calories: totals.calories + (box.totalCalories || 0),
          proteins: totals.proteins + (box.totalProteins || 0),
          carbs: totals.carbs + (box.totalCarbs || 0),
          fat: totals.fat + (box.totalFat || 0),
          fiber: totals.fiber + (box.totalFiber || 0),
          sugar: totals.sugar + (box.totalSugar || 0),
          salt: totals.salt + (box.totalSalt || 0),
        }),
        true,
      );

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
    [email],
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
    // Načítanie z cache 
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
    const removedKey = buildExpirationKey(box);
    const hasSameExpiration = removedKey
      ? allProducts.some((item) => buildExpirationKey(item) === removedKey)
      : false;

    if (!hasSameExpiration) {
      await removeExpirationNotificationForProduct(box);
    }

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
    const removedProduct = allProducts.find((item) => {
      return item.productId === productId;
    });
    if (removedProduct) {
      const removedKey = buildExpirationKey(removedProduct);
      const hasSameExpiration = removedKey
        ? filteredProducts.some((item) => buildExpirationKey(item) === removedKey)
        : false;

      if (!hasSameExpiration) {
        await removeExpirationNotificationForProduct(removedProduct);
      }
    }
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
      <Pressable
        onPress={() => openWindow(group)}
        style={({ pressed }) => [
          {
            flex: 1,
            minWidth: "45%",
            marginHorizontal: 8,
            marginVertical: 10,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: colors.border,
            elevation: pressed ? 3 : 6,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: pressed ? 0.1 : 0.15,
            shadowRadius: pressed ? 4 : 6,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <ImageBackground
          source={{ uri: boxImage }}
          style={{
            width: "100%",
            height: 150,
            justifyContent: "flex-end",
          }}
          imageStyle={{ borderRadius: 14 }}
        >
          {/* Tmavý gradient pozadí pre lepšiu čitateľnosť textu */}
          <View
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: 12,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
            }}
          >
            {/* Názov položky */}
            <Text
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {boxName}
            </Text>
            {hasMoreThanOne && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  alignSelf: "flex-start",
                }}
              >
                {/* Zobrazenie počtu kusov v skupine */}
                <Text
                  style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {count} ks
                </Text>
              </View>
            )}
          </View>
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
      <View style={[styles.pantryOverlay, { backgroundColor: colors.overlay }]}>
        {/* Samotné okno modálu */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 10,
            width: "100%"
          }}
        >
          <ScrollView
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 2,
              borderRadius: 20,
              padding: 18,
              width: "95%",
              maxWidth: 560,
              elevation: 8,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
            contentContainerStyle={{
              alignItems: "center",
            }}
          >
            {loadingWindow ? (
              // Loading stav.
              <ActivityIndicator size="large" color={colors.primary} />
            ) : !product ? (
              // Keď produkt neexistuje (napr. vymazaný).
              <>
                <Text style={[{ color: colors.text, fontSize: 18, fontWeight: "700" }]}>
                  Produkt nenájdený
                </Text>
                <Pressable
                  onPress={close}
                  style={{
                    marginTop: 16,
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Zatvoriť</Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Názov produktu */}
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 12,
                    letterSpacing: 0.3,
                  }}
                >
                  {product.name}
                </Text>

                {/* Obrázok produktu */}
                <View
                  style={{
                    width: 120,
                    height: 120,
                    marginBottom: 14,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceAlt,
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={{ width: 115, height: 115 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Info riadky - Exspirácia a Počet */}
                <View style={{ width: "100%", gap: 10, marginBottom: 12 }}>
                  {expiration && (
                    <View
                      style={{
                        backgroundColor: colors.surfaceAlt,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colors.mutedText, fontSize: 14, fontWeight: "500" }}>
                        📅 Exspirácia
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                        {expirationLabel ?? "—"}
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      backgroundColor: colors.surfaceAlt,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.mutedText, fontSize: 14, fontWeight: "500" }}>
                      📦 Počet v špajzi
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {count ?? 1} ks
                    </Text>
                  </View>
                </View>

                {/* Nutričná tabuľka */}
                <View
                  style={{
                    width: "100%",
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 14,
                    borderWidth: 1.5,
                    borderColor: colors.primarySoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "700",
                      textAlign: "center",
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    {isPer100g ? "Hodnoty na 100g" : "Hodnoty na celý produkt"}
                  </Text>

                  {[
                    { label: "Kalórie", value: caloriesValue, unit: "kcal" },
                    { label: "Bielkoviny", value: proteinsValue, unit: "g" },
                    { label: "Sacharidy", value: carbsValue, unit: "g" },
                    { label: "Tuky", value: fatValue, unit: "g" },
                    { label: "Vláknina", value: fiberValue, unit: "g" },
                    { label: "Cukry", value: sugarValue, unit: "g" },
                    { label: "Soľ", value: saltValue, unit: "g" },
                  ].map((row, index) => (
                    <View
                      key={row.label}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: index < 6 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.mutedText,
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {row.label}
                      </Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {row.value ?? "N/A"}
                          {" "}
                          <Text style={{ fontSize: 12, fontWeight: "500" }}>
                            {row.unit}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Akčné tlačidlá */}
                <View style={{ width: "100%", gap: 10 }}>
                  <Pressable
                    onPress={handleEatPress}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? "hsla(129, 56%, 38%, 1)" : colors.primary,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: "center",
                        elevation: pressed ? 2 : 4,
                      },
                    ]}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                      🍽️ Zjedené
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={close}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? "#8b8b8b" : "#9e9e9e",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: "center",
                        elevation: pressed ? 2 : 4,
                      },
                    ]}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                      Zatvoriť
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
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
      <ScrollView
        style={[
          styles.pantryMealContainer,
          { backgroundColor: colors.dashboardBackground },
        ]}
      >
        {/* Sekcia naskenovaných položiek */}
        <Text style={[styles.pantrySectionTitle, { color: colors.text }]}>
          Naskenované položky
        </Text>
        {!hasScannedItems && (
          <Text
            style={[
              styles.pantryEmptyMessage,
              { backgroundColor: colors.surfaceAlt, color: colors.mutedText },
            ]}
          >
            Nemáš naskenované položky.
          </Text>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", width: "100%", paddingHorizontal: 0 }}>
          {groupedMealBoxes.map((group) => (
            <MealBoxItem key={group.key} group={group} />
          ))}
        </View>

        {/* Sekcia vlastných položiek */}
        <Text style={[styles.pantrySectionTitle, { color: colors.text }]}>
          Vlastné položky
        </Text>
        {/* Riadok s inputom a tlačidlom pridania */}
        <View style={styles.pantryCustomInputRow}>
          <TextInput
            placeholder="Názov potraviny"
            value={customName}
            onChangeText={setCustomName}
            style={[
              styles.pantryCustomInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholderTextColor={colors.placeholder}
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
        <View
          style={[
            styles.pantryCustomList,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          {!hasCustomItems ? (
            <Text style={[styles.pantryItemText, { color: colors.mutedText }]}>
              Zatiaľ nemáš vlastné položky.
            </Text>
          ) : (
            customMealBoxes.map((item) => (
              <View
                key={item.productId}
                style={[
                  styles.pantryCustomItemRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.pantryCustomItemText, { color: colors.text }]}>
                  {item.name}
                </Text>
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

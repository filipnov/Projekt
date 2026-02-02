// Dashboard.js
// Hlavná obrazovka aplikácie s tabmi (Prehľad, Recepty, Špajza, Nastavenia)
// Cieľ: jednoduchá a čitateľná logika, aby sa v kóde vyznal aj nováčik
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RecipesTab from "./tabs/RecipesTab";
import PantryTab from "./tabs/PantryTab";
import SettingsTab from "./tabs/SettingsTab";
import OverviewTab from "./tabs/OverviewTab";
import styles from "../styles";
import logo from "../assets/logo_icon.png";
import plus from "../assets/plus.png";
import recipes from "../assets/recipe_book.png";
import setting from "../assets/settings.png";
import storage from "../assets/storage.png";
import speedometer from "../assets/speedometer.png";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard({ setIsLoggedIn }) {
  // URL backendu (z tohto servera načítavame dáta)
  const SERVER_URL = "https://app.bitewise.it.com";
  // Navigácia a route parametre (umožnia prechody medzi obrazovkami)
  const navigation = useNavigation();
  const route = useRoute();

  // Preferujeme serverové hodnoty (aby bol prehľad vždy aktuálny)
  // Ak server pošle hodnotu, prepíše lokálnu (ak je dostupná)
  const mergeTotalsPreferRemote = (localTotals, remoteTotals) => {
    // Ak zo servera nič neprišlo, necháme lokálne hodnoty
    if (!remoteTotals) return localTotals;
    // Skopírujeme lokálne hodnoty, aby sme ich nemenili priamo
    const merged = { ...localTotals };
    // Prejdeme všetky kľúče (kalórie, makrá, voda...)
    for (const key of Object.keys(merged)) {
      // Serverová hodnota pre daný kľúč
      const remoteVal = remoteTotals[key];
      // Ak server poslal hodnotu, prepíšeme ňou lokálnu
      if (remoteVal !== null && remoteVal !== undefined) {
        merged[key] = remoteVal;
      }
    }
    // Vraciame výsledné „zosynchronizované“ hodnoty
    return merged;
  };

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

  // Stav profilu (či je profil načítaný + konkrétne hodnoty)
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);

  // Základné údaje o používateľovi pre UI
  const [nick, setNick] = useState("User");
  const [email, setEmail] = useState(null);

  // Stav aktívneho tabu (1 = Prehľad, 2 = Recepty, 3 = Špajza, 4 = Nastavenia)
  const [activeTab, setActiveTab] = useState(1);
  // Pomocná funkcia pre zvýraznenie aktívneho tabu
  const isActive = (tabIndex) => activeTab === tabIndex;

  // Jedálniček (zoznam uložených produktov)
  const [mealBox, setMealBox] = useState([]);

  // Informácia, či sme už načítali lokálne dáta súhrnov
  const [eatenLoaded, setEatenLoaded] = useState(false);
  // Denné súhrny skonzumovaných živín
  const [eatenTotals, setEatenTotals] = useState(DEFAULT_TOTALS);
  const [currentDayKey, setCurrentDayKey] = useState(getTodayKey());

  // Načíta uložený e‑mail a prezývku
  // Tieto údaje ukladáme po prihlásení v inej časti aplikácie
  useEffect(() => {
    // Vnútorná async funkcia pre načítanie údajov
    async function loadEmailAndNick() {
      try {
        // 1) prezývka
        const savedNick = await AsyncStorage.getItem("userNick");
        if (savedNick) setNick(savedNick);

        // 2) e‑mail
        const savedEmail = await AsyncStorage.getItem("userEmail");
        if (savedEmail) setEmail(savedEmail);
      } catch (error) {
        // Chyba pri čítaní z AsyncStorage
        console.error("Error loading nick/email: ", error);
      }
    }
    // Spustenie načítania po mountnutí komponentu
    loadEmailAndNick();
  }, []);

  // Načíta používateľský profil (váha, výška, cieľ atď.)
  // Používame useFocusEffect, aby sa hodnoty obnovili vždy pri návrate na dashboard
  useFocusEffect(
    useCallback(() => {
      async function reloadProfileFromStorage() {
        try {
          // Načítame profil z AsyncStorage
          const storedProfile = await AsyncStorage.getItem("userProfile");
          if (storedProfile) {
            // Prevedieme JSON na objekt
            const profile = JSON.parse(storedProfile);
            // Nastavíme jednotlivé hodnoty do stavu
            setWeight(profile.weight);
            setHeight(profile.height);
            setAge(profile.age);
            setGender(profile.gender);
            setGoal(profile.goal);
            setActivityLevel(profile.activityLevel);
          }
        } catch (err) {
          // Chyba pri čítaní alebo parsovaní profilu
          console.error("Error loading profile from storage:", err);
        } finally {
          // Označíme, že profil už bol načítaný (aj keď s chybou)
          setProfileLoaded(true);
        }
      }
      // Spustenie načítania pri zobrazení Dashboardu
      reloadProfileFromStorage();
    }, []),
  );

  // Načíta produkty používateľa (lokálne alebo zo servera)
  // Najprv skúsi AsyncStorage pre rýchlosť, potom server ako fallback
  const fetchUserProducts = async () => {
    // Ak nemáme e‑mail, nevieme načítať produkty
    if (!email) return [];
    try {
      // 1) Skúsime lokálne uložené produkty
      const storedProducts = await AsyncStorage.getItem("mealBox");
      if (storedProducts) return JSON.parse(storedProducts);

      // 2) Ak lokálne chýbajú, stiahneme zo servera
      const response = await fetch(
        `${SERVER_URL}/api/getProducts?email=${email}`,
      );
      const data = await response.json();
      if (!data.success) return [];
      // 3) Vrátime zoznam produktov
      return data.products || [];
    } catch (err) {
      // Chyba siete alebo servera
      console.error("Fetch products error:", err);
      return [];
    }
  };

  // Načíta denné súhrny z backendu (ak sú dostupné)
  // Tieto hodnoty majú prednosť, aby bol prehľad vždy presný
  const fetchDailyTotals = async () => {
    // Bez e‑mailu nevieme načítať denné súhrny
    if (!email) return null;
    try {
      // Vytvoríme URL s dnešným dátumom
      const response = await fetch(
        `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(
          email,
        )}&date=${getTodayKey()}`,
      );
      // Ak server neodpovedal OK, vrátime null
      if (!response.ok) return null;
      // Prečítame JSON z odpovede
      const data = await response.json();
      // Vrátime samotné totals
      return data?.totals || null;
    } catch (err) {
      // Chyba pri sieti / serveri
      console.error("Error fetching daily consumption from server:", err);
      return null;
    }
  };

  // Načíta lokálne uložené súhrny (ak existujú)
  // Ak lokálne súbory chýbajú alebo sú poškodené, použijeme DEFAULT_TOTALS
  const loadStoredTotals = async () => {
    // Načítame raw JSON z AsyncStorage
    const storedTotalsRaw = await AsyncStorage.getItem("eatenTotals");
    // Ak nič neexistuje, vrátime bezpečné nuly
    if (!storedTotalsRaw) return { ...DEFAULT_TOTALS };
    try {
      // Zlúčime default + uložené hodnoty
      return { ...DEFAULT_TOTALS, ...JSON.parse(storedTotalsRaw) };
    } catch (e) {
      // Chyba pri parsovaní JSON
      console.error("Error parsing stored eatenTotals:", e);
      return { ...DEFAULT_TOTALS };
    }
  };

  // Načíta uložené dáta pri otvorení Dashboardu
  // Cieľ: mať rýchly štart (lokálne údaje) + vždy aktuálne hodnoty (server)
  useFocusEffect(
    useCallback(() => {
      async function loadStoredData() {
        try {
          // 1) Lokálne uložený jedálniček
          const storedMealBox = await AsyncStorage.getItem("mealBox");
          // 2) Lokálne denné súhrny
          let totals = await loadStoredTotals();

          // Reset pri zmene dňa (lokálny čas)
          const todayKey = getTodayKey();
          const storedTotalsDate = await AsyncStorage.getItem("eatenTotalsDate");
          if (storedTotalsDate !== todayKey) {
            totals = { ...DEFAULT_TOTALS };
            await AsyncStorage.setItem("eatenTotals", JSON.stringify(totals));
            await AsyncStorage.setItem("eatenTotalsDate", todayKey);
            setCurrentDayKey(todayKey);
          }

          // Ak máme lokálny jedálniček, nastavíme ho do stavu
          if (storedMealBox) setMealBox(JSON.parse(storedMealBox));

          // Zosúladíme lokálne súhrny so serverovými (ak sú dostupné)
          // Serverové hodnoty majú prednosť
          const remoteTotals = await fetchDailyTotals();
          totals = mergeTotalsPreferRemote(totals, remoteTotals);

          // Ak nemáme lokálne produkty, skúsime ich stiahnuť zo servera
          // (zachováme rovnaké správanie ako doteraz)
          if (email) {
            // Získame produkty zo servera
            const products = await fetchUserProducts();
            // Ak lokálne neboli, uložíme prvé načítanie do stavu
            if (products.length > 0 && (!storedMealBox || storedMealBox === "[]")) {
              setMealBox(products);
            }
          }

          // Nastavíme výsledné totals do stavu
          setEatenTotals(totals);
          // Označíme, že dáta sú načítané
          setEatenLoaded(true);
        } catch (err) {
          // Chyba pri načítaní dát
          console.error("Error loading stored data:", err);
        }
      }
      // Spustíme načítanie pri zobrazení Dashboardu
      loadStoredData();
    }, [email]),
  );

  // Ukladá jedálniček do lokálneho úložiska
  // Vďaka tomu nezmiznú produkty po reštarte aplikácie
  useEffect(() => {
    // Uložíme jedálniček pri každej zmene
    AsyncStorage.setItem("mealBox", JSON.stringify(mealBox));
  }, [mealBox]);

  // Ukladá denné súhrny do lokálneho úložiska
  // Pozn.: ukladáme až po prvom načítaní, aby sme neprepísali hodnoty 0
  useEffect(() => {
    // Neuložíme, kým nemáme načítané dáta (aby sme neprepísali nuly)
    if (!eatenLoaded) return;
    // Uložíme denné súhrny lokálne
    AsyncStorage.setItem("eatenTotals", JSON.stringify(eatenTotals));
    AsyncStorage.setItem("eatenTotalsDate", getTodayKey());
  }, [eatenTotals, eatenLoaded]);

  // Reset o polnoci (lokálny čas) aj pri otvorenej appke
  useEffect(() => {
    if (!eatenLoaded) return;

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime() + 500;

    const timer = setTimeout(async () => {
      const todayKey = getTodayKey();
      const cleared = { ...DEFAULT_TOTALS };
      setEatenTotals(cleared);
      await AsyncStorage.setItem("eatenTotals", JSON.stringify(cleared));
      await AsyncStorage.setItem("eatenTotalsDate", todayKey);
      setCurrentDayKey(todayKey);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentDayKey, eatenLoaded]);

  // Pri prepnutí na Prehľad znovu načíta serverové súhrny
  // Tým sa zabezpečí, že Prehľad ukazuje čerstvé dáta
  useEffect(() => {
    // Refresh robíme len vtedy, keď je aktívny Prehľad a poznáme e‑mail
    if (activeTab !== 1 || !email) return;

    // Príznak, ktorý zabráni nastaveniu stavu po odchode zo screenu
    let cancelled = false;

    const refreshTotals = async () => {
      try {
        // Načítame najnovšie totals zo servera
        const totals = await fetchDailyTotals();
        if (totals && !cancelled) {
          // Update stavu + uloženie do AsyncStorage
          // (ostatné obrazovky tak čítajú najnovšie hodnoty)
          setEatenTotals((prev) => {
            // Zlúčime staré hodnoty s novými zo servera
            const merged = mergeTotalsPreferRemote(prev, totals);
            try {
              // Uložíme do AsyncStorage, aby sa zachovali
              AsyncStorage.setItem("eatenTotals", JSON.stringify(merged));
            } catch (e) {
              console.error("Failed to persist refreshed eatenTotals:", e);
            }
            return merged;
          });
          setEatenLoaded(true);
        }
      } catch (err) {
        // Chyba pri refreshi
        console.error("Error refreshing eatenTotals on tab switch:", err);
      }
    };

    // Spustíme refresh
    refreshTotals();

    return () => {
      // Ak odídeme zo screenu, už nenastavujeme stav
      cancelled = true;
    };
  }, [activeTab, email]);

  // Posiela denné súhrny na server (po každej zmene)
  // Toto drží backend v synchronizovanom stave
  useEffect(() => {
    // Posielame iba ak sú dáta načítané a poznáme e‑mail
    if (!eatenLoaded || !email) return;
    const pushConsumedToDB = async () => {
      try {
        // Uložíme denné súhrny do DB cez API
        await fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: getTodayKey(),
            totals: eatenTotals,
          }),
        });
      } catch (err) {
        // Chyba pri posielaní na server
        console.error("Error pushing consumed totals:", err);
      }
    };
    // Spustíme odoslanie pri každej zmene súhrnov
    pushConsumedToDB();
  }, [eatenTotals, eatenLoaded, email]);

  // Umožní otvoriť konkrétny tab cez route params
  // Príklad: route.params.startTab = 3 otvorí priamo Špajzu
  useEffect(() => {
    // Ak route obsahuje startTab, otvoríme ho
    if (route.params?.startTab) setActiveTab(route.params.startTab);
  }, [route.params?.startTab]);

  // Odstráni produkt zo servera
  // (po kliknutí na „zjesť“ v Špajzi)
  const removeProduct = async (productId) => {
    try {
      // Pošleme požiadavku na server na odstránenie produktu
      await fetch(`${SERVER_URL}/api/removeProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });
    } catch (err) {
      // Chyba pri odstraňovaní na serveri
      console.error("Error removing product:", err);
    }
  };

  // Odstráni produkt z lokálneho zoznamu a pripočíta jeho hodnoty do súhrnov
  // 1) vymaže z UI
  // 2) vymaže zo servera
  // 3) pripočíta výživové hodnoty do denného súhrnu
  const removeMealBox = (id, productId, box) => {
    // 1) Vymažeme položku z UI
    setMealBox((prev) => prev.filter((b) => b.id !== id));
    // 2) Vymažeme položku zo servera
    removeProduct(productId);
    // 3) Pripočítame jej hodnoty do denných súhrnov
    addEatenValues(box);
  };

  // Pridá skonzumované hodnoty do denného súhrnu
  // (kalórie, makrá, vláknina, cukor, soľ)
  const addEatenValues = (box) => {
    // Bezpečne pripočítame hodnoty (ak niečo chýba, použijeme 0)
    setEatenTotals((prev) => ({
      ...prev,
      calories: prev.calories + (box.totalCalories || 0),
      proteins: prev.proteins + (box.totalProteins || 0),
      carbs: prev.carbs + (box.totalCarbs || 0),
      fat: prev.fat + (box.totalFat || 0),
      fiber: prev.fiber + (box.totalFiber || 0),
      sugar: prev.sugar + (box.totalSugar || 0),
      salt: prev.salt + (box.totalSalt || 0),
    }));
  };

  // Obnoví produkty z backendu a pridá len nové
  // Nepridávame duplicitné položky (kontrola podľa názvu)
  const refreshMealBoxes = async () => {
    // Získame produkty zo servera
    const products = await fetchUserProducts();
    // Ak nič neprišlo, upozorníme používateľa
    if (!products || products.length === 0)
      return alert("Ešte si nenaskenoval žiaden produkt");
    // Vytvoríme zoznam nových produktov (bez duplicít)
    const newProducts = products.filter(
      (p) => !mealBox.some((b) => b.name === p.name),
    );
    // Ak nie sú žiadne nové, dáme info
    if (newProducts.length === 0)
      return alert("Všetky produkty už sú v jedálničku!");
    // Pridáme len nové položky do stavu
    setMealBox((prev) => [
      ...prev,
      ...newProducts.map((p) => ({
        id: Date.now() + Math.random(),
        ...p,
      })),
    ]);
  };

  // Podľa aktívneho tabu renderujeme správny obsah
  // Všetky ostatné taby ostávajú samostatné komponenty
  const renderContent = () => {
    // Podľa hodnoty activeTab vyberieme správnu obrazovku
    switch (activeTab) {
      case 1:
        return (
          <OverviewTab
            navigation={navigation}
            profileLoaded={profileLoaded}
            weight={weight}
            height={height}
            age={age}
            gender={gender}
            goal={goal}
            activityLevel={activityLevel}
            eatenTotals={eatenTotals}
            setEatenTotals={setEatenTotals}
          />
        );
      case 2:
        return <RecipesTab />;
      case 3:
        return (
          <PantryTab
            mealBox={mealBox}
            removeMealBox={removeMealBox}
            refreshMealBoxes={refreshMealBoxes}
            addEatenValues={addEatenValues}
          />
        );
      case 4:
        return (
          <SettingsTab
            setIsLoggedIn={setIsLoggedIn}
            navigation={navigation}
            setNick={setNick}
          />
        );
      default:
        return <Text>Oops, niečo sa pokazilo</Text>;
    }
  };

  // --- UI ---
  return (
    <>
      {/* Horná lišta s pozdravom */}
      <View style={styles.dashTopBar}>
        <Image source={logo} style={styles.dashTopBar_img} />
        <Text style={styles.dashTopBar_text}>Ahoj {nick}!</Text>
      </View>

      {/* Hlavný obsah dashboardu */}
      <View style={styles.dashContentContainer}>
        <ScrollView
          style={{ flex: 1 }}
         // contentContainerStyle={{ paddingBottom: 110 + (insets?.bottom ?? 0) }}
        >
          {/* Obsah podľa aktuálneho tabu */}
          {renderContent()}
        </ScrollView>

        {/* Spodná navigácia (taby) */}
        <SafeAreaView edges={["bottom"]} style={styles.dashNavBar}>
          <Pressable
            onPress={() => setActiveTab(1)}
            style={[
              styles.dashNavBar_tabs,
              isActive(1) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={speedometer} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(1) && styles.dashNavBar_text_pressed,
              ]}
            >
              Prehľad
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(2)}
            style={[
              styles.dashNavBar_tabs,
              isActive(2) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={recipes} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(2) && styles.dashNavBar_text_pressed,
              ]}
            >
              Recepty
            </Text>
          </Pressable>
          <Pressable
            style={styles.dashNavBar_tabs}
            onPress={() => navigation.navigate("CameraScreen")}
          >
            <View style={styles.dashNavBar_Add_container}>
              <Image source={plus} style={styles.dashNavBar_Add} />
            </View>
            <Text style={styles.dashNavBar_text_Add}>Pridať</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab(3)}
            style={[
              styles.dashNavBar_tabs,
              isActive(3) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={storage} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(3) && styles.dashNavBar_text_pressed,
              ]}
            >
              Špajza
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(4)}
            style={[
              styles.dashNavBar_tabs,
              isActive(4) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={setting} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(4) && styles.dashNavBar_text_pressed,
              ]}
            >
              Nastavenia
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </>
  );
}

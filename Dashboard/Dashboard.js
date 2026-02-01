// Dashboard.js
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
  const SERVER_URL = "https://app.bitewise.it.com";
  const navigation = useNavigation();
  const route = useRoute(); //Treba

  const mergeTotalsPreferLocal = (localTotals, remoteTotals) => {
    if (!remoteTotals) return localTotals;
    const merged = { ...localTotals };
    for (const key of Object.keys(merged)) {
      const localVal = merged[key];
      const remoteVal = remoteTotals[key];
      const localHasValue =
        localVal !== null && localVal !== undefined && Number(localVal) !== 0;

      if (!localHasValue && remoteVal !== null && remoteVal !== undefined) {
        merged[key] = remoteVal;
      }
    }
    return merged;
  };

  // Prefer remote (server) totals when available to ensure overview is current
  const mergeTotalsPreferRemote = (localTotals, remoteTotals) => {
    if (!remoteTotals) return localTotals;
    const merged = { ...localTotals };
    for (const key of Object.keys(merged)) {
      const remoteVal = remoteTotals[key];
      if (remoteVal !== null && remoteVal !== undefined) {
        merged[key] = remoteVal;
      }
    }
    return merged;
  };

  const isTotalsEmptyOrAllZero = (totals) => {
    if (!totals) return true;
    return Object.values(totals).every((v) => Number(v) === 0);
  };

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);
  const [nick, setNick] = useState("User");
  const [email, setEmail] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const isActive = (tabIndex) => activeTab === tabIndex;
  const [mealBox, setMealBox] = useState([]);
  const [eatenLoaded, setEatenLoaded] = useState(false);
  const [eatenTotals, setEatenTotals] = useState({
    calories: 0,
    proteins: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    salt: 0,
    drunkWater: 0,
  });

  // --- LOAD EMAIL/NICK FROM ASYNC ---
  useEffect(() => {
    async function loadEmailAndNick() {
      try {
        const savedNick = await AsyncStorage.getItem("userNick");
        if (savedNick) setNick(savedNick);

        const savedEmail = await AsyncStorage.getItem("userEmail");
        if (savedEmail) setEmail(savedEmail);
      } catch (error) {
        console.error("Error loading nick/email: ", error);
      }
    }
    loadEmailAndNick();
  }, []);

  // --- LOAD PROFILE ---
  useFocusEffect(
    useCallback(() => {
      async function reloadProfileFromStorage() {
        try {
          const storedProfile = await AsyncStorage.getItem("userProfile");
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setWeight(profile.weight);
            setHeight(profile.height);
            setAge(profile.age);
            setGender(profile.gender);
            setGoal(profile.goal);
            setActivityLevel(profile.activityLevel);
          }
        } catch (err) {
          console.error("Error loading profile from storage:", err);
        } finally {
          setProfileLoaded(true);
        }
      }
      reloadProfileFromStorage();
    }, []),
  );

  // --- FETCH PRODUCTS WITH FALLBACK ---
  const fetchUserProducts = async () => {
    if (!email) return [];
    try {
      const storedProducts = await AsyncStorage.getItem("mealBox");
      if (storedProducts) return JSON.parse(storedProducts);

      const response = await fetch(
        `${SERVER_URL}/api/getProducts?email=${email}`,
      );
      const data = await response.json();
      if (!data.success) return [];
      return data.products || [];
    } catch (err) {
      console.error("Fetch products error:", err);
      return [];
    }
  };

  // --- LOAD STORED DATA (now loads eatenTotals including drunkWater) ---
  useFocusEffect(
    useCallback(() => {
      async function loadStoredData() {
        try {
          const storedMealBox = await AsyncStorage.getItem("mealBox");
          const storedTotalsRaw = await AsyncStorage.getItem("eatenTotals");

          let totals = {
            calories: 0,
            proteins: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            salt: 0,
            drunkWater: 0,
          };

          let hasLocalTotals = false;

          if (storedTotalsRaw) {
            try {
              const parsed = JSON.parse(storedTotalsRaw);
              totals = { ...totals, ...parsed };
              hasLocalTotals = !isTotalsEmptyOrAllZero(parsed);
            } catch (e) {
              console.error("Error parsing stored eatenTotals:", e);
            }
          }

          if (storedMealBox) setMealBox(JSON.parse(storedMealBox));

          // Always refresh daily totals from server when opening Overview
          if (email) {
            try {
              const response = await fetch(
                `${SERVER_URL}/api/getDailyConsumption?email=${email}&date=${new Date().toISOString().slice(0, 10)}`,
              );
              if (response.ok) {
                const data = await response.json();
                if (data?.totals) {
                  // prefer server totals so overview reflects latest values
                  totals = mergeTotalsPreferRemote(totals, data.totals);
                }
              }
            } catch (err) {
              console.error(
                "Error fetching daily consumption from server:",
                err,
              );
            }

            // fetch products fallback (unchanged)
            const products = await fetchUserProducts();
            if (
              products.length > 0 &&
              (!storedMealBox || storedMealBox === "[]")
            ) {
              setMealBox(products);
            }
          }

          setEatenTotals(totals);
          setEatenLoaded(true);
        } catch (err) {
          console.error("Error loading stored data:", err);
        }
      }
      loadStoredData();
    }, [email]),
  );

  // --- SAVE mealBox ---
  useEffect(() => {
    AsyncStorage.setItem("mealBox", JSON.stringify(mealBox));
  }, [mealBox]);

  // --- SAVE eatenTotals (single effect) ---
  useEffect(() => {
    if (!eatenLoaded) return;
    AsyncStorage.setItem("eatenTotals", JSON.stringify(eatenTotals));
  }, [eatenTotals, eatenLoaded]);

  // --- REFRESH TOTALS WHEN USER SWITCHES TO OVERVIEW TAB ---
  useEffect(() => {
    if (activeTab !== 1 || !email) return;

    let cancelled = false;

    const refreshTotals = async () => {
      try {
        const response = await fetch(
          `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(
            email,
          )}&date=${new Date().toISOString().slice(0, 10)}`,
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data?.totals && !cancelled) {
          // Update state and persist so other screens read the latest
          setEatenTotals((prev) => {
            const merged = mergeTotalsPreferRemote(prev, data.totals);
            try {
              AsyncStorage.setItem("eatenTotals", JSON.stringify(merged));
            } catch (e) {
              console.error("Failed to persist refreshed eatenTotals:", e);
            }
            return merged;
          });
          setEatenLoaded(true);
        }
      } catch (err) {
        console.error("Error refreshing eatenTotals on tab switch:", err);
      }
    };

    refreshTotals();

    return () => {
      cancelled = true;
    };
  }, [activeTab, email]);

  // --- PUSH DAILY CONSUMPTION TO SERVER (single payload) ---
  useEffect(() => {
    if (!eatenLoaded || !email) return;
    const pushConsumedToDB = async () => {
      try {
        await fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: new Date().toISOString().slice(0, 10),
            totals: eatenTotals,
          }),
        });
      } catch (err) {
        console.error("Error pushing consumed totals:", err);
      }
    };
    pushConsumedToDB();
  }, [eatenTotals, eatenLoaded, email]);

  // --- TAB HANDLING ---
  useEffect(() => {
    if (route.params?.startTab) setActiveTab(route.params.startTab);
  }, [route.params?.startTab]);

  // --- REMOVE PRODUCT ---
  const removeProduct = async (productId) => {
    try {
      await fetch(`${SERVER_URL}/api/removeProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });
    } catch (err) {
      console.error("Error removing product:", err);
    }
  };

  const removeMealBox = (id, productId, box) => {
    setMealBox((prev) => prev.filter((b) => b.id !== id));
    removeProduct(productId);
    addEatenValues(box);
  };

  // --- ADD EATEN VALUES (updates eatenTotals object) ---
  const addEatenValues = (box) => {
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

  const renderContent = () => {
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
            refreshMealBoxes={async () => {
              const products = await fetchUserProducts();
              if (!products || products.length === 0)
                return alert("Ešte si nenaskenoval žiaden produkt");
              const newProducts = products.filter(
                (p) => !mealBox.some((b) => b.name === p.name),
              );
              if (newProducts.length === 0)
                return alert("Všetky produkty už sú v jedálničku!");
              setMealBox((prev) => [
                ...prev,
                ...newProducts.map((p) => ({
                  id: Date.now() + Math.random(),
                  ...p,
                })),
              ]);
            }}
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

  return (
    <>
      <View style={styles.dashTopBar}>
        <Image source={logo} style={styles.dashTopBar_img} />
        <Text style={styles.dashTopBar_text}>Ahoj {nick}!</Text>
      </View>

      <View style={styles.dashContentContainer}>
        <ScrollView
          style={{ flex: 1 }}
         // contentContainerStyle={{ paddingBottom: 110 + (insets?.bottom ?? 0) }}
        >
          {renderContent()}
        </ScrollView>

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

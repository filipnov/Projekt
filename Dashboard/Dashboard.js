import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import OverviewTab from "./tabs/OverviewTab";
import RecipesTab from "./tabs/RecipesTab";
import PantryTab from "./tabs/PantryTab";
import SettingsTab from "./tabs/SettingsTab";
import styles from "./styles";

import logo from "../assets/logo.png";
import plus from "../assets/plus.png";
import recipes from "../assets/recipe-book.png";
import setting from "../assets/settings.png";
import storage from "../assets/storage.png";
import speedometer from "../assets/speedometer.png";
import account from "../assets/avatar.png";

export default function Dashboard({ setIsLoggedIn }) {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeTab, setActiveTab] = useState(1);
  const isActive = (tabIndex) => activeTab === tabIndex;

  const [nick, setNick] = useState("User");
  const [email, setEmail] = useState(null);

  const [age, setAge] = useState(null);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);

  const [mealBox, setMealBox] = useState([]);
  const [eatenTotals, setEatenTotals] = useState({
    calories: 0,
    proteins: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    salt: 0,
  });

  const [overviewData, setOverviewData] = useState({});

  const [currentDate] = useState(Date.now());

  // Load initial tab from route
  useEffect(() => {
    if (route.params?.startTab) setActiveTab(route.params.startTab);
  }, [route.params?.startTab]);

  // Load nick and email from AsyncStorage
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

  // Load user profile
  useEffect(() => {
    if (!email) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(`http://10.0.2.2:3000/api/userProfile?email=${email}`);
        const data = await response.json();
        if (response.ok) {
          setAge(data.age);
          setWeight(data.weight);
          setHeight(data.height);
          setGender(data.gender);
          setGoal(data.goal);
          setActivityLevel(data.activityLevel);
        } else {
          console.warn("Failed to load profile:", data.error);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    loadProfile();
  }, [email]);

  // Fetch user products from server
  const fetchUserProducts = async () => {
    if (!email) return [];
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/getProducts?email=${email}`);
      const data = await response.json();
      if (!data.success) return [];
      return data.products || [];
    } catch (err) {
      console.error("Fetch products error:", err);
      return [];
    }
  };

  // Load mealBox and eatenTotals from AsyncStorage and merge with server data
  useFocusEffect(
    useCallback(() => {
      async function loadStoredData() {
        try {
          const storedMealBox = await AsyncStorage.getItem("mealBox");
          const storedTotals = await AsyncStorage.getItem("eatenTotals");

          if (storedMealBox) setMealBox(JSON.parse(storedMealBox));
          if (storedTotals) setEatenTotals(JSON.parse(storedTotals));

          // Fetch server products and merge without overwriting local
          if (email) {
            const products = await fetchUserProducts();
            if (products && products.length > 0) {
              setMealBox((prev) => {
                const newProducts = products.filter(p => !prev.some(b => b.name === p.name));
                return [...prev, ...newProducts.map(p => ({
                  id: Date.now() + Math.random(),
                  name: p.name,
                  calories: p.calories || 0,
                  proteins: p.proteins || 0,
                  carbs: p.carbs || 0,
                  fat: p.fat || 0,
                  fiber: p.fiber || 0,
                  sugar: p.sugar || 0,
                  salt: p.salt || 0,
                  image: p.image || null,
                }))];
              });
            }
          }
        } catch (err) {
          console.error("Error loading stored data:", err);
        }
      }

      loadStoredData();
    }, [email])
  );

  // Save mealBox and eatenTotals to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem("mealBox", JSON.stringify(mealBox));
  }, [mealBox]);

  useEffect(() => {
    AsyncStorage.setItem("eatenTotals", JSON.stringify(eatenTotals));
  }, [eatenTotals]);

  // Remove product from server
  const removeProduct = async (productName) => {
    try {
      await fetch("http://10.0.2.2:3000/api/removeProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: productName }),
      });
    } catch (err) {
      console.error("Error removing product:", err);
    }
  };

  // Remove from mealBox and update eatenTotals
  const removeMealBox = (id, name, box) => {
    setMealBox(prev => prev.filter(b => b.id !== id));
    removeProduct(name);
    addEatenValues(box);
  };

  const addEatenValues = (box) => {
    setEatenTotals(prev => {
      const updated = {
        calories: prev.calories + (box.calories || 0),
        proteins: prev.proteins + (box.proteins || 0),
        carbs: prev.carbs + (box.carbs || 0),
        fat: prev.fat + (box.fat || 0),
        fiber: prev.fiber + (box.fiber || 0),
        sugar: prev.sugar + (box.sugar || 0),
        salt: prev.salt + (box.salt || 0),
      };
      return updated;
    });
  };

  // Calculate overview data
  useEffect(() => {
    if (!weight || !height || !age || !activityLevel || !gender) return;

    const { calories, proteins, carbs, fat, fiber, sugar, salt } = eatenTotals;

    let cal;
    if (gender === "male") cal = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
    else cal = (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;

    if (goal === "lose") cal -= 500;
    else if (goal === "gain") cal += 500;

    const progressBar = Math.min((calories / cal) * 100, 100);
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput = "";
    if (calories < cal) eatOutput = `Ešte ti chýba ${Math.round(cal - calories)} kcal`;
    else if (calories === cal) eatOutput = "Dostal/-a si sa na svoj denný cieľ!";
    else eatOutput = `Prekročil/a si cieľ o ${Math.round(calories - cal)} kcal`;

    const proteinGoal = ((cal * 0.13) / 4).toFixed(0);
    const carbGoal = ((cal * 0.65) / 4).toFixed(0);
    const fatGoal = ((cal * 0.23) / 9).toFixed(0);
    const fiberGoal = ((cal / 1000) * 14).toFixed(0);
    const sugarGoal = ((cal * 0.075) / 4).toFixed(0);
    const saltGoal = 5;

    const proteinBar = (proteins / proteinGoal) * 100;
    const carbBar = (carbs / carbGoal) * 100;
    const fatBar = (fat / fatGoal) * 100;
    const fiberBar = (fiber / fiberGoal) * 100;
    const sugarBar = (sugar / sugarGoal) * 100;
    const saltBar = (salt / saltGoal) * 100;

    const bmiValue = ((weight / (height * height)) * 10000).toFixed(1);
    let bmiOutput = "", bmiBarColor = "#4CAF50";
    if (bmiValue < 18.5) { bmiOutput = `BMI: ${bmiValue}\nPodváha`; bmiBarColor = "#2196F3"; }
    else if (bmiValue < 25) bmiOutput = `BMI: ${bmiValue}\nNormálna váha`;
    else if (bmiValue < 30) { bmiOutput = `BMI: ${bmiValue}\nNadváha`; bmiBarColor = "#FF9800"; }
    else { bmiOutput = `BMI: ${bmiValue}\nObezita`; bmiBarColor = "#FF3B30"; }

    const bmiBar = (bmiValue / 40) * 100;

    setOverviewData({
      caloriesGoal: cal,
      caloriesConsumed: calories,
      progressBar,
      barColor,
      eatOutput,
      eatenOutput: `${Math.round(calories)} / ${Math.round(cal)} kcal`,
      proteinGoal,
      proteinConsumed: proteins,
      proteinBar,
      carbGoal,
      carbConsumed: carbs,
      carbBar,
      fatGoal,
      fatConsumed: fat,
      fatBar,
      fiberGoal,
      fiberConsumed: fiber,
      fiberBar,
      sugarGoal,
      sugarConsumed: sugar,
      sugarBar,
      saltGoal,
      saltConsumed: salt,
      saltBar,
      bmiOutput,
      bmiBar,
      bmiBarColor,
    });
  }, [weight, height, age, activityLevel, gender, goal, eatenTotals]);

  const renderContent = () => {
    if (!weight || !height || !age) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 18, textAlign: "center" }}>
            Vyplň si svoj profil, aby si videl/-a prehľad!
          </Text>
          <Pressable
            style={{ marginTop: 15, backgroundColor: "#4CAF50", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => navigation.navigate("ProfileCompletition")}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Vyplniť profil</Text>
          </Pressable>
        </View>
      );
    }

    switch (activeTab) {
      case 1: return <OverviewTab {...overviewData} currentDate={currentDate} />;
      case 2: return <RecipesTab />;
      case 3:
        return <PantryTab
          mealBox={mealBox}
          removeMealBox={removeMealBox}
          refreshMealBoxes={async () => {
            const products = await fetchUserProducts();
            if (!products || products.length === 0) return alert("Ešte si nenaskenoval žiaden produkt");
            const newProducts = products.filter(p => !mealBox.some(b => b.name === p.name));
            if (newProducts.length === 0) return alert("Všetky produkty už sú v jedálničku!");
            setMealBox(prev => [...prev, ...newProducts.map(p => ({ id: Date.now() + Math.random(), ...p }))]);
          }}
          addEatenValues={addEatenValues}
        />;
      case 4: return <SettingsTab setIsLoggedIn={setIsLoggedIn} navigation={navigation} />;
      default: return <Text>Oops, niečo sa pokazilo</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={logo} style={styles.topBar_img} />
        <Text style={styles.topBar_text}>Ahoj {nick}</Text>
        <Pressable onPress={() => navigation.navigate("ProfileCompletition")}>
          <Image source={account} style={styles.topBar_img} />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView>{renderContent()}</ScrollView>

        <View style={styles.navBar}>
          <Pressable onPress={() => setActiveTab(1)} style={[styles.navBar_tabs, isActive(1) && styles.navBar_tabs_pressed]}>
            <Image source={speedometer} style={styles.navBar_img} />
            <Text style={[styles.navBar_text, isActive(1) && styles.navBar_text_pressed]}>Prehľad</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab(2)} style={[styles.navBar_tabs, isActive(2) && styles.navBar_tabs_pressed]}>
            <Image source={recipes} style={styles.navBar_img} />
            <Text style={[styles.navBar_text, isActive(2) && styles.navBar_text_pressed]}>Recepty</Text>
          </Pressable>
          <Pressable style={styles.navBar_tab_Add} onPress={() => navigation.navigate("CameraScreen")}>
            <View style={styles.navBar_Add_container}><Image source={plus} style={styles.navBar_Add} /></View>
            <Text style={styles.navBar_text_Add}>Pridať</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab(3)} style={[styles.navBar_tabs, isActive(3) && styles.navBar_tabs_pressed]}>
            <Image source={storage} style={styles.navBar_img} />
            <Text style={[styles.navBar_text, isActive(3) && styles.navBar_text_pressed]}>Špajza</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab(4)} style={[styles.navBar_tabs, isActive(4) && styles.navBar_tabs_pressed]}>
            <Image source={setting} style={styles.navBar_img} />
            <Text style={[styles.navBar_text, isActive(4) && styles.navBar_text_pressed]}>Nastavenia</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

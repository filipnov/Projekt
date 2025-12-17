import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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
  const [loading, setLoading] = useState(true);

  const [userProducts, setUserProducts] = useState([]);
  const [mealBox, setMealBox] = useState([]);
  const [currentDate] = useState(Date.now());

  const [overviewData, setOverviewData] = useState({
    caloriesGoal: 0,
    caloriesConsumed: 500,
    progressBar: 0,
    barColor: "#4CAF50",
    eatOutput: "",
    eatenOutput: "",
    proteinGoal: 0,
    proteinConsumed: 80,
    proteinBar: 0,
    carbGoal: 0,
    carbConsumed: 300,
    carbBar: 0,
    fatGoal: 0,
    fatConsumed: 20,
    fatBar: 0,
    fiberGoal: 0,
    fiberConsumed: 20,
    fiberBar: 0,
    sugarGoal: 0,
    sugarConsumed: 14,
    sugarBar: 0,
    saltGoal: 5,
    saltConsumed: 4,
    saltBar: 0,
    bmiOutput: "",
    bmiBar: 0,
    bmiBarColor: "#4CAF50",
  });

  // Load tab via route
  useEffect(() => {
    if (route.params?.startTab) setActiveTab(route.params.startTab);
  }, [route.params?.startTab]);

  // Load nick + email
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

  // Load profile for current user
  useEffect(() => {
    if (!email) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // Vymažeme starý profil zo storage, aby sa nezobrazoval
        await AsyncStorage.removeItem("userProfile");

        const response = await fetch(`http://10.0.2.2:3000/api/userProfile?email=${email}`);
        const data = await response.json();

        if (response.ok) {
          await AsyncStorage.setItem("userProfile", JSON.stringify(data));
          setAge(data.age);
          setWeight(data.weight);
          setHeight(data.height);
          setGender(data.gender);
          setGoal(data.goal);
          setActivityLevel(data.activityLevel);
        } else {
          console.warn("Nepodarilo sa načítať profil zo servera:", data.error);
          setAge(null);
          setWeight(null);
          setHeight(null);
          setGender(null);
          setGoal(null);
          setActivityLevel(null);
        }
      } catch (err) {
        console.error("Chyba pri načítaní profilu:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [email]);

  // Fetch user products
  async function fetchUserProducts() {
    if (!email) return [];
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/getProducts?email=${email}`);
      const data = await response.json();
      if (!data.success) return [];
      setUserProducts(data.products || []);
      return data.products || [];
    } catch (err) {
      console.error("Fetch products error:", err);
      return [];
    }
  }

  // Load meal boxes
  useEffect(() => {
    fetchUserProducts().then(loadMealBoxes).catch(console.error);
  }, [email]);

  async function loadMealBoxes(products) {
    if (!products || products.length === 0) return;

    const newProducts = products.filter((p) => !mealBox.some((box) => box.name === p.name));
    setMealBox((prev) => [
      ...prev,
      ...newProducts.map((p) => ({ id: Date.now() + Math.random(), width: "100%", name: p.name })),
    ]);
  }

  async function refreshMealBoxes() {
    const products = await fetchUserProducts();
    if (!products || products.length === 0) {
      alert("Ešte si nenaskenoval žiaden produkt");
      return;
    }
    const newProducts = products.filter((p) => !mealBox.some((box) => box.name === p.name));
    if (newProducts.length === 0) {
      alert("Všetky produkty už sú v jedálničku!");
      return;
    }
    setMealBox((prev) => [
      ...prev,
      ...newProducts.map((p) => ({ id: Date.now() + Math.random(), width: "100%", name: p.name })),
    ]);
  }

  async function removeProduct(productName) {
    try {
      await fetch("http://10.0.2.2:3000/api/removeProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: productName }),
      });
    } catch (err) {
      console.error("Error removing product:", err);
    }
  }

  function removeMealBox(id, name) {
    setMealBox(mealBox.filter((box) => box.id !== id));
    removeProduct(name);
  }

  // Recalculate calories, macros, BMI when profile or consumed data changes
  useEffect(() => {
    if (!weight || !height || !age || !activityLevel || !gender) return;

    let cal;
    if (gender === "male") cal = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
    else cal = (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;

    if (goal === "lose") cal -= 500;
    else if (goal === "gain") cal += 500;

    const caloriesConsumed = 500;

    const progressBar = (caloriesConsumed / cal) * 100;
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput = "";
    if (caloriesConsumed < cal) eatOutput = `Ešte ti chýba ${Math.round(cal - caloriesConsumed)} kcal`;
    else if (caloriesConsumed === cal) eatOutput = "Dostal/-a si sa na svoj denný cieľ!";
    else eatOutput = `Prekročil/a si svoj denný cieľ o ${Math.round(caloriesConsumed - cal)} kcal`;

    const eatenOutput = `${caloriesConsumed} / ${Math.round(cal)} kcal`;

    const proteinGoal = ((cal * 0.13) / 4).toFixed(0);
    const carbGoal = ((cal * 0.65) / 4).toFixed(0);
    const fatGoal = ((cal * 0.23) / 9).toFixed(0);
    const fiberGoal = ((cal / 1000) * 14).toFixed(0);
    const sugarGoal = ((cal * 0.075) / 4).toFixed(0);
    const saltGoal = 5;

    const proteinConsumed = 80;
    const carbConsumed = 300;
    const fatConsumed = 20;
    const fiberConsumed = 20;
    const sugarConsumed = 14;
    const saltConsumed = 4;

    const proteinBar = ((proteinConsumed / proteinGoal) * 100).toFixed(0);
    const carbBar = ((carbConsumed / carbGoal) * 100).toFixed(0);
    const fatBar = ((fatConsumed / fatGoal) * 100).toFixed(0);
    const fiberBar = ((fiberConsumed / fiberGoal) * 100).toFixed(0);
    const sugarBar = ((sugarConsumed / sugarGoal) * 100).toFixed(0);
    const saltBar = ((saltConsumed / saltGoal) * 100).toFixed(0);

    const bmiValue = ((weight / (height * height)) * 10000).toFixed(1);
    let bmiOutput = "";
    let bmiBarColor = "#4CAF50";
    if (bmiValue < 18.5) bmiOutput = `BMI: ${bmiValue} \nPodváha`, bmiBarColor = "#2196F3";
    else if (bmiValue < 25) bmiOutput = `BMI: ${bmiValue} \nNormálna váha`, bmiBarColor = "#4CAF50";
    else if (bmiValue < 30) bmiOutput = `BMI: ${bmiValue} \nNadváha`, bmiBarColor = "#FF9800";
    else if (bmiValue < 35) bmiOutput = `BMI: ${bmiValue} \nObezita (I. stupeň)`, bmiBarColor = "#FF3B30";
    else if (bmiValue < 40) bmiOutput = `BMI: ${bmiValue} \nObezita (II. stupeň)`, bmiBarColor = "#D32F2F";
    else bmiOutput = `BMI: ${bmiValue} \nObezita (III. stupeň) — ťažká obezita`, bmiBarColor = "#B00020";

    const bmiBar = ((bmiValue / 40) * 100).toFixed(0);

    setOverviewData({
      caloriesGoal: cal,
      caloriesConsumed,
      progressBar,
      barColor,
      eatOutput,
      eatenOutput,
      proteinGoal,
      proteinConsumed,
      proteinBar,
      carbGoal,
      carbConsumed,
      carbBar,
      fatGoal,
      fatConsumed,
      fatBar,
      fiberGoal,
      fiberConsumed,
      fiberBar,
      sugarGoal,
      sugarConsumed,
      sugarBar,
      saltGoal,
      saltConsumed,
      saltBar,
      bmiOutput,
      bmiBar,
      bmiBarColor,
    });
  }, [weight, height, age, activityLevel, gender, goal]);

  const renderContent = () => {
    if (!weight || !height || !age) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 18, textAlign: "center" }}>
            Vyplň si svoj profil, aby si videl/-a prehľad!
          </Text>
          <Pressable
            style={{
              marginTop: 15,
              backgroundColor: "#4CAF50",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
            onPress={() => navigation.navigate("ProfileCompletition")}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Vyplniť profil</Text>
          </Pressable>
        </View>
      );
    }

    switch (activeTab) {
      case 1:
        return <OverviewTab {...overviewData} currentDate={currentDate} />;
      case 2:
        return <RecipesTab />;
      case 3:
        return <PantryTab
          mealBox={mealBox}
          removeMealBox={removeMealBox}
          removeProduct={removeProduct}
          refreshMealBoxes={refreshMealBoxes}
        />;
      case 4:
        return <SettingsTab setIsLoggedIn={setIsLoggedIn} navigation={navigation} />;
      default:
        return <Text>Oops, niečo sa pokazilo</Text>;
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
            <View style={styles.navBar_Add_container}>
              <Image source={plus} style={styles.navBar_Add} />
            </View>
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

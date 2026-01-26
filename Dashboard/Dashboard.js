// Dashboard.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RecipesTab from "./tabs/RecipesTab";
import PantryTab from "./tabs/PantryTab";
import SettingsTab from "./tabs/SettingsTab";
import styles from "../styles";
import logo from "../assets/logo.png";
import plus from "../assets/plus.png";
import recipes from "../assets/recipe-book.png";
import setting from "../assets/settings.png";
import storage from "../assets/storage.png";
import speedometer from "../assets/speedometer.png";
import account from "../assets/avatar.png";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardWrapper from "../KeyboardWrapper";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [mealBox, setMealBox] = useState([]);
  const [eatenLoaded, setEatenLoaded] = useState(false);
  const [overviewData, setOverviewData] = useState({});
  const [currentDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  });
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

  const renderNutriItem = (label, valueConsumed, valueGoal, barPercent) => (
    <View style={styles.nutriDisplay}>
      <Text style={styles.nutriDisplay_text}>{label}</Text>
      <View style={styles.caloriesBarContainer}>
        <View
          style={[
            styles.caloriesBar,
            {
              width: `${barPercent}%`,
              backgroundColor: barPercent >= 100 ? "#FF3B30" : "#4CAF50",
            },
          ]}
        />
      </View>
      <Text style={{ color: "white", marginBottom: 5 }}>
        {valueConsumed} / {valueGoal} g
      </Text>
    </View>
  );

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

  const options = [
    { label: "Malý pohár / šálka ", description: "150 ml" },
    { label: "Stredný pohár / šálka", description: "250 ml" },
    { label: "Veľký pohár / hrnček", description: "350 ml" },
    { label: "Fľaša", description: "500 ml" },
  ];

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

          // server fallback: only if AsyncStorage doesn't have usable totals
          if (email && !hasLocalTotals) {
            try {
              const response = await fetch(
                `${SERVER_URL}/api/getDailyConsumption?email=${email}&date=${new Date().toISOString().slice(0, 10)}`,
              );
              if (response.ok) {
                const data = await response.json();
                if (data?.totals) {
                  totals = mergeTotalsPreferLocal(totals, data.totals);
                }
              }
            } catch (err) {
              console.error(
                "Error fetching daily consumption from server:",
                err,
              );
            }

            // fetch products fallback
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

  // --- OVERVIEW CALCULATIONS (uses eatenTotals including drunkWater) ---
  useEffect(() => {
    if (
      !profileLoaded ||
      !weight ||
      !height ||
      !age ||
      !activityLevel ||
      !gender
    )
      return;

    const { calories, proteins, carbs, fat, fiber, sugar, salt, drunkWater } =
      eatenTotals;

    let cal;
    if (gender === "male")
      cal = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
    else cal = (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;

    if (goal === "lose") cal -= 500;
    else if (goal === "gain") cal += 500;

    const progressBar = Math.min((calories / cal) * 100, 100);
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput;
    if (calories < cal)
      eatOutput = `Ešte ti chýba ${Math.round(cal - calories)} kcal`;
    else if (calories === cal)
      eatOutput = "Dostal/-a si sa na svoj denný cieľ!";
    else eatOutput = `Prekročil/a si cieľ o ${Math.round(calories - cal)} kcal`;

    const proteinGoal = ((cal * 0.13) / 4).toFixed(0);
    const carbGoal = ((cal * 0.65) / 4).toFixed(0);
    const fatGoal = ((cal * 0.23) / 9).toFixed(0);
    const fiberGoal = ((cal / 1000) * 14).toFixed(0);
    const sugarGoal = ((cal * 0.075) / 4).toFixed(0);
    const saltGoal = 5;
    const waterGoal = 33 * weight;

    const proteinBar = (proteins / proteinGoal) * 100;
    const carbBar = (carbs / carbGoal) * 100;
    const fatBar = (fat / fatGoal) * 100;
    const fiberBar = (fiber / fiberGoal) * 100;
    const sugarBar = (sugar / sugarGoal) * 100;
    const saltBar = (salt / saltGoal) * 100;
    const waterBar = (drunkWater / waterGoal) * 100;

    const bmiValue = ((weight / (height * height)) * 10000).toFixed(1);
    let bmiOutput = "",
      bmiBarColor = "#4CAF50";
    if (bmiValue < 18.5) {
      bmiOutput = `BMI: ${bmiValue}\nPodváha`;
      bmiBarColor = "#2196F3";
    } else if (bmiValue < 25) bmiOutput = `BMI: ${bmiValue}\nNormálna váha`;
    else if (bmiValue < 30) {
      bmiOutput = `BMI: ${bmiValue}\nNadváha`;
      bmiBarColor = "#FF9800";
    } else {
      bmiOutput = `BMI: ${bmiValue}\nObezita`;
      bmiBarColor = "#FF3B30";
    }

    const bmiBar = (bmiValue / 40) * 100;

    setOverviewData({
      caloriesGoal: cal,
      caloriesConsumed: calories,
      progressBar,
      barColor,
      eatOutput,
      eatenOutput: `${Math.round(calories)} / ${Math.round(cal)} kcal`,
      proteinGoal,
      proteinConsumed: Number(proteins).toFixed(0),
      proteinBar,
      carbGoal,
      carbConsumed: Number(carbs).toFixed(0),
      carbBar,
      fatGoal,
      fatConsumed: Number(fat).toFixed(0),
      fatBar,
      fiberGoal,
      fiberConsumed: Number(fiber).toFixed(0),
      fiberBar,
      sugarGoal,
      sugarConsumed: Number(sugar).toFixed(0),
      sugarBar,
      saltGoal,
      saltConsumed: Number(salt).toFixed(0),
      saltBar,
      bmiOutput,
      bmiBar,
      bmiBarColor,
      waterGoal,
      drunkWater,
      waterBar,
    });
  }, [
    weight,
    height,
    age,
    activityLevel,
    gender,
    goal,
    eatenTotals,
    profileLoaded,
  ]);

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

  // --- ADD WATER (updates eatenTotals.drunkWater) ---
  const addWater = () => {
    let water = 0;
    switch (selectedOption) {
      case "Malý pohár / šálka ":
        water = 150;
        break;
      case "Stredný pohár / šálka":
        water = 250;
        break;
      case "Veľký pohár / hrnček":
        water = 350;
        break;
      case "Fľaša":
        water = 500;
        break;
      default:
        water = 0;
    }

    setEatenTotals((prev) => ({
      ...prev,
      drunkWater: (prev.drunkWater || 0) + water,
    }));

    setModalVisible(false);
  };

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
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Vyplniť profil
            </Text>
          </Pressable>
        </View>
      );
    }

    switch (activeTab) {
      case 1:
        return (
          <>
            <View style={styles.caloriesDisplay}>
              <Text style={styles.dateText}>{currentDate}</Text>
              <Text style={{ color: "white", marginTop: 20 }}>
                {overviewData.eatOutput}
              </Text>

              <View style={styles.caloriesBarContainer}>
                <View
                  style={[
                    styles.caloriesBar,
                    {
                      width: `${overviewData.progressBar}%`,
                      backgroundColor: overviewData.barColor,
                    },
                  ]}
                />
              </View>
              <Text style={{ color: "white", marginTop: 14 }}>
                {overviewData.eatenOutput}
              </Text>
            </View>

            <View style={styles.nutriDisplay_container}>
              <View style={{ flexDirection: "row" }}>
                {renderNutriItem(
                  "Bielkoviny",
                  overviewData.proteinConsumed,
                  overviewData.proteinGoal,
                  overviewData.proteinBar,
                )}
                {renderNutriItem(
                  "Sacharidy",
                  overviewData.carbConsumed,
                  overviewData.carbGoal,
                  overviewData.carbBar,
                )}
                {renderNutriItem(
                  "Tuky",
                  overviewData.fatConsumed,
                  overviewData.fatGoal,
                  overviewData.fatBar,
                )}
              </View>
              <View style={{ flexDirection: "row" }}>
                {renderNutriItem(
                  "Vláknina",
                  overviewData.fiberConsumed,
                  overviewData.fiberGoal,
                  overviewData.fiberBar,
                )}
                {renderNutriItem(
                  "Soľ",
                  overviewData.saltConsumed,
                  overviewData.saltGoal,
                  overviewData.saltBar,
                )}
                {renderNutriItem(
                  "Cukry",
                  overviewData.sugarConsumed,
                  overviewData.sugarGoal,
                  overviewData.sugarBar,
                )}
              </View>
            </View>

            <View style={styles.bmiContainer}>
              <Text style={{ color: "white" }}>
                {overviewData.drunkWater} / {overviewData.waterGoal} ml
              </Text>
              <View style={styles.caloriesBarContainer}>
                <View
                  style={[
                    styles.caloriesBar,
                    {
                      width: `${overviewData.waterBar}%`,
                      backgroundColor: "#2cdba1",
                    },
                  ]}
                />
              </View>

              <Pressable
                backgroundColor="green"
                padding={5}
                borderRadius={20}
                marginTop={5}
                onPress={() => setModalVisible(true)}
              >
                <Image source={plus} style={{ width: 20, height: 20 }} />
              </Pressable>

              {/* Modal s radio buttonmi */}
              <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      padding: 20,
                      borderRadius: 10,
                      width: "80%",
                    }}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 10 }}>
                      Vyber možnosť
                    </Text>

                    {options.map((opt) => (
                      <TouchableOpacity
                        key={opt.label}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginVertical: 5,
                        }}
                        onPress={() => setSelectedOption(opt.label)}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#000",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 10,
                          }}
                        >
                          {selectedOption === opt.label && (
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: "#4CAF50",
                              }}
                            />
                          )}
                        </View>
                        <View>
                          <Text style={{ fontWeight: "bold" }}>
                            {opt.label}
                          </Text>
                          <Text style={{ color: "#555" }}>
                            {opt.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    <Pressable
                      style={{
                        marginTop: 15,
                        backgroundColor: "#4CAF50",
                        padding: 10,
                        borderRadius: 5,
                      }}
                      onPress={() => {
                        setModalVisible(false);
                        addWater();
                      }}
                    >
                      <Text style={{ color: "white", textAlign: "center" }}>
                        Potvrdiť
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
            </View>

            {/* BMI zobrazenie */}
            <View style={styles.bmiContainer}>
              <Text style={{ color: "white", textAlign: "center" }}>
                {overviewData.bmiOutput}
              </Text>
              <View style={styles.caloriesBarContainer}>
                <View
                  style={[
                    styles.caloriesBar,
                    {
                      width: `${overviewData.bmiBar}%`,
                      backgroundColor: overviewData.bmiBarColor,
                    },
                  ]}
                />
              </View>
            </View>
          </>
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
          <SettingsTab setIsLoggedIn={setIsLoggedIn} navigation={navigation} />
        );
      default:
        return <Text>Oops, niečo sa pokazilo</Text>;
    }
  };

  return (
    <>
      <View style={styles.topBar}>
        <Image source={logo} style={styles.topBar_img} />
        <Text style={styles.topBar_text}>Ahoj {nick}</Text>
        <Image source={account} style={styles.topBar_img} />
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {renderContent()}
        </ScrollView>

        <View style={styles.navBar}>
          <Pressable
            onPress={() => setActiveTab(1)}
            style={[
              styles.navBar_tabs,
              isActive(1) && styles.navBar_tabs_pressed,
            ]}
          >
            <Image source={speedometer} style={styles.navBar_img} />
            <Text
              style={[
                styles.navBar_text,
                isActive(1) && styles.navBar_text_pressed,
              ]}
            >
              Prehľad
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(2)}
            style={[
              styles.navBar_tabs,
              isActive(2) && styles.navBar_tabs_pressed,
            ]}
          >
            <Image source={recipes} style={styles.navBar_img} />
            <Text
              style={[
                styles.navBar_text,
                isActive(2) && styles.navBar_text_pressed,
              ]}
            >
              Recepty
            </Text>
          </Pressable>
          <Pressable
            style={styles.navBar_tab_Add}
            onPress={() => navigation.navigate("CameraScreen")}
          >
            <View style={styles.navBar_Add_container}>
              <Image source={plus} style={styles.navBar_Add} />
            </View>
            <Text style={styles.navBar_text_Add}>Pridať</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(3)}
            style={[
              styles.navBar_tabs,
              isActive(3) && styles.navBar_tabs_pressed,
            ]}
          >
            <Image source={storage} style={styles.navBar_img} />
            <Text
              style={[
                styles.navBar_text,
                isActive(3) && styles.navBar_text_pressed,
              ]}
            >
              Špajza
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(4)}
            style={[
              styles.navBar_tabs,
              isActive(4) && styles.navBar_tabs_pressed,
            ]}
          >
            <Image source={setting} style={styles.navBar_img} />
            <Text
              style={[
                styles.navBar_text,
                isActive(4) && styles.navBar_text_pressed,
              ]}
            >
              Nastavenia
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

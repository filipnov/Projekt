  //Dashboard.js
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
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [drunkWater, setDrunkWater] = useState(0);
    //const [weightOverview, setWeightOverview] = useState();

    // Funkcia na výpočet medicínsky/logicky korektného cieľa pitného režimu.
    // Vracia cieľ v ml (aby sedel s UI, ktoré zobrazuje ml).
    function calculateWaterGoal(weightKg, heightCm, genderValue) {
      const w = Number(weightKg);
      const h = Number(heightCm);
      if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) {
        return genderValue === "male" ? 2500 : 2000;
      }

      // BMI musí byť tá istá hodnota ako v UI (toFixed(1)).
      const bmiFromUi = Number(((w / (h * h)) * 10000).toFixed(1));
      const bmi = Number.isFinite(bmiFromUi) ? bmiFromUi : w / ((h / 100) * (h / 100));

      const heightM = h / 100;

      // Ideálna hmotnosť (BMI = 22)
      const idealWeight = 22 * heightM * heightM;

      // Upravená hmotnosť (ABW) pri nadváhe/obezite, aby cieľ nebol zbytočne prestrelený.
      // - nadváha (BMI 25–29.9): 25% rozdielu
      // - obezita (BMI >= 30): 40% rozdielu
      let usedWeight = w;
      if (bmi >= 30) {
        usedWeight = idealWeight + 0.4 * (w - idealWeight);
      } else if (bmi >= 25) {
        usedWeight = idealWeight + 0.25 * (w - idealWeight);
      }

      // Základ: 30–35 ml/kg/deň. Konzervatívne držíme 35 pri normále/podváhe,
      // a 30 pri nadváhe/obezite (keď už aj tak používame upravenú hmotnosť).
      const mlPerKg = bmi < 25 ? 35 : 30;
      let waterMl = usedWeight * mlPerKg;

      // Minimálne odporúčanie (prakticky použiteľný spodný limit)
      const minWater = genderValue === "male" ? 2500 : 2000;
      if (waterMl < minWater) waterMl = minWater;

      // Zaokrúhlenie na 50 ml, aby to dávalo zmysel v UI.
      return Math.round(waterMl / 50) * 50;
    }

    const options = [
      { label: "Malý pohár / šálka ", description: "150 ml" },
      { label: "Stredný pohár / šálka", description: "250 ml" },
      { label: "Veľký pohár / hrnček", description: "350 ml" },
      { label: "Fľaša", description: "500 ml" },
    ];

    let water;

    const addWater = () => {
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
      setDrunkWater((prev) => prev + water);
      setModalVisible(false);
    };

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

    const [nick, setNick] = useState("User");
    const [email, setEmail] = useState(null);
    const [age, setAge] = useState(null);
    const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [gender, setGender] = useState(null);
    const [goal, setGoal] = useState(null);
    const [activityLevel, setActivityLevel] = useState(null);

    const waterGoal = calculateWaterGoal(weight, height, gender);
    const waterBar = waterGoal > 0 ? Math.min((drunkWater / waterGoal) * 100, 100) : 0;

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

    const [eatenLoaded, setEatenLoaded] = useState(false);

    useEffect(() => {
      if (!eatenLoaded) return;
      if (!email) return;

    const pushConsumedToDB = async () => {
      try {
        await fetch("http://10.0.2.2:3000/api/updateDailyConsumption", {
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
    }, [eatenTotals, drunkWater, eatenLoaded, email]);

    const [overviewData, setOverviewData] = useState({});

    const formatDateSK = () => {
      const d = new Date();
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    };

    const [currentDate] = useState(formatDateSK());

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
          }
        }

        reloadProfileFromStorage();
      }, []),
    );

  const fetchUserProducts = async () => {
    if (!email) return [];
    try {
      const response = await fetch(
        `http://10.0.2.2:3000/api/getProducts?email=${email}`,
      );
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
            const storedLastDate = await AsyncStorage.getItem("lastEatenDate");
            const storedWater = await AsyncStorage.getItem("drunkWater");
            const storedLastWaterDate =
              await AsyncStorage.getItem("lastWaterDate");
            const today = formatDateSK();

            const hasWaterInAsyncForToday =
              storedLastWaterDate === today && storedWater !== null;

            if (storedMealBox) setMealBox(JSON.parse(storedMealBox));
            if (storedLastDate !== today) {
              const initialTotals = {
                calories: 0,
                proteins: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sugar: 0,
                salt: 0,
              };
              setEatenTotals(initialTotals);
              await AsyncStorage.setItem(
                "eatenTotals",
                JSON.stringify(initialTotals),
              );
              await AsyncStorage.setItem("lastEatenDate", today);
            } else if (storedTotals) {
              setEatenTotals(JSON.parse(storedTotals));
            }

            if (storedLastWaterDate !== today) {
              setDrunkWater(0);
              await AsyncStorage.setItem("drunkWater", "0");
              await AsyncStorage.setItem("lastWaterDate", today);
            } else if (storedLastWaterDate === null && storedWater !== null) {
              setDrunkWater(Number(storedWater) || 0);
              await AsyncStorage.setItem("lastWaterDate", today);
            } else if (storedWater !== null) {
              setDrunkWater(Number(storedWater) || 0);
            }

            // mark that we finished loading eatenTotals from storage
            setEatenLoaded(true);

            // Fetch server products and merge without overwriting local
            if (email) {
              if (!hasWaterInAsyncForToday) {
                try {
                  const response = await fetch(
                    `http://10.0.2.2:3000/api/getDailyConsumption?email=${email}&date=${new Date().toISOString().slice(0, 10)}`,
                  );
                  if (response.ok) {
                    const data = await response.json();
                    const dbWater = Number(data?.totals?.drunkWater);
                    if (!Number.isNaN(dbWater)) {
                      setDrunkWater((prev) => Math.max(prev || 0, dbWater || 0));
                    }
                  }
                } catch (err) {
                  console.error("Fetch daily consumption error:", err);
                }
              }

              const products = await fetchUserProducts();
              if (products && products.length > 0) {
                setMealBox((prev) => {
                  const newProducts = products.filter(
                    (p) => !prev.some((b) => b.name === p.name),
                  );
                  return [
                    ...prev,
                    ...newProducts.map((p) => ({
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
                    })),
                  ];
                });
              }
            }
          } catch (err) {
            console.error("Error loading stored data:", err);
          }
        }

        loadStoredData();
      }, [email]),
    );

    // Save mealBox and eatenTotals to AsyncStorage
    useEffect(() => {
      AsyncStorage.setItem("mealBox", JSON.stringify(mealBox));
    }, [mealBox]);

    useEffect(() => {
      if (!eatenLoaded) return;
      AsyncStorage.setItem("eatenTotals", JSON.stringify(eatenTotals));
    }, [eatenTotals, eatenLoaded]);

    useEffect(() => {
      if (!eatenLoaded) return;
      const d = new Date();
      const today = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
      AsyncStorage.setItem("drunkWater", String(drunkWater));
      AsyncStorage.setItem("lastWaterDate", today);
    }, [drunkWater, eatenLoaded]);

  // Remove product from server
  const removeProduct = async (productId) => {
    try {
      await fetch("http://10.0.2.2:3000/api/removeProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });
    } catch (err) {
      console.error("Error removing product:", err);
    }
  };

    // Remove from mealBox and update eatenTotals
    const removeMealBox = (id, productId, box) => {
      setMealBox((prev) => prev.filter((b) => b.id !== id));
      removeProduct(productId);
      addEatenValues(box);
    };

    const addEatenValues = (box) => {
      setEatenTotals((prev) => {
        const updated = {
          calories: prev.calories + (box.totalCalories || 0),
          proteins: prev.proteins + (box.totalProteins || 0),
          carbs: prev.carbs + (box.totalCarbs || 0),
          fat: prev.fat + (box.totalFat || 0),
          fiber: prev.fiber + (box.totalFiber || 0),
          sugar: prev.sugar + (box.totalSugar || 0),
          salt: prev.salt + (box.totalSalt || 0),
        };
        return updated;
      });
    };

    // Calculate overview data
    useEffect(() => {
      if (!weight || !height || !age || !activityLevel || !gender) return;

      const { calories, proteins, carbs, fat, fiber, sugar, salt } = eatenTotals;

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

      const proteinBar = (proteins / proteinGoal) * 100;
      const carbBar = (carbs / carbGoal) * 100;
      const fatBar = (fat / fatGoal) * 100;
      const fiberBar = (fiber / fiberGoal) * 100;
      const sugarBar = (sugar / sugarGoal) * 100;
      const saltBar = (salt / saltGoal) * 100;

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
                <Text style={{ color: "white", marginBottom: 14 }}>
                  {overviewData.eatenOutput}
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
                <Text style={{ color: "white", marginBottom: 20 }}>
                  {overviewData.eatOutput}
                </Text>
                <Text style={styles.dateText}>{currentDate}</Text>
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

              {/* Pitný režim s plus */}
              <View style={styles.bmiContainer}>
                <Text style={{ color: "white" }}>
                  {drunkWater} / {waterGoal} ml
                </Text>
                <View style={styles.caloriesBarContainer}>
                  <View
                    style={[
                      styles.caloriesBar,
                      { width: `${waterBar}%`, backgroundColor: "#2cdba1" },
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
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Image source={logo} style={styles.topBar_img} />
          <Text style={styles.topBar_text}>Ahoj {nick}</Text>
          <Image source={account} style={styles.topBar_img} />
        </View>

        <View style={styles.contentContainer}>
          <ScrollView>{renderContent()}</ScrollView>

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
      </View>
    );
  }

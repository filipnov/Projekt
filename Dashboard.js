// Dashboard.js
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import logo from "./assets/logo.png";
import plus from "./assets/plus.png";
import recipes from "./assets/recipe-book.png";
import setting from "./assets/settings.png";
import storage from "./assets/storage.png";
import speedometer from "./assets/speedometer.png";
import account from "./assets/avatar.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";

export default function Dashboard({ setIsLoggedIn }) {
  const navigation = useNavigation();
  const route = useRoute();

  // Keep track of which tab is active (1–4)
  const [activeTab, setActiveTab] = useState(1);
  useEffect(() => {
    if (route.params?.startTab) {
      setActiveTab(route.params.startTab);
    }
  }, [route.params?.startTab]);

  // Function to check if tab is active
  const isActive = (tabIndex) => activeTab === tabIndex;

  const [age, setAge] = useState(null);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [gender, setGender] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nick, setNick] = useState("User");

  const [userProducts, setUserProducts] = useState([]);
  const [email, setEmail] = useState(null);


  useEffect(() => {
    async function loadEmailAndNick(){
      try{
      const savedNick = await AsyncStorage.getItem("userNick");
      if(savedNick){
        setNick(savedNick);
      }
      const savedEmail = await AsyncStorage.getItem("userEmail");
      if (savedEmail) setEmail(savedEmail);
      }
      catch (error){
        console.error("Error loading nick: ", error);
      }
    }
    loadEmailAndNick();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try { 
        const profileString = await AsyncStorage.getItem("userProfile");

        if (profileString) {
          const data = JSON.parse(profileString);
          setAge(data.age);
          setWeight(data.weight);
          setHeight(data.height);
          setGender(data.gender);
          setGoal(data.goal);
          setActivityLevel(data.activityLevel);
          return;
        } 
      } catch (err) {
        console.log("Chyba pri načítaní profilu z AsyncStorage:", err);
      }

      try{
        if (!email) return;
        const response = await fetch(`http://10.0.2.2/api/userProfile?email=${email}`);
        const data = await response.json();
        
        if (response.ok){
          setAge(data.age);
        setWeight(data.weight);
        setHeight(data.height);
        setGender(data.gender);
        setGoal(data.goal);
        setActivityLevel(data.activityLevel);

        await AsyncStorage.setItem("userProfile", JSON.stringify(data));
        }else{
          console.warn("Nepodarilo sa načítať profil zo servera:", data.error);
        }
      }
      catch (err){
          console.error("Chyba pri načítaní profilu zo servera:", err);
      }
      finally{
        setLoading(false);
      }
    }

    loadProfile();
  }, [email]);

  let manFormula;
  let womanFormula;
  if (weight && height && age && activityLevel && gender) {
    if (gender === "male") {
      manFormula = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
      caloriesGoal = manFormula.toFixed(0);
    } else {
      womanFormula =
        (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;
      caloriesGoal = womanFormula.toFixed(0);
    }

    if (goal === "lose") {
      caloriesGoal = Number(caloriesGoal) - 500;
    } else if (goal === "gain") {
      caloriesGoal = Number(caloriesGoal) + 500;
    } else {
      caloriesGoal = Number(caloriesGoal);
    }

    caloriesConsumed = 500;
    progressBar = (caloriesConsumed / caloriesGoal) * 100;

    barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    eatenOutput = `${caloriesConsumed} / ${caloriesGoal} kcal`;
    if (progressBar < 100) {
      eatOutput = `Ešte ti chýba ${caloriesGoal - caloriesConsumed} kcal`;
    } else if (progressBar === 100) {
      eatOutput = "Dostal/-a si sa na svoj denný cieľ!";
    } else {
      eatOutput = `Prekročil/a si svoj denný cieľ o ${
        caloriesConsumed - caloriesGoal
      } kcal`;
    }

    fatGoal = ((caloriesGoal * 0.23) / 9).toFixed(0); //23% of calories from fat
    carbGoal = ((caloriesGoal * 0.65) / 4).toFixed(0); //65% of calories from carbs
    proteinGoal = ((caloriesGoal * 0.13) / 4).toFixed(0); //13% of calories from protein
    fiberGoal = ((caloriesGoal / 1000) * 14).toFixed(0); //14g of fiber every 1000 kcal
    sugarGoal = ((caloriesGoal * 0.075) / 4).toFixed(0); //7,5% of calories from sugar
    saltGoal = 5; //Strictly set by WHO

    proteinConsumed = 80;
    carbConsumed = 300;
    fatConsumed = 20;
    fiberConsumed = 20;
    saltConsumed = 4;
    sugarConsumed = 14;

    proteinBar = ((proteinConsumed / proteinGoal) * 100).toFixed(0);
    carbBar = ((carbConsumed / carbGoal) * 100).toFixed(0);
    fatBar = ((fatConsumed / fatGoal) * 100).toFixed(0);
    fiberBar = ((fiberConsumed / fiberGoal) * 100).toFixed(0);
    saltBar = ((saltConsumed / saltGoal) * 100).toFixed(0);
    sugarBar = ((sugarConsumed / sugarGoal) * 100).toFixed(0);

    bmi = ((weight / (height * height)) * 10000).toFixed(1);

    if (bmi < 18.5) {
      bmiOutput = `BMI: ${bmi} \nPodváha`;
      bmiBarColor = "#2196F3";
    } else if (bmi < 25) {
      bmiOutput = `BMI: ${bmi} \nNormálna váha`;
      bmiBarColor = "#4CAF50";
    } else if (bmi < 30) {
      bmiOutput = `BMI: ${bmi} \nNadváha`;
      bmiBarColor = "#FF9800";
    } else if (bmi < 35) {
      bmiOutput = `BMI: ${bmi} \nObezita (I. stupeň)`;
      bmiBarColor = "#FF3B30";
    } else if (bmi < 40) {
      bmiOutput = `BMI: ${bmi} \nObezita (II. stupeň)`;
      bmiBarColor = "#D32F2F";
    } else {
      bmiOutput = `BMI: ${bmi} \nObezita (III. stupeň) — ťažká obezita`;
      bmiBarColor = "#B00020";
    }

    bmiBar = ((bmi / 40) * 100).toFixed(0); // Assuming 40 as max BMI for bar representation
  } else {
    eatOutput = "Dokonči svoj profil pre výpočet kalórií.";
    eatenOutput = "— / — kcal";
    fatConsumed = "—";
    proteinConsumed = "—";
    proteinGoal = "—";
    carbConsumed = "—";
    carbGoal = "—";
    fatGoal = "—";
    bmiOutput = "Dokonči svoj profil pre výpočet BMI.";
  }

  let eatOutput,
    eatenOutput,
    progressBar,
    caloriesGoal,
    caloriesConsumed,
    barColor,
    fatConsumed,
    carbConsumed,
    proteinConsumed,
    fatGoal,
    carbGoal,
    proteinGoal,
    proteinBar,
    carbBar,
    fatBar,
    bmi,
    bmiOutput,
    bmiBar,
    bmiBarColor,
    fiberGoal,
    fiberConsumed,
    fiberBar,
    sugarGoal,
    sugarConsumed,
    sugarBar,
    saltGoal,
    saltConsumed,
    saltBar,
    mealName;

  let currentDate = Date.now();

  const [mealBox, setMealBox] = useState([]);
  const [meal, setMeal] = useState();

  async function fetchUserProducts() {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) {
        console.log("❌ No email stored!");
        return [];
      }

      console.log("📧 Using email:", email);

      const response = await fetch(
        `http://10.0.2.2:3000/api/getProducts?email=${email}`
      );
      const data = await response.json();

      console.log("📦 Raw response from server:", data);

      if (!data.success) {
        console.log("❌ Server error:", data.error);
        return [];
      }

      // uložíme do stavu pre rýchly prístup
      setUserProducts(data.products || []);
      return data.products || [];
    } catch (error) {
      console.log("⚠️ Fetch error:", error);
      return [];
    }
  }

  // zavoláme fetch raz pri mountnutí, aby sme mali produkty v stave
  useEffect(() => {
    fetchUserProducts().catch((err) =>
      console.log("fetchUserProducts error:", err)
    );
    refreshMealBoxes();
  }, []);

  /*
  async function createMealBox() {
    const products = await fetchUserProducts();
    if (!products || products.length === 0) {
      alert("Zatiaľ si nič nenaskenoval!");
      return;
    }

    const index = mealBox.length % products.length;
    const productName = products[index]?.name ?? `Produkt ${index + 1}`;

    if (mealBox.some((box) => box.name === productName)) {
      alert("Tento produkt už je v špajzi!");
      return;
    }

    setMealBox((prev) => [
      ...prev,
      {
        id: Date.now(),
        width: "100%",
        name: productName,
      },
    ]);
  }
*/
  
  async function refreshMealBoxes() {
    const products = await fetchUserProducts();
    if (!products || products.length === 0) {
      alert("Ešte si nenaskenoval žiaden produkt");
      return;
    }

    const newProducts = products.filter(
      (p) => !mealBox.some((box) => box.name === p.name)
    );

    if (newProducts.length === 0) {
      alert("Všetky produkty už sú v jedálničku!");
      return;
    }

    setMealBox((prev) => [
      ...prev,
      ...newProducts.map((p) => ({
        id: Date.now() + Math.random(), // unikátny id
        width: "100%",
        name: p.name,
      })),
    ]);
  }

 async function removeProduct(productName) {
try{
  await fetch("http://10.0.2.2:3000/api/removeProduct", {
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify({
      email: email,
      name: productName,
    })
  })
}
catch (err){
  console.error("Error removing product:", err);
}
  }
function removeMealBox(id) {
   setMealBox(mealBox.filter((box) => box.id !== id));
   refreshMealBoxes();
}

  

  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <>
            <View style={styles.caloriesDisplay}>
              <Text style={{ color: "white", marginBottom: 14 }}>
                {eatenOutput}
              </Text>
              <View style={styles.caloriesBarContainer}>
                <View
                  style={[
                    styles.caloriesBar,
                    { width: `${progressBar}%` },
                    { backgroundColor: barColor },
                  ]}
                />
              </View>
              <Text style={{ color: "white", marginBottom: 20 }}>
                {eatOutput}
              </Text>
              <Text style={styles.dateText}>
                {new Date(currentDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.nutriDisplay_container}>
              {/* prvý riadok (bielkoviny, sacharidy, tuky) */}
              <View style={{ flexDirection: "row" }}>
                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Bielkoviny:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${proteinBar}%` },
                        {
                          backgroundColor:
                            proteinBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {proteinConsumed} / {proteinGoal} g
                  </Text>
                </View>

                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Sacharidy:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${carbBar}%` },
                        {
                          backgroundColor:
                            carbBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {carbConsumed} / {carbGoal} g
                  </Text>
                </View>

                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Tuky:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${fatBar}%` },
                        {
                          backgroundColor:
                            fatBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {fatConsumed} / {fatGoal} g
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Vláknina:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${fiberBar}%` },
                        {
                          backgroundColor:
                            fiberBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {fiberConsumed} / {fiberGoal} g
                  </Text>
                </View>

                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Soľ:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${saltBar}%` },
                        {
                          backgroundColor:
                            saltBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {saltConsumed} / {saltGoal} g
                  </Text>
                </View>

                <View style={styles.nutriDisplay}>
                  <Text style={styles.nutriDisplay_text}>Cukry:</Text>
                  <View style={styles.caloriesBarContainer}>
                    <View
                      style={[
                        styles.caloriesBar,
                        { width: `${sugarBar}%` },
                        {
                          backgroundColor:
                            sugarBar >= 100 ? "#FF3B30" : "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: "white", marginBottom: 5 }}>
                    {sugarConsumed} / {sugarGoal} g
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bmiContainer}>
              <Text style={{ color: "white", textAlign: "center" }}>
                {bmiOutput}
              </Text>
              <View style={styles.caloriesBarContainer}>
                <View
                  style={[
                    styles.caloriesBar,
                    { width: `${bmiBar}%` },
                    {
                      backgroundColor: bmiBarColor,
                    },
                  ]}
                />
              </View>
            </View>
          </>
        );

      case 2:
        return <Text>Tu budu receptyy</Text>;

      case 3:
        return (
          <>
            <View style={styles.mealBox}>
              <Pressable onPress={refreshMealBoxes}>
                <Text
                  style={{
                    color: "black",
                    backgroundColor: "yellow",
                    borderRadius: 20,
                    width: "40%",
                    textAlign: "center",
                    alignSelf: "center",
                    padding: 10,
                    marginTop: 10,
                  }}
                >
                  Obnoviť
                </Text>
              </Pressable>

              <ScrollView style={styles.mealContainer}>
                <View style={styles.row}>
                  {mealBox.map((box) => (
                    <View key={box.id} style={styles.box}>
                      <Text style={styles.text}>{box.name}</Text>
                      <View>
                        <Pressable onPress={() => {
                          removeMealBox(box.id)
                          removeProduct(box.name)}}>
                          <Text>Odstrániť</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        );

      case 4:
        return (
          <>
            <Pressable
              onPress={() => {
                setIsLoggedIn(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "HomeScreen" }],
                });
              }}
              style={({ pressed }) =>
                pressed ? styles.logout_button_pressed : styles.logout_button
              }
            >
              <Text style={styles.logout_button_text}>Odhlásiť sa</Text>
            </Pressable>
          </>
        );

      default:
        return <Text>Oops, niečo sa pokazilo</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar with logo, nickname, and avatar */}
      <View style={styles.topBar}>
        <Image source={logo} style={styles.topBar_img} />
        <Text style={styles.topBar_text}>Ahoj {nick}</Text>
        <Pressable onPress={() => navigation.navigate("ProfileCompletition")}>
          <Image source={account} style={styles.topBar_img} />
        </Pressable>
      </View>

      {/*Content container*/}
      <View style={styles.contentContainer}>
        {/*Main content*/}
        <ScrollView>{renderContent()}</ScrollView>

        {/*Nav bar*/}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => setActiveTab(1)}
            style={[
              styles.navBar_tabs,
              isActive(1) && styles.navBar_tabs_pressed,
            ]}
          >
            <Image source={speedometer} style={styles.navBar_img}></Image>
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
            <Image source={recipes} style={styles.navBar_img}></Image>
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
              <Image source={plus} style={styles.navBar_Add}></Image>
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
            <Image source={storage} style={styles.navBar_img}></Image>
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
            <Image source={setting} style={styles.navBar_img}></Image>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    height: "auto",
  },
  topBar: {
    backgroundColor: "hsl(0, 0%, 95%)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
    elevation: 10,
    borderBottomRightRadius: 25,
    borderColor: "black",
    borderWidth: 1,
  },
  topBar_text: {
    marginTop: 50,
    fontSize: 30,
    fontWeight: "bold",
  },
  topBar_img: {
    height: 60,
    width: 60,
    marginTop: 50,
    backgroundColor: "white",
    borderRadius: 10,
  },
  navBar: {
    width: "100%",
    height: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navBar_tabs: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 0.7,
  },
  navBar_tab_Add: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    transform: [{ translateY: -10 }],
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderLeftColor: "black",
    borderLeftWidth: 1,
    borderRightColor: "black",
    borderRightWidth: 1,
  },
  navBar_tabs_pressed: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 1,
  },
  navBar_img: {
    width: 30,
    height: 30,
  },
  navBar_Add: {
    width: 20,
    height: 20,
  },
  navBar_Add_container: {
    width: 45,
    height: 45,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  navBar_text: {
    fontSize: 11,
    color: "black",
  },
  navBar_text_pressed: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "black",
  },
  navBar_text_Add: {
    fontSize: 15,
    fontWeight: "900",
    color: "black",
  },
  contentContainer: {
    height: 791.5,
    justifyContent: "space-between",
  },
  caloriesDisplay: {
    marginTop: 20,
    backgroundColor: "#1E1E1E",
    width: "90%",
    height: 170,
    borderRadius: 15,
    alignSelf: "center",
    alignItems: "center",
    flexDirection: "column-reverse",
  },
  dateText: {
    color: "white",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 27,
  },
  // change percent height to fixed px for reliable rendering
  caloriesBarContainer: {
    backgroundColor: "white",
    overflow: "hidden",
    width: "90%",
    height: 12,
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 10,
    margin: 10,
  },
  caloriesBar: {
    height: "100%",
    alignSelf: "flex-start",
  },
  nutriDisplay_container: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 5,
    borderRadius: 15,
    flexDirection: "column",
    paddingVertical: 8,
  },
  nutriDisplay: {
    backgroundColor: "#1E1E1E",
    height: 100,
    width: 115,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  nutriDisplay_text: {
    color: "white",
    alignSelf: "center",
    marginTop: 10,
  },
  bmiContainer: {
    marginTop: 5,
    backgroundColor: "#1E1E1E",
    width: "90%",
    height: 120,
    borderRadius: 15,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  logout_button: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 160,
    height: 45,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    marginLeft: 15,
  },
  logout_button_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 160,
    height: 45,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    marginLeft: 15,
  },
  logout_button_text: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mealContainer: {
    marginTop: 20,
    width: "90%",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  box: {
    width: "48%",
    height: 100,
    backgroundColor: "green",
    marginBottom: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

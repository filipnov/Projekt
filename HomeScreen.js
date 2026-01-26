// HomeScreen.js
import { useState, useEffect } from "react";
import { Text, View, Image, TextInput, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo-name.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";


export default function HomeScreen({ setIsLoggedIn }) {
const SERVER_URL = "https://app.bitewise.it.com"

  const navigation = useNavigation();

const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

async function pullAllUserData(email) {
  try {
    // USER DATA
    const userProfileRes = await fetch(`${SERVER_URL}/api/userProfile?email=${email}`);
    const userProfile = await userProfileRes.json();
    await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

    // PRODUCTS
    const productsRes = await fetch(`${SERVER_URL}/api/getProducts?email=${email}`);
    const productsData = await productsRes.json();
    await AsyncStorage.setItem("products", JSON.stringify(productsData.products));

    // RECIPES
    const recipesRes = await fetch(`${SERVER_URL}/api/getRecipes?email=${email}`);
    const recipesData = await recipesRes.json();
    await AsyncStorage.setItem("recipes", JSON.stringify(recipesData.recipes));

    // DAILY CONSUMPTION (napr. posledných 7 dní)
    const dailyConsumption = {};
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      try {
        const dayRes = await fetch(`${SERVER_URL}/api/getDailyConsumption?email=${email}&date=${dateStr}`);
        if (dayRes.ok) {
          const dayData = await dayRes.json();
          dailyConsumption[dateStr] = dayData.totals;
        } else {
          dailyConsumption[dateStr] = null;
        }
      } catch {
        dailyConsumption[dateStr] = null;
      }
    }
    await AsyncStorage.setItem("dailyConsumption", JSON.stringify(dailyConsumption));

    console.log("✅ All user data pulled into AsyncStorage");
  } catch (err) {
    console.error("❌ Error pulling user data:", err);
  }
}

useEffect(() => {
  const tryAutoLogin = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedPass = await AsyncStorage.getItem("userPass");

      console.log("Stored credentials:", storedEmail, storedPass);

      if (storedEmail && storedPass) {
        const response = await fetch(`${SERVER_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: storedEmail, password: storedPass }),
        });

        const data = await response.json();
        console.log("Login response:", data, response.status);

        if (response.ok) {
          console.log("✅ Autologin success, pulling user data");
          await pullAllUserData(storedEmail);
          console.log("✅ Data pulled, navigating to Dashboard");
          setIsLoggedIn(true);

          navigation.reset({
            index: 0,
            routes: [{ name: "Dashboard" }],
          });
        } else {
          console.warn("Autologin failed:", data.error);
        }
      } else {
        console.log("No stored credentials, manual login required");
      }
    } catch (err) {
      console.error("Error during autologin:", err);
    } finally {
      setLoading(false);
    }
  };

  tryAutoLogin();
}, []);

  if (loading) {
  return (
    <View style={[styles.mainLayout, { justifyContent: "center", alignItems: "center" }]}>
      <Text>Kontrola prihlásenia...</Text>
    </View>
  );
}

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data)

      if (!response.ok) {
        Alert.alert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      setIsLoggedIn(true);
      await AsyncStorage.setItem("userEmail", data.user.email);
      await AsyncStorage.setItem("userNick", data.user.nick);
      await AsyncStorage.setItem("userPass", password);


      // Tu zavoláme náš nový pull do AsyncStorage
    await pullAllUserData(data.user.email);

      let totalsToUse = null;

      const storedTotals = await AsyncStorage.getItem("eatenTotals");
      if (storedTotals) {
        totalsToUse = JSON.parse(storedTotals);
      }

      if (!totalsToUse) {
        console.log("AsyncStorage prázdne, fetchujem z DB...");
        try {
          const isoDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

          const url = `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(
            data.user.email,
          )}&date=${encodeURIComponent(isoDate)}`;

          const dbResponse = await fetch(url);

          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData && dbData.totals) {
              totalsToUse = dbData.totals;
            }
          } else {
            console.log("DB fetch failed, status:", dbResponse.status);
          }
        } catch (err) {
          console.error("Error fetching eatenTotals from DB:", err);
        }
      }

      if (!totalsToUse) {
        totalsToUse = {
          calories: 0,
          proteins: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          salt: 0,
        };
      }

      await AsyncStorage.setItem("eatenTotals", JSON.stringify(totalsToUse));

      navigation.navigate("Dashboard", { email: data.user.email });
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    }
  }

  return (
    <KeyboardWrapper style={styles.mainLayout}>
  
        <Image style={styles.profileAvatar} source={logo} />
        <View style={styles.cardContainer}>
          <Text style={styles.titleText}>Prihlásenie!</Text>
          <Text style={styles.infoLabel}>Tu vyplň svoje údaje:</Text>

          {/* Email input */}
          <TextInput
            placeholder="e-mail"
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
          />

          {/* Password input */}
          <TextInput
            placeholder="heslo"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot password link */}
          <Text
            onPress={() => navigation.navigate("ForgetPass")}
            style={styles.forgotText}
          >
            Zabudnuté heslo?
          </Text>

          {/* Login button */}
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.loginBtnPressed : styles.loginBtn
            }
            onPress={handleLogin}
          >
            <Text style={styles.loginBtnText}>Prihlásiť sa!</Text>
          </Pressable>

          <Text style={styles.orText}>ALEBO</Text>

          {/* Registration button */}
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.registerBtnPressed : styles.registerBtn
            }
            onPress={() => navigation.navigate("RegistrationScreen")}
          >
            <Text style={styles.registerBtnText}>Registrovať sa!</Text>
          </Pressable>
        </View>
    </KeyboardWrapper>
  );
}

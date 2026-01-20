// HomeScreen.js
import { useState } from "react";
import { Text, View, Image, TextInput, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./Dashboard/styles";


export default function HomeScreen({ setIsLoggedIn }) {
const SERVER_URL = "https://app.bitewise.it.com"

  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      if (!response.ok) {
        Alert.alert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      setIsLoggedIn(true);
      await AsyncStorage.setItem("userEmail", data.user.email);
      await AsyncStorage.setItem("userNick", data.user.nick);

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
    <View style={styles.mainLayout}>
      <View style={styles.bgImage}>
        <Image style={styles.profileAvatar} source={logo} />
        <View style={styles.cardContainer}>
          <Text style={styles.titleText}>Vitaj!</Text>
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
      </View>
    </View>
  );
}

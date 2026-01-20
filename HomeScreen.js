//HomeScreen.js
import { useState } from "react";
import { Text, View, Image, TextInput, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./Dashboard/styles";

export default function HomeScreen({ setIsLoggedIn }) {
  const navigation = useNavigation();

  // State for user input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle login process
  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }

    try {
      const response = await fetch(`http://10.0.2.2:3000/api/login`, {
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
      await AsyncStorage.setItem("userEmail", email);
      await AsyncStorage.setItem("userNick", data.user.nick);

      // Load eaten totals from AsyncStorage (initialize if missing)
      try {
        const storedTotals = await AsyncStorage.getItem("eatenTotals");
        if (!storedTotals) {
          const initialTotals = {
            calories: 0,
            proteins: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            salt: 0,
          };
          await AsyncStorage.setItem(
            "eatenTotals",
            JSON.stringify(initialTotals),
          );
          console.log("eatenTotals initialized on login:", initialTotals);
        } else {
          console.log("eatenTotals loaded on login:", JSON.parse(storedTotals));
        }
      } catch (err) {
        console.error("Error loading/initializing eatenTotals on login:", err);
      }

      navigation.navigate("Dashboard", { email: data.user.email });

      /* navigation.reset({
        index: 0,
        routes: [
          {
            name: "Dashboard",
            params: { email: data.user.email },
          },
        ],
      });*/
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

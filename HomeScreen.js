// HomeScreen.js
import { useState, useEffect } from "react";
import { Text, View, Image, TextInput, Pressable, Alert, Modal, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo-name.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function HomeScreen({ setIsLoggedIn }) {
  const SERVER_URL = "https://app.bitewise.it.com";
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
       // show sp
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const storedPass = await AsyncStorage.getItem("userPass");

        if (storedEmail && storedPass) {
          setIsLoading(true);
          const response = await fetch(`${SERVER_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedEmail, password: storedPass }),
          });

          const data = await response.json();

          if (response.ok) {
            await pullAllUserData(storedEmail);
            setIsLoggedIn(true);
            navigation.reset({
              index: 0,
              routes: [{ name: "Dashboard" }],
            });
          }
        }
      } catch (err) {
        console.error("Autologin error:", err);
      } finally {
        setIsLoading(false); // hide spinner
      }
    };

    tryAutoLogin();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }

    setIsLoading(true); // show spinner
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
      await AsyncStorage.setItem("userPass", password);

      await pullAllUserData(data.user.email);

      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard", params: { email: data.user.email } }],
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    } finally {
      setIsLoading(false); // hide spinner
    }
  }

  return (
    <KeyboardWrapper style={styles.authMainLayout}>
      {/* Spinner Modal */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Kontrolujem údaje...</Text>
            <Text style={styles.generatingModalSubtitle}>Môže to trvať niekoľko sekúnd</Text>
          </View>
        </View>
      </Modal>

      <Image style={styles.authProfileAvatar} source={logo} />

      <View style={styles.authCardContainer}>
        <Text style={styles.authTitleText}>Prihlásenie!</Text>
        <Text style={styles.authInfoLabel}>Tu vyplň svoje údaje:</Text>

        <TextInput
          placeholder="e-mail"
          style={styles.authTextInput}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="heslo"
          style={styles.authTextInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text onPress={() => navigation.navigate("ForgetPass")} style={styles.authForgotText}>
          Zabudnuté heslo?
        </Text>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
          }
          onPress={handleLogin}
        >
          <Text style={styles.authRegLogBtnText}>Prihlásiť sa!</Text>
        </Pressable>

        <Text style={styles.authOrText}>ALEBO</Text>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
          }
          onPress={() => navigation.navigate("RegistrationScreen")}
        >
          <Text style={styles.authRegLogBtnText}>Registrovať sa!</Text>
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

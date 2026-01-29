// HomeScreen.js
import { useState, useEffect } from "react";
import { Text, View, Image, TextInput, Pressable, Alert, Modal, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { 
  requestPermissions, 
  scheduleDailyNotifications 
} from './notifications';

export default function HomeScreen({ setIsLoggedIn }) {
  const SERVER_URL = "https://app.bitewise.it.com";
  const navigation = useNavigation();

  // Simple UI state
  const [email, setEmail] = useState(""); // typed email
  const [password, setPassword] = useState(""); // typed password
  const [isLoading, setIsLoading] = useState(false); // loading circle
  async function pullAllUserData(email) {
    // Pull profile, products, recipes and last 7 days of consumption
    // Stored AsyncStorage keys:
    // - 'userProfile'  -> basic profile object
    // - 'products'     -> array of user's pantry products
    // - 'recipes'      -> array of saved recipes
    // - 'dailyConsumption' -> object keyed by YYYY-MM-DD with totals
    try {
      // 1) USER PROFILE
      // GET /api/userProfile?email=... -> returns profile data used in Dashboard
      const userProfileRes = await fetch(`${SERVER_URL}/api/userProfile?email=${email}`);
      const userProfile = await userProfileRes.json();
      await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

      // 2) PRODUCTS
      // GET /api/getProducts?email=... -> returns user's pantry products array
      const productsRes = await fetch(`${SERVER_URL}/api/getProducts?email=${email}`);
      const productsData = await productsRes.json();
      await AsyncStorage.setItem("products", JSON.stringify(productsData.products));

      // 3) RECIPES
      // GET /api/getRecipes?email=... -> returns saved recipes
      const recipesRes = await fetch(`${SERVER_URL}/api/getRecipes?email=${email}`);
      const recipesData = await recipesRes.json();
      await AsyncStorage.setItem("recipes", JSON.stringify(recipesData.recipes));

      // 4) DAILY CONSUMPTION for last 7 days
      // We fetch each day separately and store them under 'dailyConsumption'
      // Structure: { 'YYYY-MM-DD': { calories: ..., proteins: ..., ... } | null }
      const dailyConsumption = {};
      const today = new Date();
      // Loop for 7 days: i == 0 -> today, i == 1 -> yesterday, etc.
      for (let i = 0; i < 7; i++) {
        // Use a fresh Date copy so we don't mutate the original 'today'
        const date = new Date(today);
        // Subtract 'i' days to get the target date
        date.setDate(today.getDate() - i);
        // Normalize to an ISO date string used as the storage + API key
        // e.g. '2026-01-29' (YYYY-MM-DD). Note: toISOString() returns UTC,
        // which is acceptable here because we only need a stable day-key.
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

        try {
          // GET /api/getDailyConsumption?email=...&date=YYYY-MM-DD
          const dayRes = await fetch(`${SERVER_URL}/api/getDailyConsumption?email=${email}&date=${dateStr}`);
          if (dayRes.ok) {
            const dayData = await dayRes.json();
            // dayData.totals expected to be an object with calories, proteins, etc.
            dailyConsumption[dateStr] = dayData.totals;
          } else {
            // server returned 404 or no data -> keep null
            dailyConsumption[dateStr] = null;
          }
        } catch {
          // network error -> keep null so UI knows no data
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
    // Try to login automatically using saved credentials (if any)
    const tryAutoLogin = async () => {
      try {
        // Read saved credentials from AsyncStorage (keys used elsewhere)
        // 'userEmail' and 'userPass' are saved after a successful manual login.
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const storedPass = await AsyncStorage.getItem("userPass");

        console.log("Stored credentials:", storedEmail ? storedEmail : "<none>");

        // If we have both email and pass, try to authenticate without user input
        if (storedEmail && storedPass) {
          // show spinner while contacting server
          setIsLoading(true);

          // POST /api/login { email, password } - server returns basic user info
          const response = await fetch(`${SERVER_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedEmail, password: storedPass }),
          });

          const data = await response.json();
          console.log("Login response status:", response.status);

          if (response.ok) {
            // successful: pull all user data (products/recipes/history)
            console.log("✅ Autologin success, pulling user data");
            await pullAllUserData(storedEmail);
            // schedule notifications (asks permission if needed)
            //await setupNotifications();
            console.log("✅ Data pulled, navigating to Dashboard");
            setIsLoggedIn(true);

            // Reset navigation and open Dashboard as the root screen
            navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });//Routuje na prvu položku = Dashboard
          } else {
            // stored credentials invalid or server rejected them
            console.warn("Autologin failed:", data.error);
          }
        } else {
          // No stored credentials found - user must login manually
          console.log("No stored credentials, manual login required");
        }
      } catch (err) {
        console.error("Error during autologin:", err);
      } finally {
        setIsLoading(false);//Turn of loading spinner
      }
    };

    tryAutoLogin();// Call function
  }, []);

  // Called when user taps "Prihlásiť sa" - performs server login and pulls data
  async function handleLogin() {
    // basic validation: require both fields
    if (!email || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }
    setIsLoading(true);//Turn on spinner
    try {
      // call login API
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        Alert.alert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      // login succeeded: mark logged in and save small user info locally
      setIsLoggedIn(true);
      await AsyncStorage.setItem("userEmail", data.user.email);
      await AsyncStorage.setItem("userNick", data.user.nick);
      await AsyncStorage.setItem("userPass", password);

      // pull the rest of user data (products, recipes, history)
      await pullAllUserData(data.user.email);
     // await setupNotifications();

      // Decide initial eatenTotals (what the Dashboard will show):
      // - First try local cache 'eatenTotals' (fast)
      // - If not present, request today's totals from server
      // - If that fails, use a zeroed default object
      let totalsToUse = null;
      const storedTotals = await AsyncStorage.getItem("eatenTotals");
      if (storedTotals) {
        // Use locally cached totals if available (quick startup)
        totalsToUse = JSON.parse(storedTotals);
      }

      if (!totalsToUse) {
        // No local totals -> attempt to fetch today's totals from server.
        try {
          const isoDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const url = `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(data.user.email)}&date=${encodeURIComponent(isoDate)}`;
          const dbResponse = await fetch(url);
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData && dbData.totals) {
              totalsToUse = dbData.totals; // server totals (preferred)
            }
          }
        } catch (err) {
          // network or server error -> we'll fall back to zeros
          console.error("Error fetching eatenTotals from DB:", err);
        }
      }

      if (!totalsToUse) {
        // No data anywhere: initialize to safe zeros so UI doesn't break
        totalsToUse = { calories: 0, proteins: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 };
      }

      // Persist chosen totals so other screens read consistent values
      await AsyncStorage.setItem("eatenTotals", JSON.stringify(totalsToUse));

      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard", params: { email: data.user.email } }],
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    }
     finally {
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

        {/* Email input */}
        <TextInput
          placeholder="e-mail"
          style={styles.authTextInput}
          value={email}
          onChangeText={setEmail}
        />

        {/* Password input */}
        <TextInput
          placeholder="heslo"
          style={styles.authTextInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Forgot password link */}
        <Text
          onPress={() => navigation.navigate("ForgetPass")}
          style={styles.authForgotText}
        >
          Zabudnuté heslo?
        </Text>

        {/* Login button */}
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
          }
          onPress={handleLogin}
        >
          <Text style={styles.authRegLogBtnText}>Prihlásiť sa!</Text>
        </Pressable>

        <Text style={styles.authOrText}>ALEBO</Text>

        {/* Registration button */}
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

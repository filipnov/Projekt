// HomeScreen.js
// Úvodná obrazovka prihlásenia a automatického prihlásenia
import { useState, useEffect, useMemo } from "react";
import {
  Text,
  View,
  Image,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { ensurePasswordHash } from "./passwordUtils";
import { loadTotalsForDate, saveTotalsForDate } from "./dailyTotalsStorage";
// Funkcie pre notifikácie
import {
  ensureNotificationsSetup,
} from "./notifications";

export default function HomeScreen({ setIsLoggedIn }) {
  // URL backendu
  const SERVER_URL = "https://app.bitewise.it.com";
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();

  const getTodayKey = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const DEFAULT_TOTALS = {
    calories: 0,
    proteins: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    salt: 0,
    drunkWater: 0,
  };

  // Jednoduchý UI stav
  const [email, setEmail] = useState(""); // zadaný e‑mail
  const [password, setPassword] = useState(""); // zadané heslo
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // spinner pri načítaní

  // Stiahne a uloží všetky používateľské dáta po prihlásení
  async function pullAllUserData(email) {
    // Stiahne profil, produkty, recepty a 7 dní konzumácie
    // Kľúče v AsyncStorage:
    // - 'userProfile'       -> profil používateľa
    // - 'products'          -> produkty v špajzi
    // - 'recipes'           -> uložené recepty
    // - 'dailyConsumption'  -> objekt podľa dátumu (YYYY-MM-DD)
    try {
      // 1) PROFIL POUŽÍVATEĽA
      // GET /api/userProfile?email=... -> profil pre Dashboard
      const userProfileRes = await fetch(`${SERVER_URL}/api/userProfile?email=${email}`);
      const userProfile = await userProfileRes.json();
      await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

      // 2) PRODUKTY
      // GET /api/getProducts?email=... -> produkty v špajzi
      const productsRes = await fetch(`${SERVER_URL}/api/getProducts?email=${email}`);
      const productsData = await productsRes.json();
      await AsyncStorage.setItem("products", JSON.stringify(productsData.products));

      // 3) RECEPTY
      // GET /api/getRecipes?email=... -> uložené recepty
      const recipesRes = await fetch(`${SERVER_URL}/api/getRecipes?email=${email}`);
      const recipesData = await recipesRes.json();
      await AsyncStorage.setItem("recipes", JSON.stringify(recipesData.recipes));

      // 4) DENNÁ KONZUMÁCIA za posledných 7 dní
      // Každý deň sa sťahuje osobitne a ukladá do 'dailyConsumption'
      // Štruktúra: { 'YYYY-MM-DD': { calories, proteins, ... } | null }
      const dailyConsumption = {};
      const today = new Date();
      // Cyklus 7 dní: i == 0 -> dnes, i == 1 -> včera, ...
      for (let i = 0; i < 7; i++) {
        // Použijeme kópiu dátumu, aby sa nepremenil pôvodný 'today'
        const date = new Date(today);
        // Odpočítame i dní
        date.setDate(today.getDate() - i);
        // ISO dátum pre API a kľúč v storage
        // Napr. '2026-01-29' (YYYY-MM-DD). toISOString() je UTC,
        // čo tu nevadí, potrebujeme stabilný kľúč dňa.
        const dateStr = getTodayKey(date); // YYYY-MM-DD (lokálny čas)

        try {
          // GET /api/getDailyConsumption?email=...&date=YYYY-MM-DD
          const dayRes = await fetch(`${SERVER_URL}/api/getDailyConsumption?email=${email}&date=${dateStr}`);
          if (dayRes.ok) {
            const dayData = await dayRes.json();
            // dayData.totals obsahuje kalórie, bielkoviny, ...
            dailyConsumption[dateStr] = dayData.totals;
          } else {
            // server vrátil 404 alebo bez dát -> uložíme null
            dailyConsumption[dateStr] = null;
          }
        } catch {
          // chyba siete -> uložíme null, aby UI vedelo že niet dát
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
    // Pokus o automatické prihlásenie zo saved údajov (ak existujú)
    const tryAutoLogin = async () => {
      try {
        // Načítanie uložených údajov z AsyncStorage
        // 'userEmail' a 'userPass' sa ukladajú po úspešnom prihlásení
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const storedPass = await AsyncStorage.getItem("userPass");

        console.log("Stored credentials:", storedEmail ? storedEmail : "<none>");

        // Ak máme e‑mail aj heslo, skúsime prihlásiť bez zásahu používateľa
        if (storedEmail && storedPass) {
          const storedPassHash = await ensurePasswordHash(storedPass);

          if (!storedPassHash) {
            console.warn("Stored password missing after hashing");
            setIsLoading(false);
            return;
          }

          if (storedPassHash !== storedPass) {
            await AsyncStorage.setItem("userPass", storedPassHash);
          }

          // zapneme spinner počas komunikácie so serverom
          setIsLoading(true);

          // POST /api/login { email, password } - server vráti základné info
          const response = await fetch(`${SERVER_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedEmail, password: storedPassHash }),
          });

          const data = await response.json();
          console.log("Login response status:", response.status);

          if (response.ok) {
            // úspech: stiahneme všetky dáta (produkty/recepty/história)
            console.log("✅ Autologin success, pulling user data");
            await pullAllUserData(storedEmail);
            // plánovanie notifikácií (po prípadnom súhlase)
            await ensureNotificationsSetup();
            console.log("✅ Data pulled, navigating to Dashboard");
            setIsLoggedIn(true);

            // Reset navigácie a otvorenie Dashboardu ako root
            navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] }); // Routuje na prvú položku = Dashboard
          } else {
            // uložené údaje sú neplatné alebo server ich odmietol
            console.warn("Autologin failed:", data.error);
          }
        } else {
          // Žiadne uložené údaje - používateľ sa musí prihlásiť ručne
          console.log("No stored credentials, manual login required");
        }
      } catch (err) {
        console.error("Error during autologin:", err);
      } finally {
        // vypnúť spinner
        setIsLoading(false);
      }
    };

    // Spustenie auto-login logiky
    tryAutoLogin();
  }, []);

  // Volá sa po stlačení "Prihlásiť sa" - prihlásenie a stiahnutie dát
  async function handleLogin() {
    const trimmedEmail = email.trim();
    // základná validácia: obe polia musia byť vyplnené
    if (!trimmedEmail || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }
    // zapnúť spinner
    setIsLoading(true);
    try {
      const hashedPassword = await ensurePasswordHash(password);

      if (!hashedPassword) {
        Alert.alert("Chyba", "Heslo sa nepodarilo spracovať. Skús to znovu.");
        return;
      }

      console.log(hashedPassword);
      // volanie login API
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: hashedPassword }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        Alert.alert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      // úspech: nastavíme prihlásenie a uložíme základné info lokálne
      setIsLoggedIn(true);
      await AsyncStorage.setItem("userEmail", data.user.email);
      await AsyncStorage.setItem("userNick", data.user.nick);
      await AsyncStorage.setItem("userPass", hashedPassword);

      // stiahneme zvyšok používateľských dát (produkty, recepty, história)
      await pullAllUserData(data.user.email);
      await ensureNotificationsSetup();

      // Určíme počiatočné denné totals (čo zobrazí Dashboard):
      // - najprv lokálna cache v dailyConsumption (rýchle)
      // - ak nie je, pokus o dnešné dáta zo servera
      // - ak zlyhá, použijeme nulové hodnoty
      const todayKey = getTodayKey();
      let totalsToUse = await loadTotalsForDate(todayKey, DEFAULT_TOTALS);

      if (!totalsToUse) {
        // Nemáme lokálne hodnoty -> skúsime dnešné hodnoty zo servera
        try {
          const isoDate = todayKey; // YYYY-MM-DD (lokálny čas)
          const url = `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(data.user.email)}&date=${encodeURIComponent(isoDate)}`;
          const dbResponse = await fetch(url);
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData && dbData.totals) {
              totalsToUse = { ...DEFAULT_TOTALS, ...dbData.totals };
            }
          }
        } catch (err) {
          // chyba siete alebo servera -> padneme na nuly
          console.error("Error fetching eatenTotals from DB:", err);
        }
      }

      if (!totalsToUse) {
        // Nikde nie sú dáta: nastavíme bezpečné nuly
        totalsToUse = { ...DEFAULT_TOTALS };
      }

      // Uložíme zvolené totals, aby ich ostatné obrazovky čítali konzistentne
      await saveTotalsForDate(todayKey, totalsToUse, true);

      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard", params: { email: data.user.email } }],
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    }
     finally {
      // vypnúť spinner
      setIsLoading(false);
    }
  }

  return (
    <KeyboardWrapper
      style={styles.loginScreen}
      contentContainerStyle={styles.loginScrollContent}
    >
      {/* Modal so spinnerom počas spracovania */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Kontrolujem údaje...</Text>
            <Text style={styles.generatingModalSubtitle}>
              Môže to trvať niekoľko sekúnd
            </Text>
          </View>
        </View>
      </Modal>
      <View style={styles.loginHero}>
        <Image style={styles.loginLogo} source={logo} resizeMode="contain" />
        <Text style={styles.loginHeroTitle}>Vitaj späť</Text>
        <Text style={styles.loginHeroSubtitle}>
          Prihlás sa do svojho účtu Bitewise.
        </Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.loginCardTitle}>Prihlásenie</Text>
        <Text style={styles.loginCardSubtitle}>Zadaj e-mail a heslo.</Text>

        <View style={styles.loginField}>
          <Text style={styles.loginFieldLabel}>E-mail</Text>
          <AutoShrinkTextInput
            placeholder="tvoj@email.sk"
            placeholderTextColor="#9ca3af"
            style={styles.loginTextInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="email"
            minFontSize={12}
            maxFontSize={16}
          />
        </View>

        <View style={styles.loginField}>
          <Text style={styles.loginFieldLabel}>Heslo</Text>
          <View style={localStyles.passwordRow}>
            <AutoShrinkTextInput
              placeholder="heslo"
              placeholderTextColor="#9ca3af"
              style={[styles.loginTextInput, styles.loginPasswordInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="password"
              minFontSize={12}
              maxFontSize={16}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={localStyles.passwordToggle}
            >
              <Text style={styles.loginPasswordToggleText}>
                {showPassword ? "Skryť" : "Ukázať"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("ForgetPass")}
          style={styles.loginForgotButton}
        >
          <Text style={styles.loginForgotText}>Zabudnuté heslo?</Text>
        </Pressable>

        <Pressable
          disabled={isLoading}
          style={({ pressed }) => [
            styles.loginPrimaryButton,
            (pressed || isLoading) && styles.loginPrimaryButtonPressed,
          ]}
          onPress={handleLogin}
        >
          <Text style={styles.loginPrimaryButtonText}>
            {isLoading ? "Prihlasujem..." : "Prihlásiť sa"}
          </Text>
        </Pressable>

        <View style={styles.loginDividerRow}>
          <View style={styles.loginDividerLine} />
          <Text style={styles.loginDividerText}>alebo</Text>
          <View style={styles.loginDividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.loginSecondaryButton,
            pressed && styles.loginSecondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate("RegistrationScreen")}
        >
          <Text style={styles.loginSecondaryButtonText}>Vytvoriť účet</Text>
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

function AutoShrinkTextInput({
  style,
  value,
  minFontSize = 12,
  maxFontSize = 18,
  numberOfLines = 1,
  onLayout,
  ...props
}) {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [inputWidth, setInputWidth] = useState(null);

  const flattenedStyle = useMemo(() => StyleSheet.flatten(style) || {}, [style]);

  const horizontalPadding =
    (flattenedStyle.paddingLeft ?? flattenedStyle.paddingHorizontal ?? flattenedStyle.padding ?? 0) +
    (flattenedStyle.paddingRight ?? flattenedStyle.paddingHorizontal ?? flattenedStyle.padding ?? 0);

  useEffect(() => {
    setFontSize(maxFontSize);
  }, [value, maxFontSize]);

  const handleTextLayout = (event) => {
    if (!inputWidth) return;

    const lines = event.nativeEvent?.lines || [];
    if (!lines.length) return;

    const lineWidth = lines[0].width;
    const availableWidth = Math.max(0, inputWidth - horizontalPadding);

    if (lineWidth > availableWidth && fontSize > minFontSize) {
      setFontSize((prev) => Math.max(minFontSize, prev - 1));
    }
  };

  const handleLayout = (event) => {
    setInputWidth(event.nativeEvent.layout.width);
    if (onLayout) {
      onLayout(event);
    }
  };

  return (
    <View style={localStyles.container}>
      <TextInput
        {...props}
        value={value}
        numberOfLines={numberOfLines}
        onLayout={handleLayout}
        style={[style, { fontSize }]}
      />
      <Text
        style={[style, localStyles.hiddenText, { fontSize }]}
        numberOfLines={numberOfLines}
        onTextLayout={handleTextLayout}
        pointerEvents="none"
      >
        {value || ""}
      </Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    height: 0,
    width: "100%",
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 42,
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    fontSize: 16,
  },
});

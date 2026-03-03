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
    // základná validácia: obe polia musia byť vyplnené
    if (!email || !password) {
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
        body: JSON.stringify({ email, password: hashedPassword }),
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

      // Určíme počiatočné eatenTotals (čo zobrazí Dashboard):
      // - najprv lokálna cache 'eatenTotals' (rýchle)
      // - ak nie je, pokus o dnešné dáta zo servera
      // - ak zlyhá, použijeme nulové hodnoty
      let totalsToUse = null;
      const storedTotals = await AsyncStorage.getItem("eatenTotals");
      if (storedTotals) {
        // použijeme lokálne cache, ak existuje (rýchly štart)
        totalsToUse = JSON.parse(storedTotals);
      }

      if (!totalsToUse) {
        // Nemáme lokálne hodnoty -> skúsime dnešné hodnoty zo servera
        try {
          const isoDate = getTodayKey(); // YYYY-MM-DD (lokálny čas)
          const url = `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(data.user.email)}&date=${encodeURIComponent(isoDate)}`;
          const dbResponse = await fetch(url);
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData && dbData.totals) {
              totalsToUse = dbData.totals; // serverové hodnoty (preferované)
            }
          }
        } catch (err) {
          // chyba siete alebo servera -> padneme na nuly
          console.error("Error fetching eatenTotals from DB:", err);
        }
      }

      if (!totalsToUse) {
        // Nikde nie sú dáta: nastavíme bezpečné nuly
        totalsToUse = { calories: 0, proteins: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 };
      }

      // Uložíme zvolené totals, aby ich ostatné obrazovky čítali konzistentne
      await AsyncStorage.setItem("eatenTotals", JSON.stringify(totalsToUse));
      await AsyncStorage.setItem("eatenTotalsDate", getTodayKey());

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
    <KeyboardWrapper style={styles.authMainLayout}>
      {/* Modal so spinnerom počas spracovania */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Kontrolujem údaje...</Text>
            <Text style={styles.generatingModalSubtitle}>Môže to trvať niekoľko sekúnd</Text>
          </View>
        </View>
      </Modal>
      {/* Logo a prihlasovací formulár */}
        <Image style={styles.authProfileAvatar} source={logo} />
        <View style={styles.authCardContainer}>
          <Text style={styles.authTitleText}>Prihlásenie!</Text>
          <Text style={styles.authInfoLabel}>Tu vyplň svoje údaje:</Text>

        {/* Vstup pre e‑mail */}
        <AutoShrinkTextInput
          placeholder="e-mail"
          style={styles.authTextInput}
          value={email}
          onChangeText={setEmail}
          minFontSize={12}
          maxFontSize={18}
        />

        {/* Vstup pre heslo */}
        <View style={localStyles.passwordRow}>
          <AutoShrinkTextInput
            placeholder="heslo"
            style={[styles.authTextInput, localStyles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            minFontSize={12}
            maxFontSize={18}
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={localStyles.passwordToggle}
          >
            <Text style={localStyles.passwordToggleText}>
              {showPassword ? "🙈" : "👁"}
            </Text>
          </Pressable>
        </View>

        {/* Odkaz na zabudnuté heslo */}
        <Text
          onPress={() => navigation.navigate("ForgetPass")}
          style={styles.authForgotText}
        >
          Zabudnuté heslo?
        </Text>

        {/* Tlačidlo prihlásenia */}
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
          }
          onPress={handleLogin}
        >
          <Text style={styles.authRegLogBtnText}>Prihlásiť sa!</Text>
        </Pressable>

        <Text style={styles.authOrText}>ALEBO</Text>

        {/* Tlačidlo registrácie */}
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
  },
  passwordInput: {
    paddingRight: 42,
  },
  passwordToggle: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  passwordToggleText: {
    fontSize: 16,
  },
});

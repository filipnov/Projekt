// HomeScreen.js
// Úvodná obrazovka prihlásenia a automatického prihlásenia
import { useState, useEffect, useMemo } from "react";
import {
  Text,
  View,
  Image,
  Pressable,
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
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "./googleAuthConfig";
import { useAppTheme } from "./ThemeContext";
import { useAlert } from "./AlertContext";
import { ensurePasswordHash } from "./passwordUtils";
import { loadTotalsForDate, saveTotalsForDate } from "./dailyTotalsStorage";
import { normalizeProductQuantity } from "./productQuantity";
import { SERVER_URL } from "./config/serverConfig";
// Funkcie pre notifikácie
import {
  ensureNotificationsSetup,
} from "./notifications";

const GOOGLE_LOGIN_NOT_CONFIGURED =
  "Google prihlásenie ešte nie je nakonfigurované. Doplň GOOGLE_WEB_CLIENT_ID v googleAuthConfig.js a GOOGLE_CLIENT_IDS na serveri.";

function getGoogleSignInOptions() {
  const options = {
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  };

  if (GOOGLE_IOS_CLIENT_ID) {
    options.iosClientId = GOOGLE_IOS_CLIENT_ID;
  }

  return options;
}

function requestGoogleConsent(showAlert) {
  return new Promise((resolve) => {
    showAlert(
      "Súhlas so spracovaním údajov",
      "Pre vytvorenie účtu cez Google potrebujeme uložiť tvoj e-mail a meno z Google účtu.",
      [
        { text: "Zrušiť", style: "cancel", onPress: () => resolve(false) },
        { text: "Súhlasím", onPress: () => resolve(true) },
      ],
    );
  });
}

export default function HomeScreen({ setIsLoggedIn }) {
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useAlert();

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
      const normalizedProducts = (productsData.products || []).map((product) =>
        product?.isCustom ? product : normalizeProductQuantity(product),
      );
      await AsyncStorage.setItem("products", JSON.stringify(normalizedProducts));

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

  async function completeLoginSession(
    user,
    { authProvider = "password", storedPassword = null } = {},
  ) {
    if (!user?.email) {
      throw new Error("Missing user email after login");
    }

    const userNick = user.nick || user.email.split("@")[0] || "Používateľ";

    setIsLoggedIn(true);
    await AsyncStorage.setItem("userEmail", user.email);
    await AsyncStorage.setItem("userNick", userNick);
    await AsyncStorage.setItem("authProvider", authProvider);

    if (storedPassword) {
      await AsyncStorage.setItem("userPass", storedPassword);
    } else {
      await AsyncStorage.removeItem("userPass");
    }

    await pullAllUserData(user.email);
    await ensureNotificationsSetup();

    const todayKey = getTodayKey();
    let totalsToUse = await loadTotalsForDate(todayKey, DEFAULT_TOTALS);

    if (!totalsToUse) {
      try {
        const isoDate = todayKey;
        const url = `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(user.email)}&date=${encodeURIComponent(isoDate)}`;
        const dbResponse = await fetch(url);
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          if (dbData && dbData.totals) {
            totalsToUse = { ...DEFAULT_TOTALS, ...dbData.totals };
          }
        }
      } catch (err) {
        console.error("Error fetching eatenTotals from DB:", err);
      }
    }

    if (!totalsToUse) {
      totalsToUse = { ...DEFAULT_TOTALS };
    }

    await saveTotalsForDate(todayKey, totalsToUse, true);

    navigation.reset({
      index: 0,
      routes: [{ name: "Dashboard", params: { email: user.email } }],
    });
  }

  async function postGoogleLogin(idToken, gdprConsent = false) {
    const response = await fetch(`${SERVER_URL}/api/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        gdprConsent,
        gdprConsentAt: new Date().toISOString(),
      }),
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function handleGoogleLogin({ silent = false } = {}) {
    if (!GOOGLE_WEB_CLIENT_ID) {
      if (!silent) {
        showAlert("Google prihlásenie", GOOGLE_LOGIN_NOT_CONFIGURED);
      }
      return false;
    }

    let statusCodes = {};
    setIsLoading(true);

    try {
      const googleSignIn = await import("@react-native-google-signin/google-signin");
      const { GoogleSignin } = googleSignIn;
      statusCodes = googleSignIn.statusCodes || {};

      GoogleSignin.configure(getGoogleSignInOptions());
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const googleResponse = silent
        ? await GoogleSignin.signInSilently()
        : await GoogleSignin.signIn();

      if (googleResponse?.type !== "success") {
        return false;
      }

      let idToken = googleResponse.data?.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
      }

      if (!idToken) {
        if (!silent) {
          showAlert(
            "Google prihlásenie",
            "Google nevrátil prihlasovací token. Skontroluj webClientId v konfigurácii.",
          );
        }
        return false;
      }

      let { response, data } = await postGoogleLogin(idToken, false);

      if (
        response.status === 409 &&
        data.code === "GOOGLE_GDPR_REQUIRED" &&
        !silent
      ) {
        const consentGranted = await requestGoogleConsent(showAlert);
        if (!consentGranted) {
          return false;
        }
        ({ response, data } = await postGoogleLogin(idToken, true));
      }

      if (!response.ok) {
        if (!silent) {
          showAlert("Chyba", data.error || "Google prihlásenie zlyhalo.");
        }
        return false;
      }

      await completeLoginSession(data.user, { authProvider: "google" });
      return true;
    } catch (error) {
      const wasCancelled =
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS;

      if (!wasCancelled && !silent) {
        showAlert(
          "Google prihlásenie",
          "Google prihlásenie sa nepodarilo spustiť. Skontroluj, či používaš development build a či je Google Sign-In nakonfigurovaný.",
        );
      }

      console.error("Google login error:", error);
      return false;
    } finally {
      setIsLoading(false);
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
        const storedProvider = await AsyncStorage.getItem("authProvider");

        console.log("Stored credentials:", storedEmail ? storedEmail : "<none>");

        if (storedProvider === "google") {
          const restored = await handleGoogleLogin({ silent: true });
          if (!restored) {
            console.warn("Google autologin failed");
          }
          return;
        }

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
            console.log("✅ Autologin success, pulling user data");
            await completeLoginSession(data.user, {
              authProvider: "password",
              storedPassword: storedPassHash,
            });
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
      showAlert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }
    // zapnúť spinner
    setIsLoading(true);
    try {
      const hashedPassword = await ensurePasswordHash(password);

      if (!hashedPassword) {
        showAlert("Chyba", "Heslo sa nepodarilo spracovať. Skús to znovu.");
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
        showAlert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      await completeLoginSession(data.user, {
        authProvider: "password",
        storedPassword: hashedPassword,
      });
    } catch (error) {
      console.error(error);
      showAlert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    }
     finally {
      // vypnúť spinner
      setIsLoading(false);
    }
  }

  return (
    <KeyboardWrapper
      style={[styles.loginScreen, { backgroundColor: colors.authBackground }]}
      contentContainerStyle={styles.loginScrollContent}
      safeArea
    >
      {/* Modal so spinnerom počas spracovania */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.generatingModalContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={[styles.generatingModalTitle, { color: colors.text }]}>
              Kontrolujem údaje...
            </Text>
            <Text style={[styles.generatingModalSubtitle, { color: colors.mutedText }]}>
              Môže to trvať niekoľko sekúnd
            </Text>
          </View>
        </View>
      </Modal>
      <View style={styles.loginHero}>
        <Image style={styles.loginLogo} source={logo} resizeMode="contain" />
        <Text style={[styles.loginHeroTitle, { color: colors.text }]}>Vitaj ty kokot späť</Text>
        <Text style={[styles.loginHeroSubtitle, { color: colors.mutedText }]}>
          Prihlás sa do svojho účtu Bitewise.
        </Text>
      </View>

      <View
        style={[
          styles.loginCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            elevation: isDark ? 0 : 8,
          },
        ]}
      >
        <Text style={[styles.loginCardTitle, { color: colors.text }]}>
          Prihlásenie
        </Text>
        <Text style={[styles.loginCardSubtitle, { color: colors.mutedText }]}>
          Zadaj e-mail a heslo.
        </Text>

        <View style={styles.loginField}>
          <Text style={[styles.loginFieldLabel, { color: colors.textSoft }]}>E-mail</Text>
          <AutoShrinkTextInput
            placeholder="tvoj@email.sk"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.loginTextInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
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
          <Text style={[styles.loginFieldLabel, { color: colors.textSoft }]}>Heslo</Text>
          <View style={localStyles.passwordRow}>
            <AutoShrinkTextInput
              placeholder="heslo"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.loginTextInput,
                styles.loginPasswordInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
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
          <Text style={[styles.loginForgotText, { color: colors.primary }]}>
            Zabudnuté heslo?
          </Text>
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
          <View style={[styles.loginDividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.loginDividerText, { color: colors.mutedText }]}>alebo</Text>
          <View style={[styles.loginDividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          disabled={isLoading}
          style={({ pressed }) => [
            styles.loginGoogleButton,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
            },
            pressed && {
              backgroundColor: colors.surfacePressed,
              transform: [{ scale: 0.99 }],
            },
          ]}
          onPress={() => handleGoogleLogin()}
        >
          <View
            style={[
              styles.loginGoogleIcon,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.loginGoogleIconText, { color: colors.text }]}>G</Text>
          </View>
          <Text style={[styles.loginGoogleButtonText, { color: colors.text }]}>
            Pokračovať cez Google
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginSecondaryButton,
            styles.loginCreateAccountButton,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.primary,
            },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => navigation.navigate("RegistrationScreen")}
        >
          <Text style={[styles.loginSecondaryButtonText, { color: colors.primary }]}>
            Vytvoriť účet
          </Text>
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

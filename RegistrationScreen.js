// RegistrationScreen.js
// Obrazovka registrácie používateľa.
// - Obsahuje základné validácie a volanie API.
// - Po úspešnej registrácii uloží prezývku a vráti používateľa na Home.
import { useState, useEffect, useMemo } from "react";
import {
  Text,
  View,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import arrow from "./assets/left_arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function RegistrationScreen() {
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();

  // Stav formulára (vstupy používateľa)
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  // Stav spínajúci loading počas registrácie
  const [loading, setLoading] = useState(false);
  // GDPR súhlas
  const [gdprConsent, setGdprConsent] = useState(false);

  // Základné URL backendu
  const SERVER = "https://app.bitewise.it.com";

  // Koncový bod registrácie
  const REGISTER_URL = `${SERVER}/api/register`;

  // Spracovanie registrácie po kliknutí na tlačidlo
  async function handleRegistration() {
    // Jednoduchá kontrola povinného súhlasu
    if (!gdprConsent) {
      Alert.alert(
        "Súhlas je povinný",
        "Pre pokračovanie je potrebné súhlasiť so spracovaním osobných údajov.",
      );
      return;
    }

    // Očistenie vstupov (zabráni jednoduchým chybám používateľa)
    const trimmedEmail = email.trim();
    const trimmedNick = nick.trim();

    // Základná validácia: všetky polia sú povinné a heslá sa musia zhodovať
    if (!trimmedEmail || !trimmedNick || !password || !passwordConfirm) {
      Alert.alert("Registrácia nebola úspešná!", "Prosím vyplň všetky polia!");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("Registrácia nebola úspešná!", "Heslá sa nezhodujú!");
      return;
    }

    // Príprava payloadu pre API (len potrebné údaje)
    const body = {
      email: trimmedEmail,
      password,
      nick: trimmedNick,
      gdprConsent,
      gdprConsentAt: new Date().toISOString(),
    };

    // Zapnutie loading spinnera
    setLoading(true);

    try {
      // Odoslanie registrácie na server
      const resp = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Bezpečné parsovanie odpovede (pri chybe použijeme prázdny objekt)
      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // Úspešná registrácia: uložíme prezývku a vrátime sa na Home
        await AsyncStorage.setItem("userNick", trimmedNick);

        // Vyčistenie formulára
        setEmail("");
        setNick("");
        setPassword("");
        setPasswordConfirm("");

        // Potvrdenie pre používateľa a návrat na Home
        Alert.alert("Registrácia bola úspešná!", `Vitaj, ${trimmedNick}!`);
        navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
      } else {
        // Zobrazíme správu zo servera, ak existuje, inak default
        const msg = data.error || data.message || "Server vrátil chybu.";
        Alert.alert("Registrácia zlyhala", msg);
      }
    } catch (err) {
      // Sieťová chyba / problém so serverom
      Alert.alert(
        "Chyba siete",
        err.message || "Nepodarilo sa spojiť so serverom.",
      );
    } finally {
      // Vypnutie spinnera po dokončení
      setLoading(false);
    }
  }

  return (
    <KeyboardWrapper style={styles.authMainLayout}>
      {/* Modal s loading spinnerom */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Registrujem účet...</Text>
            <Text style={styles.generatingModalSubtitle}>
              Prosím počkaj chvíľu
            </Text>
          </View>
        </View>
      </Modal>
      {/* Logo aplikácie */}
      <Image style={styles.authProfileAvatarReg} source={logo} />

      <View style={styles.authCardContainer}>
        <Text style={styles.authTitleText}>Registrácia!</Text>
        <Text style={styles.authInfoLabel}>Zadaj email:</Text>
        <AutoShrinkTextInput
          placeholder="e-mail"
          style={styles.authTextInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          minFontSize={12}
          maxFontSize={18}
        />
        {/* Vstup pre prezývku */}
        <Text style={styles.authInfoLabel}>Zadaj ako ťa máme volať:</Text>
        <AutoShrinkTextInput
          placeholder="prezývka"
          style={styles.authTextInput}
          value={nick}
          onChangeText={setNick}
          autoCapitalize="words"
          minFontSize={12}
          maxFontSize={18}
        />
        {/* Vstup pre heslo */}
        <Text style={styles.authInfoLabel}>Zadaj svoje heslo:</Text>
        <View style={localStyles.passwordRow}>
          <AutoShrinkTextInput
            placeholder="heslo"
            style={[styles.authTextInput, localStyles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
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
        {/* Opakované zadanie hesla */}
        <Text style={styles.authInfoLabel}>Zopakuj heslo:</Text>
        <View style={localStyles.passwordRow}>
          <AutoShrinkTextInput
            placeholder="heslo znova"
            style={[styles.authTextInput, localStyles.passwordInput]}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry={!showPasswordConfirm}
            autoCapitalize="none"
            minFontSize={12}
            maxFontSize={18}
          />
          <Pressable
            onPress={() => setShowPasswordConfirm((prev) => !prev)}
            style={localStyles.passwordToggle}
          >
            <Text style={localStyles.passwordToggleText}>
              {showPasswordConfirm ? "🙈" : "👁"}
            </Text>
          </Pressable>
        </View>
        {/* GDPR súhlas */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 10,
          }}
        >
          <Switch
            value={gdprConsent}
            onValueChange={setGdprConsent}
            trackColor={{ false: "#ccc", true: "#4CAF50" }}
            thumbColor={gdprConsent ? "#2E7D32" : "#f4f3f4"}
            style={{ alignSelf: "center" }}
          />
          <Text style={{ marginLeft: 10, flex: 1 }}>
            Súhlasím so spracovaním svojho emailu a prezývky na účely
            registrácie a zasielania notifikácií o účte podľa zásad ochrany
            osobných údajov.
          </Text>
        </View>
        {/* Akcie: registrácia + návrat späť */}
        <View style={styles.buttonLayout}>
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
            }
            onPress={() => !loading && handleRegistration()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.authRegLogBtnText}>Registrovať sa!</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) =>
              pressed
                ? styles.authBackArrowPressed
                : styles.authBackArrowContainer
            }
            onPress={() => !loading && navigation.navigate("HomeScreen")}
          >
            <Image source={arrow} style={styles.authBackArrow} />
          </Pressable>
        </View>
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

  const flattenedStyle = useMemo(
    () => StyleSheet.flatten(style) || {},
    [style],
  );

  const horizontalPadding =
    (flattenedStyle.paddingLeft ??
      flattenedStyle.paddingHorizontal ??
      flattenedStyle.padding ??
      0) +
    (flattenedStyle.paddingRight ??
      flattenedStyle.paddingHorizontal ??
      flattenedStyle.padding ??
      0);

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

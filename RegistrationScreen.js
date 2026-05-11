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
  ActivityIndicator,
  Switch,
  Modal,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { hashPassword } from "./passwordUtils";
import { useAppTheme } from "./ThemeContext";
import { useAlert } from "./AlertContext";

export default function RegistrationScreen() {
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useAlert();

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
  const SERVER = String(process.env.EXPO_PUBLIC_API_URL || "").replace(
    /\/+$/,
    "",
  );

  // Koncový bod registrácie
  const REGISTER_URL = `${SERVER}/api/register`;

  // Spracovanie registrácie po kliknutí na tlačidlo
  async function handleRegistration() {
    // Jednoduchá kontrola povinného súhlasu
    if (!gdprConsent) {
      showAlert(
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
      showAlert("Registrácia nebola úspešná!", "Prosím vyplň všetky polia!");
      return;
    }
    if (password !== passwordConfirm) {
      showAlert("Registrácia nebola úspešná!", "Heslá sa nezhodujú!");
      return;
    }

    // Hashovanie hesla pred odoslaním na server
    const hashedPassword = await hashPassword(password);

    // Príprava payloadu pre API (len potrebné údaje)
    const body = {
      email: trimmedEmail,
      password: hashedPassword,
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
        setGdprConsent(false);

        // Potvrdenie pre používateľa a návrat na Home
        showAlert("Registrácia bola úspešná!", `Vitaj, ${trimmedNick}!`);
        navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
      } else {
        // Zobrazíme správu zo servera, ak existuje, inak default
        const msg = data.error || data.message || "Server vrátil chybu.";
        showAlert("Registrácia zlyhala", msg);
      }
    } catch (err) {
      // Sieťová chyba / problém so serverom
      showAlert(
        "Chyba siete",
        err.message || "Nepodarilo sa spojiť so serverom.",
      );
    } finally {
      // Vypnutie spinnera po dokončení
      setLoading(false);
    }
  }

  return (
    <KeyboardWrapper
      style={[styles.loginScreen, { backgroundColor: colors.authBackground }]}
      contentContainerStyle={styles.registerScrollContent}
      safeArea
    >
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.generatingModalContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={[styles.generatingModalTitle, { color: colors.text }]}>
              Registrujem účet...
            </Text>
            <Text style={[styles.generatingModalSubtitle, { color: colors.mutedText }]}>
              Prosím počkaj chvíľu
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.registerHero}>
        <Image style={styles.registerLogo} source={logo} resizeMode="contain" />
        <Text style={[styles.loginHeroTitle, { color: colors.text }]}>Vytvor účet</Text>
        <Text style={[styles.loginHeroSubtitle, { color: colors.mutedText }]}>
          Začni sledovať špajzu, jedlá a svoje nutričné ciele.
        </Text>
      </View>

      <View
        style={[
          styles.registerCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            elevation: isDark ? 0 : 8,
          },
        ]}
      >
        <Text style={[styles.loginCardTitle, { color: colors.text }]}>
          Registrácia
        </Text>
        <Text style={[styles.loginCardSubtitle, { color: colors.mutedText }]}>
          Vyplň základné údaje.
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
            autoComplete="email"
            textContentType="username"
            minFontSize={12}
            maxFontSize={16}
          />
        </View>

        <View style={styles.loginField}>
          <Text style={[styles.loginFieldLabel, { color: colors.textSoft }]}>Prezývka</Text>
          <AutoShrinkTextInput
            placeholder="ako ťa máme volať"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.loginTextInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={nick}
            onChangeText={setNick}
            autoCapitalize="words"
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
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="new-password"
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

        <View style={styles.loginField}>
          <Text style={[styles.loginFieldLabel, { color: colors.textSoft }]}>Zopakuj heslo</Text>
          <View style={localStyles.passwordRow}>
            <AutoShrinkTextInput
              placeholder="heslo znova"
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
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry={!showPasswordConfirm}
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="new-password"
              minFontSize={12}
              maxFontSize={16}
            />
            <Pressable
              onPress={() => setShowPasswordConfirm((prev) => !prev)}
              style={localStyles.passwordToggle}
            >
              <Text style={styles.loginPasswordToggleText}>
                {showPasswordConfirm ? "Skryť" : "Ukázať"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.registerConsentRow,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
            },
          ]}
        >
          <Switch
            value={gdprConsent}
            onValueChange={setGdprConsent}
            trackColor={{ false: "#d1d5db", true: "#9adea6" }}
            thumbColor={gdprConsent ? "#2E7D32" : "#f4f3f4"}
          />
          <Text style={[styles.registerConsentText, { color: colors.textSoft }]}>
            Súhlasím so spracovaním svojho e-mailu a prezývky na účely
            registrácie a zasielania notifikácií o účte podľa zásad ochrany
            osobných údajov.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.loginPrimaryButton,
            (pressed || loading) && styles.loginPrimaryButtonPressed,
          ]}
          onPress={() => !loading && handleRegistration()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginPrimaryButtonText}>Registrovať sa</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginSecondaryButton,
            styles.registerBackButton,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.primary,
            },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => !loading && navigation.navigate("HomeScreen")}
          disabled={loading}
        >
          <Text style={[styles.loginSecondaryButtonText, { color: colors.primary }]}>
            Späť na prihlásenie
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

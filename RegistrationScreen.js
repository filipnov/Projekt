// RegistrationScreen.js
import { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo-name.png";
import arrow from "./assets/left-arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function RegistrationScreen() {
  const navigation = useNavigation();

  // State for user input
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);


  const SERVER = "https://app.bitewise.it.com";

  const REGISTER_URL = `${SERVER}/api/register`;

  // Handle registration
  async function handleRegistration() {
    if (!gdprConsent) {
  Alert.alert(
    "Súhlas je povinný",
    "Pre pokračovanie je potrebné súhlasiť so spracovaním osobných údajov."
  );
  return;
}
    const trimmedEmail = email.trim();
    const trimmedNick = nick.trim();

    // Basic validation
    if (!trimmedEmail || !trimmedNick || !password || !passwordConfirm) {
      Alert.alert("Registrácia nebola úspešná!", "Prosím vyplň všetky polia!");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("Registrácia nebola úspešná!", "Heslá sa nezhodujú!");
      return;
    }

    const body = {
  email: trimmedEmail,
  password,
  nick: trimmedNick,
  gdprConsent, // boolean
  gdprConsentAt: new Date().toISOString(), // ISO timestamp
  gdprPolicyVersion: "1.0", // alebo dátum verzie GDPR
};
    await AsyncStorage.setItem("userNick", trimmedNick);
    setLoading(true);

    try {
      const resp = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // Clear inputs
        setEmail("");
        setNick("");
        setPassword("");
        setPasswordConfirm("");

        Alert.alert("Registrácia bola úspešná!", `Vitaj, ${trimmedNick}!`);
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeScreen" }],
        });
      } else {
        const msg = data.error || data.message || "Server vrátil chybu.";
        Alert.alert("Registrácia zlyhala", msg);
      }
    } catch (err) {
      Alert.alert(
        "Network error",
        err.message || "Nepodarilo sa spojiť so serverom.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardWrapper style={styles.mainLayout}>
      <Image style={styles.profileAvatar} source={logo} />

      <View style={styles.cardContainer}>
        <Text style={styles.titleText}>Registrácia!</Text>

        <Text style={styles.infoLabel}>Zadaj email:</Text>
        <TextInput
          placeholder="e-mail"
          style={styles.textInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={styles.infoLabel}>Zadaj ako ťa máme volať:</Text>
        <TextInput
          placeholder="prezývka"
          style={styles.textInput}
          value={nick}
          onChangeText={setNick}
          autoCapitalize="words"
        />

        <Text style={styles.infoLabel}>Zadaj svoje heslo:</Text>
        <TextInput
          placeholder="heslo"
          style={styles.textInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.infoLabel}>Zopakuj heslo:</Text>
        <TextInput
          placeholder="heslo znova"
          style={styles.textInput}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          autoCapitalize="none"
        />
  <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
  <Switch
    value={gdprConsent}
    onValueChange={setGdprConsent}
    trackColor={{ false: "#ccc", true: "#4CAF50" }}
  thumbColor={gdprConsent ? "#2E7D32" : "#f4f3f4"}
  />
  <Text style={{ marginLeft: 10, flex: 1 }}>
    Súhlasím so spracovaním svojho emailu a prezývky na účely registrácie a zasielania notifikácií o účte podľa zásad ochrany osobných údajov.
  </Text>
</View>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.regLogBtnPressed : styles.regLogBtn
          }
          onPress={() => !loading && handleRegistration()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.regLogBtnText}>Registrovať sa!</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.backArrowPressed : styles.backArrowContainer
          }
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Image source={arrow} style={styles.backArrow} />
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

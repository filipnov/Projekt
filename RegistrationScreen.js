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
  Switch,
  Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo-name.png";
import arrow from "./assets/left-arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function RegistrationScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  const SERVER = "https://app.bitewise.it.com";
  const REGISTER_URL = `${SERVER}/api/register`;

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
      gdprConsent,
      gdprConsentAt: new Date().toISOString(),
      gdprPolicyVersion: "1.0",
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
    <KeyboardWrapper style={styles.authMainLayout}>
      {/* Spinner Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Spracovávam údaje...</Text>
            <Text style={styles.generatingModalSubtitle}>Môže to trvať niekoľko sekúnd</Text>
          </View>
        </View>
      </Modal>

      <Image style={styles.authProfileAvatarReg} source={logo} />

      <View style={styles.authCardContainer}>
        <Text style={styles.authTitleText}>Registrácia!</Text>

        <Text style={styles.authInfoLabel}>Zadaj email:</Text>
        <TextInput
          placeholder="e-mail"
          style={styles.authTextInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={styles.authInfoLabel}>Zadaj ako ťa máme volať:</Text>
        <TextInput
          placeholder="prezývka"
          style={styles.authTextInput}
          value={nick}
          onChangeText={setNick}
          autoCapitalize="words"
        />

        <Text style={styles.authInfoLabel}>Zadaj svoje heslo:</Text>
        <TextInput
          placeholder="heslo"
          style={styles.authTextInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.authInfoLabel}>Zopakuj heslo:</Text>
        <TextInput
          placeholder="heslo znova"
          style={styles.authTextInput}
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
            pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
          }
          onPress={() => !loading && handleRegistration()}
          disabled={loading}
        >
          <Text style={styles.authRegLogBtnText}>Registrovať sa!</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.authBackArrowPressed : styles.authBackArrowContainer
          }
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Image source={arrow} style={styles.authBackArrow} />
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

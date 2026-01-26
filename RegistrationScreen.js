// RegistrationScreen.js
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
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

  const SERVER = "https://app.bitewise.it.com";

  const REGISTER_URL = `${SERVER}/api/register`;

  // Handle registration
  async function handleRegistration() {
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

    const body = { email: trimmedEmail, password, nick: trimmedNick };
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
    <KeyboardWrapper style={styles.authMainLayout}>
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

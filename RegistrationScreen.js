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
import AsyncStorage from '@react-native-async-storage/async-storage';
import background from "./assets/background.png";
import logo from "./assets/logo.png";
import arrow from "./assets/left-arrow.png";

export default function RegistrationScreen() {
  const navigation = useNavigation();

  // State for user input
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const SERVER = "http://172.30.99.111:3000"; // adjust if using different emulator or device
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
                  routes: [{ name: "Dashboard" }],
                });
      } else {
        const msg = data.error || data.message || "Server vrátil chybu.";
        Alert.alert("Registrácia zlyhala", msg);
      }
    } catch (err) {
      Alert.alert(
        "Network error",
        err.message || "Nepodarilo sa spojiť so serverom."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.layout}>
      <ImageBackground source={background} style={styles.image}>
        <Image style={styles.avatar} source={logo} />

        <View style={styles.container}>
          <Text style={styles.text}>Registruj sa!</Text>

          <Text style={styles.info_text}>Zadaj email:</Text>
          <TextInput
            placeholder="e-mail"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          
          <Text style={styles.info_text}>Zadaj ako ťa máme volať:</Text>
          <TextInput
            placeholder="prezývka"
            style={styles.input}
            value={nick}
            onChangeText={setNick}
            autoCapitalize="words"
          />

          <Text style={styles.info_text}>Zadaj svoje heslo:</Text>
          <TextInput
            placeholder="heslo"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.info_text}>Zopakuj heslo:</Text>
          <TextInput
            placeholder="heslo znova"
            style={styles.input}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) =>
              pressed ? styles.button_pressed : styles.button
            }
            onPress={() => !loading && handleRegistration()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.button_text}>Registrovať sa!</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("HomeScreen")}>
          <Image source={arrow} style={styles.arrow} />
        </Pressable>
      </ImageBackground>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  layout: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    height: 300,
    width: 300,
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 50,
  },
  arrow: {
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 10,
  },
  text: {
    fontSize: 50,
    fontWeight: "900",
  },
  container: {
    backgroundColor: "hsla(0, 0%, 85%, 0.7)",
    padding: 10,
    borderRadius: 25,
    borderColor: "white",
    borderWidth: 2,
    height: 500,
    width: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "white",
    fontSize: 20,
    fontWeight: "200",
    width: 240,
    height: 55,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6,
  },
  info_text: {
    fontWeight: "800",
    fontSize: 14,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
  },
  button: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_text: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
});

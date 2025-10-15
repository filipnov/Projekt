// HomeScreen.js
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import background from "./assets/background.png";
import logo from "./assets/logo.png";
import arrow from "./assets/left-arrow.png";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [registration, setRegistration] = useState([]);
  const [personEmail, setEmail] = useState("");
  const [personNick, setNick] = useState("");
  const [personPassword, setPassword] = useState("");
  const [personAPassword, setAPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ADJUST THIS if you test on a real device / different emulator:
  // Android emulator (Android Studio) -> 10.0.2.2
  // Genymotion -> 10.0.3.2
  // iOS simulator -> http://localhost:3000
  // Physical phone -> http://<PC_IP>:3000
  const SERVER = "http://10.0.2.2:3000";
  const REGISTER_URL = `${SERVER}/api/register`;

  async function handleRegistration() {
    // basic client-side validation
    const email = personEmail.trim();
    const nick = personNick.trim();
    const pass = personPassword;
    const pass2 = personAPassword;

    if (!email || !nick || !pass || !pass2) {
      Alert.alert("Registrácia nebola úspešná!", "Prosím vyplň všetky polia!");
      return;
    }
    if (pass !== pass2) {
      Alert.alert("Registrácia nebola úspešná!", "Heslá sa nezhodujú!");
      return;
    }

    // optional: simple email regex (very basic)
    /* const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Chybný email", "Zadaj platný e-mail.");
      return;
    }
    */
    // prepare body
    const body = { email, nick, password: pass };

    setLoading(true);
    try {
      const resp = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // push to local state (optional)
        setRegistration((r) => [...r, { email, nick }]);

        // clear inputs
        setEmail("");
        setNick("");
        setPassword("");
        setAPassword("");

        Alert.alert("Registrácia bola úspešná!", `Vitaj, ${nick}!`);
        // optional: navigate to login or home
        // navigation.navigate("HomeScreen");
      } else {
        // show server-provided message or generic one
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

  function Test() {
    console.log("Local registrations:", registration);
    Alert.alert("Debug", `Lokálnych registrácií: ${registration.length}`);
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
            style={styles.input_email}
            value={personEmail}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.info_text}>Zadaj ako ťa máme volať:</Text>
          <TextInput
            placeholder="prezývka"
            style={styles.input_password}
            value={personNick}
            onChangeText={setNick}
            autoCapitalize="words"
          />
          <Text style={styles.info_text}>Zadaj svoje heslo:</Text>
          <TextInput
            placeholder="heslo"
            style={styles.input_password}
            value={personPassword}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.info_text}>Zopakuj heslo:</Text>
          <TextInput
            placeholder="heslo znova"
            style={styles.input_password}
            value={personAPassword}
            onChangeText={setAPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) =>
              pressed ? styles.button_register_pressed : styles.button_register
            }
            onPress={() => {
              if (!loading) handleRegistration();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.button_text_register}>Registrovať sa!</Text>
            )}
          </Pressable>

          <Pressable onPress={Test} style={{ marginTop: 8 }}>
            <Text>Test</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => (pressed ? styles.arrow_pressed : null)}
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Image source={arrow} style={styles.arrow}></Image>
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    height: 300,
    width: 300,
    marginBottom: 20,
    backgroundColor: "hsla(0, 0%, 100%, 1)",
    borderRadius: 50,
  },
  arrow: {
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 10,
  },
  arrow_pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 50,
    fontWeight: "900",
    borderBottomColor: "black",
  },
  container: {
    backgroundColor: "hsla(0, 0%, 85%, 0.7)",
    padding: 10,
    borderRadius: 25,
    borderColor: "white",
    borderWidth: 2,
    height: 500,
    width: 340,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  input_email: {
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
  input_password: {
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

  button_register: {
    backgroundColor: "hsla(129, 56%, 43%, 1.00)",
    width: 225,
    height: 55,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
    elevation: 6,
  },
  button_register_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
    elevation: 6,
  },

  button_text_register: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },

  info_text: {
    fontWeight: "800",
    fontSize: 14,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
  },
});

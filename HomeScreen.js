import { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import background from "./assets/background.png";
import logo from "./assets/logo.png";

export default function HomeScreen() {
  const navigation = useNavigation();

  // State for user input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle login process
  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Chyba", "Prosím, vyplň všetky polia!");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Chyba", data.error || "Prihlásenie zlyhalo!");
        return;
      }

      // Navigate to Dashboard with email and nick
      navigation.navigate("Dashboard", {
        email: data.user.email,
        nick: data.user.nick,
      });

      Alert.alert("Úspech", "Prihlásenie bolo úspešné!");
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodarilo sa pripojiť k serveru!");
    }
  }

  return (
    <View style={styles.layout}>
      <ImageBackground source={background} style={styles.image}>
        <Image style={styles.avatar} source={logo} />
        <View style={styles.container}>
          <Text style={styles.text}>Vitaj!</Text>
          <Text style={styles.info_text}>Tu vyplň svoje údaje:</Text>

          {/* Email input */}
          <TextInput
            placeholder="e-mail"
            style={styles.input_email}
            value={email}
            onChangeText={setEmail}
          />

          {/* Password input */}
          <TextInput
            placeholder="heslo"
            style={styles.input_password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot password link */}
          <Text
            onPress={() => Linking.openURL("https://google.com")}
            style={styles.forget_text}
          >
            Zabudnuté heslo?
          </Text>

          {/* Login button */}
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.button_login_pressed : styles.button_login
            }
            onPress={handleLogin}
          >
            <Text style={styles.button_text_login}>Prihlásiť sa!</Text>
          </Pressable>

          <Text style={styles.alebo_text}>ALEBO</Text>

          {/* Registration button */}
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.button_register_pressed : styles.button_register
            }
            onPress={() => navigation.navigate("RegistrationScreen")}
          >
            <Text style={styles.button_text_register}>Registrovať sa!</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: "#fff",
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
  text: {
    fontSize: 60,
    fontWeight: "900",
  },
  container: {
    backgroundColor: "hsla(0, 0%, 85%, 0.7)",
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "white",
    height: 500,
    width: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  input_email: {
    backgroundColor: "white",
    fontSize: 25,
    fontWeight: "200",
    width: 250,
    height: 60,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6,
  },
  input_password: {
    backgroundColor: "white",
    fontSize: 25,
    fontWeight: "200",
    width: 250,
    height: 60,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 20,
    textAlign: "center",
    elevation: 6,
  },
  button_login: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 200,
    height: 50,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_login_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 200,
    height: 50,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_register: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_register_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_text_login: {
    color: "white",
    fontSize: 25,
    fontWeight: "900",
  },
  button_text_register: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
  forget_text: {
    fontWeight: "900",
    fontStyle: "italic",
    fontSize: 18,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
    textDecorationLine: "underline",
  },
  info_text: {
    fontWeight: "800",
    fontSize: 16,
    marginTop: 20,
    alignSelf: "flex-start",
    marginLeft: 40,
  },
  alebo_text: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
});

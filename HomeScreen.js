// HomeScreen.js
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
import background from "./assets/background.png";
import logo from "./assets/logo.png";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

//export const exportEmail = "email";

export const exportEmail = "TESTTT";


export default function HomeScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {

    if (condition) {
      
    }

    Alert.alert("Prihlásenie", `Email: ${email}\nHeslo: ${password}`);
  }

  return (
    <View style={styles.layout}>
      <ImageBackground source={background} style={styles.image}>
        <Image style={styles.avatar} source={logo} />
        <View style={styles.container}>
          <Text style={styles.text}>Vitaj!</Text>
          <Text style={styles.info_text}>Tu vyplň svoje údaje:</Text>

          <TextInput
            placeholder="e-mail"
            style={styles.input_email}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="heslo"
            style={styles.input_password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text
            onPress={() => Linking.openURL("https://google.com")}
            style={styles.forget_text}
          >
            Zabudnuté heslo?
          </Text>

          <Pressable
            style={({ pressed }) =>
              pressed ? styles.button_login_pressed : styles.button_login
            }
            onPress={handleLogin}
          >
            <Text style={styles.button_text_login}>Prihlásiť sa!</Text>
          </Pressable>
          <Text style={styles.alebo_text}>ALEBO</Text>
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
  text: {
    fontSize: 60,
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
    backgroundColor: "hsla(129, 56%, 43%, 1.00)",
    width: 200,
    height: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
    elevation: 6,
  },
  button_login_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 200,
    height: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
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
    marginTop: 10,
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
    marginTop: 10,
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
    textDecorationStyle: "solid",
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

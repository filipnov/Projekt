// ForgetPass.js
import { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import arrow from "./assets/left_arrow.png";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function PasswordForgetScreen() {
  const SERVER_URL = "https://app.bitewise.it.com";
  const navigation = useNavigation();

  const [email, setEmail] = useState("");

  const handleForgot = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.ok) {
        Alert.alert("Succes", "Check your email for reset link! ");
      } else {
        Alert.alert("Error", data.error);
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
      console.error(err);
    }
  };

  return (
    <KeyboardWrapper style={styles.authMainLayout}>
      <Image style={styles.authProfileAvatar} source={logo} />

      <View style={styles.authCardContainer}>
        <Text style={styles.authTitleText}>Zabudnuté heslo?</Text>
        <Text style={styles.authText}>
          Zadaj e-mail použitý pri registrácii a pomocou neho si vytvor nové heslo!
        </Text>

        <TextInput
          placeholder="e-mail"
          value={email}
          onChangeText={setEmail}
          style={styles.authTextInput}
        />

        <View style={styles.buttonLayout}>
          <Pressable
            style={({ pressed }) =>
              pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
            }
            onPress={handleForgot}
          >
            <Text style={styles.authRegLogBtnText}>Resetovať heslo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) =>
              pressed
                ? styles.authBackArrowPressed
                : styles.authBackArrowContainer
            }
            onPress={() => navigation.navigate("HomeScreen")}
          >
            <Image source={arrow} style={styles.authBackArrow} />
          </Pressable>
        </View>
      </View>
    </KeyboardWrapper>
  );
}

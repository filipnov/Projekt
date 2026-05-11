// ForgetPass.js
import { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo_name.png";
import arrow from "./assets/left_arrow.png";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";
import { useAppTheme } from "./ThemeContext";
import { useAlert } from "./AlertContext";
import { API_BASE_URL } from "./apiConfig";

export default function PasswordForgetScreen() {
  const SERVER_URL = API_BASE_URL;
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { showAlert } = useAlert();

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
        showAlert("Skontroluj si e-mail!");
      } else {
        showAlert("Error", data.error);
      }
    } catch (err) {
      showAlert("Error", "Something went wrong");
      console.error(err);
    }
  };

  return (
    <KeyboardWrapper
      style={[styles.authMainLayout, { backgroundColor: colors.authBackground }]}
    >
      <Image style={styles.authProfileAvatar} source={logo} />

      <View
        style={[
          styles.authCardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.authTitleText, { color: colors.text }]}>
          Zabudnuté heslo?
        </Text>
        <Text style={[styles.authText, { color: colors.textSoft }]}>
          Zadaj e-mail použitý pri registrácii a pomocou neho si vytvor nové heslo!
        </Text>

        <TextInput
          placeholder="e-mail"
          value={email}
          onChangeText={setEmail}
          style={[
            styles.authTextInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholderTextColor={colors.placeholder}
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

// WelcomeScreen.js
import { useState, useEffect } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import logo from "./assets/logo_slogan.png";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function WelcomeScreen() {
  const SERVER_URL = "https://app.bitewise.it.com";
  const navigation = useNavigation();

  const [email, setEmail] = useState("");

  // 🔹 KONTROLA, ČI UŽ BOL UVODNÝ SCREEN ABSOLVOVANÝ
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem("onboardingSeen");
        if (seen === "true") {
          navigation.replace("HomeScreen");
        }
      } catch (err) {
        console.error("AsyncStorage error:", err);
      }
    };

    checkOnboarding();
  }, []);

  // 🔹 ULOŽENIE, ŽE ONBOARDING BOL DOKONČENÝ
  const completeOnboarding = async (nextScreen) => {
    try {
      await AsyncStorage.setItem("onboardingSeen", "true");
      navigation.replace(nextScreen);
    } catch (err) {
      console.error("Failed to save onboarding state:", err);
    }
  };

  return (
    <KeyboardWrapper style={styles.mainLayout}>
      <Image style={styles.logo_slogan} source={logo} />

      <View style={styles.cardContainer}>
        <Text style={styles.welcomeTitle}>Vitaj u nás!</Text>

        <Text style={styles.welcomeText}>
          Míňaj menej jedla, jedz múdrejšie.
          {"\n\n"}
          Naskenuj svoje potraviny, objav recepty z toho, čo máš doma, a sleduj
          svoje výživové ciele – jednoducho a prehľadne.
          {"\n\n"}
          Zníž plýtvanie potravín, sleduj kalórie, živiny aj pitný režim, všetko
          na jednom mieste.
        </Text>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.regLogBtnPressed : styles.regLogBtn
          }
          onPress={() => completeOnboarding("HomeScreen")}
        >
          <Text style={styles.regLogBtnText}>Už mám účet</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.regLogBtnPressed : styles.regLogBtn
          }
          onPress={() => completeOnboarding("RegistrationScreen")}
        >
          <Text style={styles.regLogBtnText}>Zaregistrovať sa</Text>
        </Pressable>
      </View>
    </KeyboardWrapper>
  );
}

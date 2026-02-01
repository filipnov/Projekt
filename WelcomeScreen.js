// WelcomeScreen.js
// Jednoduchý úvodný screen pre nových používateľov
import { useEffect } from "react";
import { Text, View, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import logo from "./assets/logo_slogan.png";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function WelcomeScreen() {
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();

  // Kontrola, či už používateľ onboarding videl
  useEffect(() => {
    // Pomocná funkcia na načítanie flagu z AsyncStorage
    const checkOnboarding = async () => {
      try {
        // Ak je onboarding už absolvovaný, preskočíme rovno na HomeScreen
        const seen = await AsyncStorage.getItem("onboardingSeen");
        if (seen === "true") {
          navigation.replace("HomeScreen");
        }
      } catch (err) {
        // Chyba pri čítaní z AsyncStorage
        console.error("AsyncStorage error:", err);
      }
    };

    // Spustenie kontroly pri prvom zobrazení
    checkOnboarding();
  }, []);

  // Uloženie info, že onboarding bol dokončený
  const completeOnboarding = async (nextScreen) => {
    try {
      // Zapíšeme flag do AsyncStorage
      await AsyncStorage.setItem("onboardingSeen", "true");
      // Presmerujeme na ďalší screen
      navigation.replace(nextScreen);
    } catch (err) {
      // Chyba pri ukladaní
      console.error("Failed to save onboarding state:", err);
    }
  };

  return (
    // Wrapper kvôli klávesnici (bezpečné aj pri tomto screen-e)
    <KeyboardWrapper style={styles.mainLayout}>
      {/* Safe area zabráni, aby content vošiel do výrezu/notchu */}
      <SafeAreaView style={styles.welcomeSafeArea} edges={["top", "bottom"]}>
        {/* ScrollView zabezpečí, že na menších obrazovkách nič neodtečie mimo */}
        <ScrollView
          contentContainerStyle={styles.welcomeScrollContent}
        >
          {/* Logo aplikácie */}
          <Image
            source={logo}
            resizeMode="contain"
            style={[
              styles.logo_slogan,
              styles.welcomeLogoSized,
              styles.welcomeLogo,
            ]}
          />

          {/* Karta s textom a tlačidlami */}
          <View style={[styles.cardContainer, styles.welcomeCardContainer]}>
            {/* Nadpis */}
            <Text style={styles.welcomeTitle}>Vitaj u nás!</Text>

            {/* Popis aplikácie */}
            <Text style={styles.welcomeText}>
              Míňaj menej jedla, jedz múdrejšie.
              {"\n\n"}
              Naskenuj svoje potraviny, objav recepty z toho, čo máš doma, a
              sleduj svoje výživové ciele – jednoducho a prehľadne.
              {"\n\n"}
              Zníž plýtvanie potravín, sleduj kalórie, živiny aj pitný režim,
              všetko na jednom mieste.
            </Text>

            {/* Tlačidlo pre prihlásenie */}
            <Pressable
              style={({ pressed }) =>
                pressed ? styles.regLogBtnPressed : styles.regLogBtn
              }
              onPress={() => completeOnboarding("HomeScreen")}
            >
              <Text style={styles.regLogBtnText}>Už mám účet</Text>
            </Pressable>

            {/* Tlačidlo pre registráciu */}
            <Pressable
              style={({ pressed }) =>
                pressed ? styles.regLogBtnPressed : styles.regLogBtn
              }
              onPress={() => completeOnboarding("RegistrationScreen")}
            >
              <Text style={styles.regLogBtnText}>Zaregistrovať sa</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardWrapper>
  );
}

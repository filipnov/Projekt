// Dashboard.js
// Hlavná obrazovka aplikácie s tabmi (Prehľad, Recepty, Špajza, Nastavenia)
// Cieľ: jednoduchá a čitateľná logika, aby sa v kóde vyznal aj nováčik
import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RecipesTab from "./tabs/RecipesTab";
import PantryTab from "./tabs/PantryTab";
import SettingsTab from "./tabs/SettingsTab";
import OverviewTab from "./tabs/OverviewTab";
import styles from "../styles";
import logo from "../assets/logo_icon.png";
import plus from "../assets/plus.png";
import recipes from "../assets/recipe_book.png";
import setting from "../assets/settings.png";
import storage from "../assets/storage.png";
import speedometer from "../assets/speedometer.png";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard({ setIsLoggedIn }) {
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();
  // Základné údaje o používateľovi pre UI
  const [nick, setNick] = useState("User");

  // Stav aktívneho tabu (1 = Prehľad, 2 = Recepty, 3 = Špajza, 4 = Nastavenia)
  const [activeTab, setActiveTab] = useState(1);
  // Pomocná funkcia pre zvýraznenie aktívneho tabu
  const isActive = (tabIndex) => activeTab === tabIndex;

  // Načíta uloženú prezývku
  useEffect(() => {
    async function loadNick() {
      try {
        const savedNick = await AsyncStorage.getItem("userNick");
        if (savedNick) setNick(savedNick);
      } catch (error) {
        console.error("Error loading nick: ", error);
      }
    }
    loadNick();
  }, []);

  // Podľa aktívneho tabu renderujeme správny obsah
  // Všetky ostatné taby ostávajú samostatné komponenty
  const renderContent = () => {
    // Podľa hodnoty activeTab vyberieme správnu obrazovku
    switch (activeTab) {
      case 1:
        return <OverviewTab navigation={navigation} />;
      case 2:
        return <RecipesTab />;
      case 3:
        return <PantryTab />;
      case 4:
        return (
          <SettingsTab
            setIsLoggedIn={setIsLoggedIn}
            navigation={navigation}
            setNick={setNick}
          />
        );
      default:
        return <Text>Oops, niečo sa pokazilo</Text>;
    }
  };

  // --- UI ---
  return (
    <>
      {/* Horná lišta s pozdravom */}
      <View style={styles.dashTopBar}>
        <Image source={logo} style={styles.dashTopBar_img} />
        <Text style={styles.dashTopBar_text}>Ahoj {nick}!</Text>
      </View>

      {/* Hlavný obsah dashboardu */}
      <View style={styles.dashContentContainer}>
        <ScrollView
          style={{ flex: 1 }}
         // contentContainerStyle={{ paddingBottom: 110 + (insets?.bottom ?? 0) }}
        >
          {/* Obsah podľa aktuálneho tabu */}
          {renderContent()}
        </ScrollView>

        {/* Spodná navigácia (taby) */}
        <SafeAreaView edges={["bottom"]} style={styles.dashNavBar}>
          <Pressable
            onPress={() => setActiveTab(1)}
            style={[
              styles.dashNavBar_tabs,
              isActive(1) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={speedometer} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(1) && styles.dashNavBar_text_pressed,
              ]}
            >
              Prehľad
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(2)}
            style={[
              styles.dashNavBar_tabs,
              isActive(2) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={recipes} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(2) && styles.dashNavBar_text_pressed,
              ]}
            >
              Recepty
            </Text>
          </Pressable>
          <Pressable
            style={styles.dashNavBar_tabs}
            onPress={() => navigation.navigate("CameraScreen")}
          >
            <View style={styles.dashNavBar_Add_container}>
              <Image source={plus} style={styles.dashNavBar_Add} />
            </View>
            <Text style={styles.dashNavBar_text_Add}>Pridať</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab(3)}
            style={[
              styles.dashNavBar_tabs,
              isActive(3) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={storage} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(3) && styles.dashNavBar_text_pressed,
              ]}
            >
              Špajza
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab(4)}
            style={[
              styles.dashNavBar_tabs,
              isActive(4) && styles.dashNavBar_tabs_pressed,
            ]}
          >
            <Image source={setting} style={styles.dashNavBar_img} />
            <Text
              style={[
                styles.dashNavBar_text,
                isActive(4) && styles.dashNavBar_text_pressed,
              ]}
            >
              Nastavenia
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </>
  );
}

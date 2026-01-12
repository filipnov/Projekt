//NavBar.js
import React from "react";
import { View, Pressable, Text, Image } from "react-native";
import styles from "./styles";
import speedometer from "../assets/speedometer.png";
import recipes from "../assets/recipe-book.png";
import plus from "../assets/plus.png";
import storage from "../assets/storage.png";
import setting from "../assets/settings.png";

export default function NavBar({ activeTab, setActiveTab, navigation }) {
  const isActive = (tabIndex) => activeTab === tabIndex;

  return (
    <View style={styles.navBar}>
      <Pressable
        onPress={() => setActiveTab(1)}
        style={[styles.navBar_tabs, isActive(1) && styles.navBar_tabs_pressed]}
      >
        <Image source={speedometer} style={styles.navBar_img} />
        <Text style={[styles.navBar_text, isActive(1) && styles.navBar_text_pressed]}>
          Prehľad
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setActiveTab(2)}
        style={[styles.navBar_tabs, isActive(2) && styles.navBar_tabs_pressed]}
      >
        <Image source={recipes} style={styles.navBar_img} />
        <Text style={[styles.navBar_text, isActive(2) && styles.navBar_text_pressed]}>
          Recepty
        </Text>
      </Pressable>

      <Pressable
        style={styles.navBar_tab_Add}
        onPress={() => navigation.navigate("CameraScreen")}
      >
        <View style={styles.navBar_Add_container}>
          <Image source={plus} style={styles.navBar_Add} />
        </View>
        <Text style={styles.navBar_text_Add}>Pridať</Text>
      </Pressable>

      <Pressable
        onPress={() => setActiveTab(3)}
        style={[styles.navBar_tabs, isActive(3) && styles.navBar_tabs_pressed]}
      >
        <Image source={storage} style={styles.navBar_img} />
        <Text style={[styles.navBar_text, isActive(3) && styles.navBar_text_pressed]}>
          Špajza
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setActiveTab(4)}
        style={[styles.navBar_tabs, isActive(4) && styles.navBar_tabs_pressed]}
      >
        <Image source={setting} style={styles.navBar_img} />
        <Text style={[styles.navBar_text, isActive(4) && styles.navBar_text_pressed]}>
          Nastavenia
        </Text>
      </Pressable>
    </View>
  );
}

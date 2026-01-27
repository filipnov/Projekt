//NavBar.js
/*
import React from "react";
import { View, Pressable, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles";
import speedometer from "../assets/speedometer.png";
import recipes from "../assets/recipe_book.png";
import plus from "../assets/plus.png";
import storage from "../assets/storage.png";
import setting from "../assets/settings.png";

export default function NavBar({ activeTab, setActiveTab, navigation }) {
  const fallbackNavigation = useNavigation();
  const nav = navigation ?? fallbackNavigation;
  const isActive = (tabIndex) => activeTab === tabIndex;

  return (
    <View style={styles.dashNavBar}>
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
        style={styles.dashNavBar_tab_Add}
        onPress={() => nav.navigate("CameraScreen")}
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
    </View>
  );
}
*/
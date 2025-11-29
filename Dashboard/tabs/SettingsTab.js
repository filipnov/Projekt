import React from "react";
import { Pressable, Text } from "react-native";
import styles from "../styles";

export default function SettingsTab({ setIsLoggedIn, navigation }) {
  return (
    <Pressable
      onPress={() => {
        setIsLoggedIn(false);
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeScreen" }],
        });
      }}
      style={({ pressed }) => pressed ? styles.logout_button_pressed : styles.logout_button }
    >
      <Text style={styles.logout_button_text}>Odhlásiť sa</Text>
    </Pressable>
  );
}

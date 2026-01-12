//TopBar.js
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import styles from "./styles";
import logo from "../assets/logo.png";
import account from "../assets/avatar.png";

export default function TopBar({ nick, navigation }) {
  return (
    <View style={styles.topBar}>
      <Image source={logo} style={styles.topBar_img} />
      <Text style={styles.topBar_text}>Ahoj {nick}</Text>
      <Pressable onPress={() => navigation.navigate("ProfileCompletition")}>
        <Image source={account} style={styles.topBar_img} />
      </Pressable>
    </View>
  );
}

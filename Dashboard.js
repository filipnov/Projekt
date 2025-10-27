// Dashboard.js
import { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import logo from "./assets/logo.png";
import account from "./assets/avatar.png";

export default function Dashboard() {
  const navigation = useNavigation();
  const route = useRoute();

  // Get the nickname passed via route params, fallback to "User"
  const { nick } = route.params || { nick: "User" };

  return (
    <View style={styles.container}>
      {/* Top bar with logo, nickname, and avatar */}
      <View style={styles.topBar}>
        <Image source={logo} style={styles.topBar_img} />
        <Text style={styles.topBar_text}>Ahoj {nick}</Text>
        <Image source={account} style={styles.topBar_img} />
      </View>

      {/* Back button */}
      <Pressable onPress={() => navigation.navigate("HomeScreen")}>
        <Text style={styles.backText}>Chod späť</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    backgroundColor: "hsl(0, 0%, 88%)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
    elevation: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  topBar_text: {
    marginTop: 50,
    fontSize: 30,
    fontWeight: "bold",
  },
  topBar_img: {
    height: 60,
    width: 60,
    marginTop: 50,
  },
  backText: {
    fontSize: 18,
    color: "blue",
    margin: 20,
  },
});

// Dashboard.js
import React, { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import logo from "./assets/logo.png";
import home from "./assets/home.png";
import account from "./assets/avatar.png";

export default function Dashboard() {
  const navigation = useNavigation();
  const route = useRoute();

  // Get the nickname passed via route params, fallback to "User"
  const { nick } = route.params || { nick: "User" };

  // Keep track of which tab is active (1–5)
  const [activeTab, setActiveTab] = useState(1);

  // Function to check if tab is active
  const isActive = (tabIndex) => activeTab === tabIndex;

  return (
    <ScrollView style={styles.container}>
      {/* Top bar with logo, nickname, and avatar */}
      <View style={styles.topBar}>
        <Image source={logo} style={styles.topBar_img} />
        <Text style={styles.topBar_text}>Ahoj {nick}</Text>
        <Image source={account} style={styles.topBar_img} />
      </View>

      {/*Content container*/}
      <View style={styles.contentContainer}>

        {/*Main content*/}
        <View>
          <Text>SKIBIDIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII</Text>
        </View>

        {/*Nav bar*/}
        <View style={styles.navBar}>
          <Pressable onPress={() => setActiveTab(1)}
                     style={[styles.navBar_tabs, isActive(1) && styles.navBar_tabs_pressed]}>
            <Image source={home} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(1) && styles.navBar_textWhite]}>Domov</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(2)}
                     style={[styles.navBar_tabs, isActive(2) && styles.navBar_tabs_pressed]}>
            <Image source={home} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(2) && styles.navBar_textWhite]}>Recepty</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(3)}
                     style={[styles.navBar_tabs, isActive(3) && styles.navBar_tabs_pressed]}>
            <Image source={home} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(3) && styles.navBar_textWhite]}>Špajza</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(4)}
                     style={[styles.navBar_tabs, isActive(4) && styles.navBar_tabs_pressed]}>
            <Image source={home} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(4) && styles.navBar_textWhite]}>Blank</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(5)}
                     style={[styles.navBar_tabs, isActive(5) && styles.navBar_tabs_pressed]}>
            <Image source={home} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(5) && styles.navBar_textWhite]}>Blank</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    height: "fit-content"
  },
  topBar: {
    backgroundColor: "hsl(0, 0%, 95%)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
    elevation: 10,
    borderBottomRightRadius: 25,
    borderColor: "black",
    borderWidth: 1
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
    backgroundColor: "white",
    borderRadius: 10
  },
  navBar: {
    width: "100%",
    height: "fit-content",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  navBar_tabs: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
  },
  navBar_tabs_pressed: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    borderTopColor: "black",
    borderTopWidth: 1,
    transform: [{ translateY: -1 }]
  },
  navBar_img: {
    width: 30,
    height: 30
  },
  navBar_text: {
    fontSize: 13,
    fontWeight: "bold",
    color: "black"
  },
  navBar_textWhite: {
    fontSize: 13,
    fontWeight: "bold",
    color: "white"
  },
  contentContainer: {
    height: 791.5,
    display: "flex",
    justifyContent: "space-between"
  }
});

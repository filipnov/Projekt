// Dashboard.js
import React, { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import logo from "./assets/logo.png";
import home from "./assets/home.png";
import plus from "./assets/plus.png";
import recipes from "./assets/recipe-book.png";
import setting from "./assets/settings.png";
import storage from "./assets/storage.png";
import speedometer from "./assets/speedometer.png";
import account from "./assets/avatar.png";

export default function Dashboard({setIsLoggedIn}) {
  const navigation = useNavigation();
  const route = useRoute();

  // Get the nickname passed via route params, fallback to "User"
  const { nick } = route.params || { nick: "User" };

  // Keep track of which tab is active (1–4)
  const [activeTab, setActiveTab] = useState(1);

  // Function to check if tab is active
  const isActive = (tabIndex) => activeTab === tabIndex;

  const renderContent = () => {
    switch (activeTab){
      case 1:
        return<>
        <Text>Tu bude prehľad</Text>
          <View style={styles.caloriesDisplay}></View>
          <View style={styles.nutriDisplay_container}>
            <View style={styles.nutriDisplay}></View>
            <View style={styles.nutriDisplay}></View>
            <View style={styles.nutriDisplay}></View>
          </View>
        </> 
        

         case 2:
        return <Text>Tu budu receptyy</Text>

         case 3:
        return <Text>Tu bude špajza</Text>

         case 4:
        return <>
        <Pressable onPress={() => {
          setIsLoggedIn(false);
        navigation.reset({
      index: 0,
      routes: [{ name: "HomeScreen"}],
});
        }}><Text>Logout</Text></Pressable>
        <Text>Tu budu nastavenia</Text>
        </>

        default:
          return <Text>Oops, niečo sa pokazilo</Text>
    }
  }

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
        <View>{renderContent()}
        </View>

        {/*Nav bar*/}
        <View style={styles.navBar}>
          <Pressable onPress={() => setActiveTab(1)}
                     style={[styles.navBar_tabs, isActive(1) && styles.navBar_tabs_pressed]}>
            <Image source={speedometer} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(1) && styles.navBar_text_pressed]}>Prehľad</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(2)}
                     style={[styles.navBar_tabs, isActive(2) && styles.navBar_tabs_pressed]}>
            <Image source={recipes} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(2) && styles.navBar_text_pressed]}>Recepty</Text>
          </Pressable>

          <Pressable
                     style={styles.navBar_tab_Add}>
            <View style={styles.navBar_Add_container}><Image source={plus} style={styles.navBar_Add}></Image></View>
            <Text style={styles.navBar_text_Add}>Pridať</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(3)}
                     style={[styles.navBar_tabs, isActive(3) && styles.navBar_tabs_pressed]}>
            <Image source={storage} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(3) && styles.navBar_text_pressed]}>Špajza</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab(4)}
                     style={[styles.navBar_tabs, isActive(4) && styles.navBar_tabs_pressed]}>
          <Image source={setting} style={styles.navBar_img}></Image>
            <Text style={[styles.navBar_text, isActive(4) && styles.navBar_text_pressed]}>Nastavenia</Text>
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
    height: "auto"
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
    height: "auto",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  navBar_tabs: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 0.7
  },
    navBar_tab_Add: {
   height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    transform: [{ translateY: -10 }],
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderLeftColor: "black",
    borderLeftWidth: 1,
    borderRightColor: "black",
    borderRightWidth: 1
  },
  navBar_tabs_pressed: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 1
  },
  navBar_img: {
    width: 30,
    height: 30
  },
   navBar_Add: {
    width: 20,
    height: 20,
  },
  navBar_Add_container: {
    width: 45,
    height: 45,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center"
  },
  navBar_text: {
    fontSize: 13,
    color: "black"
  },
  navBar_text_pressed: {
    fontSize: 14,
    fontWeight: "700",
    color: "black",
  },
  navBar_text_Add: {
    fontSize: 15,
    fontWeight: "900",
    color: "black",
  },
  
  contentContainer: {
    height: 791.5,
    justifyContent: "space-between"
  },
  caloriesDisplay: {
    marginTop: 20,
    backgroundColor: "#1E1E1E",
    width: "90%",
    height: 200,
    borderRadius: 15,
    alignSelf: "center"
  },
  nutriDisplay_container: {
    width: "90%",
    height: 90,
    alignSelf: "center",
    marginTop: 30,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between"

  },
  nutriDisplay:{
    backgroundColor: "#1E1E1E",
    height: "100%",
    width: 115,
    borderRadius: 15
  }
});

import React, { useState, useEffect } from "react";
import { Pressable, Text, View, Switch } from "react-native";
import styles from "../../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function SettingsTab({
  setIsLoggedIn,
  setIsPer100g,
  navigation,
}) {
  const [checked100g, setChecked100g] = useState();
  const [checkedExpiration, setCheckedExpiration] = useState();

  useEffect(() => {
    (async () => {
      try {
        const storedValue = await AsyncStorage.getItem("isPer100g");
        if (storedValue !== null) {
          const parsed = JSON.parse(storedValue);
          setChecked100g(parsed);
          if (setIsPer100g) setIsPer100g(parsed);
        }
      } catch (err) {
        console.error("Chyba pri načítaní nastavení:", err);
      }
    })();
  }, []);

  const toggleSwitch100g = async (value) => {
    setChecked100g(value);
    if (setIsPer100g) setIsPer100g(value);
    console.log("Toggling 100g switch to:", value);
    try {
      await AsyncStorage.setItem("isPer100g", JSON.stringify(value));
    } catch (err) {
      console.error("Chyba pri ukladaní nastavení:", err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const storedValue = await AsyncStorage.getItem("expiration");
        if (storedValue !== null) {
          const parsed = JSON.parse(storedValue);
          setCheckedExpiration(parsed);
          if (setCheckedExpiration) setCheckedExpiration(parsed);
        }
      } catch (err) {
        console.error("Chyba pri načítaní nastavení:", err);
      }
    })();
  }, []);

  const toggleSwitchExpiration = async (value) => {
    setCheckedExpiration(value);
    if (setCheckedExpiration) setCheckedExpiration(value);
    console.log("Toggling expiration switch to:", value);
    try {
      await AsyncStorage.setItem("expiration", JSON.stringify(value));
    } catch (err) {
      console.error("Chyba pri ukladaní nastavení:", err);
    }
  };

  return (
    <>
      <View>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.logout_button_pressed : styles.logout_button
          }
          onPress={() => navigation.navigate("ProfileCompletition")}
        >
          <Text>Profil</Text>
        </Pressable>
      </View>
      <View style={{ padding: 20 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <Switch
            value={checked100g}
            onValueChange={toggleSwitch100g}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={checked100g ? "#fff" : "#f4f3f4"}
          />
          <Text style={{ marginLeft: 8 }}>Zobraziť hodnoty na 100 g</Text>
        </View>


        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <Switch
            value={checkedExpiration}
            onValueChange={toggleSwitchExpiration}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={checkedExpiration ? "#fff" : "#f4f3f4"}
          />
          <Text style={{ marginLeft: 8 }}>Zobraziť dátumy spotreby</Text>
        </View>

        <Pressable
          onPress={async () => {
            try {
              // 1️⃣ Vymazať všetky údaje používateľa z AsyncStorage
              const keysToRemove = [
                "userProfile",
                "products",
                "recipes",
                "dailyConsumption",
                "userEmail",
              //  "isPer100g",
                "userNick",
                "eatenTotals",
                "drunkWater",
                "mealBox",
              //  "expiration",
                "onboardingSeen",
              ];
              await AsyncStorage.multiRemove(keysToRemove);

              // 2️⃣ Odhlásiť používateľa v stave appky
              setIsLoggedIn(false);

              // 3️⃣ Navigovať na HomeScreen a resetovať stack
              navigation.reset({
                index: 0,
                routes: [{ name: "HomeScreen" }],
              });
            } catch (err) {
              console.error("Chyba pri odhlasovaní:", err);
            }
          }}
          style={({ pressed }) =>
            pressed ? styles.logout_button_pressed : styles.logout_button
          }
        >
          <Text style={styles.logout_button_text}>Odhlásiť sa</Text>
        </Pressable>
      </View>
    </>
  );
}

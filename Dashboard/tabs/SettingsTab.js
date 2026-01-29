import React, { useState, useEffect } from "react";
import {
  Pressable,
  Text,
  View,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import styles from "../../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsTab({
  setIsLoggedIn,
  setIsPer100g,
  navigation,
  setNick,
}) {
  const SERVER = "https://app.bitewise.it.com";

  const [checked100g, setChecked100g] = useState();
  const [checkedExpiration, setCheckedExpiration] = useState();

  const [nickModalVisible, setNickModalVisible] = useState(false);
  const [currentNick, setCurrentNick] = useState("");
  const [nickInput, setNickInput] = useState("");
  const [nickSaving, setNickSaving] = useState(false);

  //-------------Per 100g switch  ----------------
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
  //-------------Expiration switch  ----------------
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
  //-------------Nick change-----------------
  useEffect(() => {
    (async () => {
      try {
        const storedNick = await AsyncStorage.getItem("userNick");
        if (storedNick) setCurrentNick(storedNick);
      } catch (err) {
        console.error("Chyba pri načítaní prezývky:", err);
      }
    })();
  }, []);
  const openNickModal = () => {
    setNickInput(currentNick || "");
    setNickModalVisible(true);
  };

  const saveNick = async () => {
    const trimmedNick = (nickInput || "").trim();
    if (!trimmedNick) {
      Alert.alert("Chyba", "Prezývka nemôže byť prázdna.");
      return;
    }

    let email = null;
    try {
      email = await AsyncStorage.getItem("userEmail");
    } catch (err) {
      console.error("Chyba pri načítaní emailu:", err);
    }

    if (!email) {
      Alert.alert(
        "Chyba",
        "Nenašiel som email používateľa. Skús sa prosím odhlásiť a prihlásiť znova.",
      );
      return;

    }

    setNickSaving(true);
    try {
      const resp = await fetch(`${SERVER}/api/updateNick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nick: trimmedNick }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data.error || data.message || "Server vrátil chybu.";
        throw new Error(msg);
      }

      await AsyncStorage.setItem("userNick", trimmedNick);
      setCurrentNick(trimmedNick);
      if (setNick) setNick(trimmedNick);
      setNickModalVisible(false);
      Alert.alert("Hotovo", "Prezývka bola zmenená.");
    } catch (err) {
      Alert.alert(
        "Nepodarilo sa zmeniť prezývku",
        err?.message || "Skús to prosím neskôr.",
      );
    } finally {
      setNickSaving(false);
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

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.logout_button_pressed : styles.logout_button
          }
          onPress={openNickModal}
        >
          <Text>Zmeniť prezývku</Text>
        </Pressable>
      </View>

      <Modal visible={nickModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <Text style={styles.generatingModalTitle}>Zmeniť prezývku</Text>
            <TextInput
              value={nickInput}
              onChangeText={setNickInput}
              placeholder="Nová prezývka"
              autoCapitalize="words"
              style={styles.authTextInput}
              editable={!nickSaving}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Pressable
                style={({ pressed }) =>
                  pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
                }
                onPress={() => !nickSaving && saveNick()}
                disabled={nickSaving}
              >
                {nickSaving ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.authRegLogBtnText}>Uložiť</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) =>
                  pressed ? styles.authRegLogBtnPressed : styles.authRegLogBtn
                }
                onPress={() => !nickSaving && setNickModalVisible(false)}
                disabled={nickSaving}
              >
                <Text style={styles.authRegLogBtnText}>Zrušiť</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

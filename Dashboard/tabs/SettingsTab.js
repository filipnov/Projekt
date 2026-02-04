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

  useEffect(() => {
    AsyncStorage.getItem("isPer100g").then((storedValue) => {
      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue);
        setChecked100g(parsed);
        if (setIsPer100g) setIsPer100g(parsed);
      }
    });
  }, []);

  const toggleSwitch100g = (value) => {
    setChecked100g(value);
    if (setIsPer100g) setIsPer100g(value);
    AsyncStorage.setItem("isPer100g", JSON.stringify(value));
  };

  useEffect(() => {
    AsyncStorage.getItem("expiration").then((storedValue) => {
      if (storedValue !== null) setCheckedExpiration(JSON.parse(storedValue));
    });
  }, []);

  const toggleSwitchExpiration = (value) => {
    setCheckedExpiration(value);
    AsyncStorage.setItem("expiration", JSON.stringify(value));
  };

  useEffect(() => {
    AsyncStorage.getItem("userNick").then((storedNick) => {
      if (storedNick) setCurrentNick(storedNick);
    });
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

    const email = await AsyncStorage.getItem("userEmail");

    if (!email) {
      Alert.alert(
        "Chyba",
        "Nenašiel som email používateľa. Skús sa prosím odhlásiť a prihlásiť znova.",
      );
      return;
    }

    setNickSaving(true);
    const resp = await fetch(`${SERVER}/api/updateNick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nick: trimmedNick }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data.error || data.message || "Server vrátil chybu.";
      Alert.alert("Nepodarilo sa zmeniť prezývku", msg);
      setNickSaving(false);
      return;
    }

    await AsyncStorage.setItem("userNick", trimmedNick);
    setCurrentNick(trimmedNick);
    if (setNick) setNick(trimmedNick);
    setNickModalVisible(false);
    setNickSaving(false);
    Alert.alert("Hotovo", "Prezývka bola zmenená.");
  };

  const handleLogout = async () => {
    const keysToRemove = [
      "userProfile",
      "products",
      "recipes",
      "dailyConsumption",
      "userEmail",
      "userNick",
      "eatenTotals",
      "drunkWater",
      "mealBox",
      "onboardingSeen",
    ];
    await AsyncStorage.multiRemove(keysToRemove);
    setIsLoggedIn(false);
    navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
  };

  return (
    <>
      <View style={styles.settingLayout}>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.logout_button_pressed : styles.logout_button
          }
          onPress={() => navigation.navigate("ProfileCompletition")}
        >
          <Text style={styles.logout_button_text}>Profil</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) =>
            pressed ? styles.logout_button_pressed : styles.logout_button
          }
          onPress={openNickModal}
        >
          <Text style={styles.logout_button_text}>Zmeniť prezývku</Text>
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

            <View style={styles.nickModalButtonRow}>
              <Pressable
                style={({ pressed }) =>
                  pressed ? styles.nickModalButtonPressed : styles.nickModalButton
                }
                onPress={() => !nickSaving && saveNick()}
                disabled={nickSaving}
              >
                {nickSaving ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.nickModalButtonText}>Uložiť</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) =>
                  pressed ? styles.nickModalButtonPressed : styles.nickModalButton
                }
                onPress={() => !nickSaving && setNickModalVisible(false)}
                disabled={nickSaving}
              >
                <Text style={styles.nickModalButtonText}>Zrušiť</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ padding: 20 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20, margin: "auto" }}
        >
          <Switch
            value={checked100g}
            onValueChange={toggleSwitch100g}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={checked100g ? "#fff" : "#f4f3f4"}
          />
          <Text style={{ marginLeft: 8 }}>Hodnoty na 100 g</Text>
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20, margin: "auto" }}
        >
          <Switch
            value={checkedExpiration}
            onValueChange={toggleSwitchExpiration}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={checkedExpiration ? "#fff" : "#f4f3f4"}
          />
          <Text style={{ marginLeft: 8 }}>Dátumy spotreby</Text>
        </View>

        <Pressable
          onPress={handleLogout}
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

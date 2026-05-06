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
  ScrollView,
  Dimensions,
} from "react-native";
import styles from "../../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_WIDTH = Dimensions.get("window").width;

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

  const settingsContainerStyle = {
    flex: 1,
    backgroundColor: "hsla(0, 0%, 98%, 1)",
  };

  const headerStyle = {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 20,
    elevation: 8,
  };

  const headerTextStyle = {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    marginBottom: 5,
  };

  const headerSubtextStyle = {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  };

  const cardStyle = {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  };

  const cardHeaderStyle = {
    fontSize: 16,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1)",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(129, 190, 95, 0.2)",
  };

  const settingRowStyle = {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  };

  const settingLabelStyle = {
    fontSize: 15,
    fontWeight: "600",
    color: "hsla(0, 0%, 20%, 1)",
  };

  const settingDescriptionStyle = {
    fontSize: 12,
    color: "hsla(0, 0%, 50%, 1)",
    marginTop: 2,
  };

  return (
    <View style={settingsContainerStyle}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Profile Section */}
        <View style={cardStyle} {...{ marginTop: 20 }}>
          <Text style={cardHeaderStyle}>👤 Profil</Text>
          <Pressable
            style={({ pressed }) => [
              settingRowStyle,
              {
                backgroundColor: pressed
                  ? "rgba(129, 190, 95, 0.08)"
                  : "rgba(129, 190, 95, 0.03)",
                paddingHorizontal: 12,
                borderRadius: 12,
                marginBottom: 8,
              },
            ]}
            onPress={() => navigation.navigate("ProfileCompletition")}
          >
            <View style={{ flex: 1 }}>
              <Text style={settingLabelStyle}>Upraviť profil</Text>
              <Text style={settingDescriptionStyle}>
                Zmení svoje osobné údaje a zdravotné informácie
              </Text>
            </View>
            <Text style={{ fontSize: 18, marginLeft: 10 }}>→</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              settingRowStyle,
              {
                backgroundColor: pressed
                  ? "rgba(129, 190, 95, 0.08)"
                  : "rgba(129, 190, 95, 0.03)",
                paddingHorizontal: 12,
                borderRadius: 12,
              },
            ]}
            onPress={openNickModal}
          >
            <View style={{ flex: 1 }}>
              <Text style={settingLabelStyle}>Prezývka</Text>
              <Text style={settingDescriptionStyle}>
                Tvoja súčasná prezývka:{" "}
                <Text style={{ fontWeight: "600" }}>
                  {currentNick || "Používateľ"}
                </Text>
              </Text>
            </View>
            <Text style={{ fontSize: 18, marginLeft: 10 }}>→</Text>
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>🎯 Predvoľby</Text>

          <View
            style={[
              settingRowStyle,
              {
                paddingHorizontal: 12,
                backgroundColor: "rgba(129, 190, 95, 0.03)",
                borderRadius: 12,
                marginBottom: 12,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={settingLabelStyle}>Hodnoty na 100 g</Text>
              <Text style={settingDescriptionStyle}>
                Zobrazuj nápoje a potraviny na 100 g
              </Text>
            </View>
            <Switch
              value={checked100g}
              onValueChange={toggleSwitch100g}
              trackColor={{ false: "#D0D0D0", true: "#81BE5F" }}
              thumbColor={checked100g ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View
            style={[
              settingRowStyle,
              {
                paddingHorizontal: 12,
                backgroundColor: "rgba(129, 190, 95, 0.03)",
                borderRadius: 12,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={settingLabelStyle}>Dátumy spotreby</Text>
              <Text style={settingDescriptionStyle}>
                Sleduj dátumy expirácií produktov
              </Text>
            </View>
            <Switch
              value={checkedExpiration}
              onValueChange={toggleSwitchExpiration}
              trackColor={{ false: "#D0D0D0", true: "#81BE5F" }}
              thumbColor={checkedExpiration ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>🔐 Bezpečnosť</Text>

          <Pressable
            style={({ pressed }) => [
              settingRowStyle,
              {
                backgroundColor: pressed
                  ? "rgba(220, 53, 69, 0.1)"
                  : "rgba(220, 53, 69, 0.05)",
                paddingHorizontal: 12,
                borderRadius: 12,
              },
            ]}
            onPress={handleLogout}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  settingLabelStyle,
                  { color: "hsla(0, 73%, 60%, 0.96)" },
                ]}
              >
                Odhlásiť sa
              </Text>
              <Text style={settingDescriptionStyle}>
                Bezpečne sa odhlásiť z aplikácie
              </Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                marginLeft: 10,
                color: "hsla(0, 73%, 60%, 0.96)",
              }}
            >
              →
            </Text>
          </Pressable>
        </View>

        {/* Footer Note */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <Text
            style={{
              fontSize: 12,
              color: "hsla(0, 0%, 50%, 1)",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            Verzia aplikácie 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Nick Change Modal */}
      <Modal visible={nickModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.generatingModalContainer, { borderRadius: 20 }]}>
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <Text style={{ fontSize: 24, marginBottom: 10 }}>✏️</Text>
              <Text
                style={[
                  styles.generatingModalTitle,
                  { fontSize: 20, fontWeight: "700" },
                ]}
              >
                Zmeniť prezývku
              </Text>
            </View>

            <TextInput
              value={nickInput}
              onChangeText={setNickInput}
              placeholder="Nová prezývka"
              autoCapitalize="words"
              style={[
                styles.authTextInput,
                { marginBottom: 16, borderColor: "hsla(129, 56%, 43%, 0.5)" },
              ]}
              editable={!nickSaving}
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />

            <View style={styles.nickModalButtonRow}>
              <Pressable
                style={({ pressed }) =>
                  pressed
                    ? [
                        styles.nickModalButtonPressed,
                        { backgroundColor: "hsla(129, 56%, 43%, 0.8)" },
                      ]
                    : [
                        styles.nickModalButton,
                        { backgroundColor: "hsla(129, 56%, 43%, 1)" },
                      ]
                }
                onPress={() => !nickSaving && saveNick()}
                disabled={nickSaving}
              >
                {nickSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.nickModalButtonText}>Uložiť</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) =>
                  pressed
                    ? [
                        styles.nickModalButtonPressed,
                        { backgroundColor: "rgba(0, 0, 0, 0.08)" },
                      ]
                    : [
                        styles.nickModalButton,
                        { backgroundColor: "rgba(0, 0, 0, 0.05)" },
                      ]
                }
                onPress={() => !nickSaving && setNickModalVisible(false)}
                disabled={nickSaving}
              >
                <Text
                  style={[
                    styles.nickModalButtonText,
                    { color: "hsla(0, 0%, 15%, 1)" },
                  ]}
                >
                  Zrušiť
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

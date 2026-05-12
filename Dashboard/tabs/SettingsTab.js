import React, { useState, useEffect } from "react";
import {
  Pressable,
  Text,
  View,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import styles from "../../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME_OPTIONS, useAppTheme } from "../../ThemeContext";
import { useAlert } from "../../AlertContext";
import { SERVER_URL } from "../../config/serverConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SettingsTab({
  setIsLoggedIn,
  setIsPer100g,
  navigation,
  setNick,
}) {
  const { colors, isDark, resolvedTheme, setThemePreference, themePreference } = useAppTheme();
  const { showAlert } = useAlert();

  const [checked100g, setChecked100g] = useState();
  const [checkedExpiration, setCheckedExpiration] = useState();
  const [themeOptionsExpanded, setThemeOptionsExpanded] = useState(false);

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
      showAlert("Chyba", "Prezývka nemôže byť prázdna.");
      return;
    }

    const email = await AsyncStorage.getItem("userEmail");

    if (!email) {
      showAlert(
        "Chyba",
        "Nenašiel som email používateľa. Skús sa prosím odhlásiť a prihlásiť znova.",
      );
      return;
    }

    setNickSaving(true);
    const resp = await fetch(`${SERVER_URL}/api/updateNick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nick: trimmedNick }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data.error || data.message || "Server vrátil chybu.";
      showAlert("Nepodarilo sa zmeniť prezývku", msg);
      setNickSaving(false);
      return;
    }

    await AsyncStorage.setItem("userNick", trimmedNick);
    setCurrentNick(trimmedNick);
    if (setNick) setNick(trimmedNick);
    setNickModalVisible(false);
    setNickSaving(false);
    showAlert("Hotovo", "Prezývka bola zmenená.");
  };

  const handleLogout = async () => {
    const keysToRemove = [
      "userProfile",
      "products",
      "recipes",
      "dailyConsumption",
      "userEmail",
      "userNick",
      "userPass",
      "authProvider",
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    elevation: isDark ? 0 : 3,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const cardHeaderStyle = {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  };

  const settingDescriptionStyle = {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  };

  const rowBackground = colors.primarySoft;
  const rowPressedBackground = isDark
    ? "rgba(74, 222, 128, 0.18)"
    : "rgba(129, 190, 95, 0.08)";

  const arrowTextStyle = {
    fontSize: 18,
    marginLeft: 10,
    color: colors.mutedText,
  };
  const currentThemeOption =
    THEME_OPTIONS.find((option) => option.key === themePreference) ||
    THEME_OPTIONS[0];

  const themeSelectorStyle = {
    gap: 8,
    marginBottom: 14,
  };

  const themeOptionStyle = (isSelected, pressed) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.border,
    backgroundColor: isSelected
      ? colors.primarySoft
      : pressed
        ? colors.surfacePressed
        : colors.surfaceAlt,
  });

  const themeOptionLabelStyle = (isSelected) => ({
    fontSize: 14,
    fontWeight: "800",
    color: isSelected ? colors.primary : colors.text,
  });

  const themeOptionDescriptionStyle = {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  };

  const themeOptionCheckStyle = (isSelected) => ({
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: isSelected ? colors.primary : colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  });

  const themeOptionCheckInnerStyle = {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
                  ? rowPressedBackground
                  : rowBackground,
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
            <Text style={arrowTextStyle}>→</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              settingRowStyle,
              {
                backgroundColor: pressed
                  ? rowPressedBackground
                  : rowBackground,
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
            <Text style={arrowTextStyle}>→</Text>
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>🎯 Predvoľby</Text>

          <Pressable
            style={({ pressed }) => [
              settingRowStyle,
              {
                backgroundColor: pressed ? rowPressedBackground : rowBackground,
                paddingHorizontal: 12,
                borderRadius: 12,
                marginBottom: themeOptionsExpanded ? 8 : 12,
              },
            ]}
            onPress={() => setThemeOptionsExpanded((expanded) => !expanded)}
          >
            <View style={{ flex: 1 }}>
              <Text style={settingLabelStyle}>Vzhľad aplikácie</Text>
              <Text style={settingDescriptionStyle}>
                {currentThemeOption.label}
                {currentThemeOption.key === "system"
                  ? ` (${resolvedTheme === "dark" ? "tmavý" : "svetlý"})`
                  : ""}
              </Text>
            </View>
            <Text style={arrowTextStyle}>
              {themeOptionsExpanded ? "▲" : "▼"}
            </Text>
          </Pressable>

          {themeOptionsExpanded && (
            <View style={themeSelectorStyle}>
              {THEME_OPTIONS.map((option) => {
                const isSelected = themePreference === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={({ pressed }) => [
                      themeOptionStyle(isSelected, pressed),
                    ]}
                    onPress={() => {
                      setThemePreference(option.key);
                      setThemeOptionsExpanded(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={themeOptionLabelStyle(isSelected)}>
                        {option.label}
                      </Text>
                      <Text style={themeOptionDescriptionStyle}>
                        {option.key === "system"
                          ? `${option.description} (${resolvedTheme === "dark" ? "tmavý" : "svetlý"})`
                          : option.description}
                      </Text>
                    </View>
                    <View style={themeOptionCheckStyle(isSelected)}>
                      {isSelected && <View style={themeOptionCheckInnerStyle} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View
            style={[
              settingRowStyle,
              {
                paddingHorizontal: 12,
                backgroundColor: rowBackground,
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
                backgroundColor: rowBackground,
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
                  ? colors.dangerPressed
                  : colors.dangerSoft,
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
                  { color: colors.danger },
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
                color: colors.danger,
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
              color: colors.mutedText,
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.generatingModalContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 20,
              },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <Text style={{ fontSize: 24, marginBottom: 10 }}>✏️</Text>
              <Text
                style={[
                  styles.generatingModalTitle,
                  { color: colors.text, fontSize: 20, fontWeight: "700" },
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
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                  marginBottom: 16,
                },
              ]}
              editable={!nickSaving}
              placeholderTextColor={colors.placeholder}
            />

            <View style={styles.nickModalButtonRow}>
              <Pressable
                style={({ pressed }) =>
                  pressed
                    ? [
                        styles.nickModalButtonPressed,
                        { backgroundColor: colors.primaryPressed },
                      ]
                    : [
                        styles.nickModalButton,
                        { backgroundColor: colors.primary },
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
                        { backgroundColor: colors.surfacePressed },
                      ]
                    : [
                        styles.nickModalButton,
                        { backgroundColor: colors.surfaceAlt },
                      ]
                }
                onPress={() => !nickSaving && setNickModalVisible(false)}
                disabled={nickSaving}
              >
                <Text
                  style={[
                    styles.nickModalButtonText,
                    { color: colors.text },
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

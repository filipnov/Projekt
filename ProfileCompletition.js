// ProfileCompletition.js
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Image,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import arrow from "./assets/left_arrow.png";
import { useNavigation } from "@react-navigation/native";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

const SERVER = "https://app.bitewise.it.com";
const UPDATE_URL = `${SERVER}/api/updateProfile`;
const SCREEN_WIDTH = Dimensions.get("window").width;

const ACTIVITY_OPTIONS = [
  {
    label: "Sedavý",
    description: "Väčšinu času tráviš sedením. Pohybuješ sa skôr výnimočne.",
    value: 1.2,
  },
  {
    label: "Ľahko aktívny",
    description: "Občas sa postavíš a rozhýbeš, ale inak deň tráviš v sede.",
    value: 1.375,
  },
  {
    label: "Stredne aktívny",
    description: "Chodíš na prechádzky alebo robíš ľahký šport.",
    value: 1.55,
  },
  {
    label: "Veľmi aktívny",
    description: "Pravidelne a intenzívne športuješ.",
    value: 1.725,
  },
  {
    label: "Extrémne aktívny",
    description: "Denne robíš vytrvalostné fyzické výkony.",
    value: 1.9,
  },
];

export default function ProfileCompletition() {
  const navigation = useNavigation();

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("maintain");

  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState({
    label: "Ľahko aktívny",
    value: 1.375,
  });

  useEffect(() => {
    AsyncStorage.getItem("userEmail").then((value) => {
      if (value) setEmail(value);
    });
  }, []);

  useEffect(() => {
    if (!email) return;

    const loadUserProfile = async () => {
      const storedProfile = await AsyncStorage.getItem("userProfile");
      if (storedProfile) {
        const data = JSON.parse(storedProfile);
        setWeight(String(data.weight || ""));
        setHeight(String(data.height || ""));
        setAge(String(data.age || ""));
        setGender(data.gender || "male");
        setGoal(data.goal || "maintain");
        if (data.activityLevel) {
          setSelectedActivity({
            label: data.activityLabel || "Ľahko aktívny",
            value: data.activityLevel,
          });
        }
      }
    };

    loadUserProfile();
  }, [email]);

  async function handleCompletion() {
    if (!weight.trim() || !height.trim() || !age.trim()) {
      Alert.alert("Prosím vyplň všetky polia!");
      return;
    }

    if (!email) {
      Alert.alert("Chyba", "Email používateľa sa nenašiel");
      return;
    }

    const body = {
      email,
      weight: Number(weight.trim()),
      height: Number(height.trim()),
      age: Number(age.trim()),
      gender,
      activityLevel: selectedActivity.value,
      goal,
    };

    try {
      const resp = await fetch(UPDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(body));
        Alert.alert("Úspech", "Údaje boli uložené ✅");
        navigation.goBack();
      } else {
        Alert.alert("Chyba", data.error || "Server error");
      }
    } catch {
      Alert.alert("Network error", "Skús to prosím neskôr.");
    }
  }

  // Moderný štýl
  const containerStyle = {
    flex: 1,
    backgroundColor: "hsla(0, 0%, 98%, 1)",
  };

  const headerStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 16,
  };

  const backButtonStyle = {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  };

  const backIconStyle = {
    width: "100%",
    height: "100%",
  };

  const titleContainerStyle = {
    flex: 1,
  };

  const screenTitleStyle = {
    fontSize: 26,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1)",
  };

  const subtitleStyle = {
    fontSize: 13,
    color: "hsla(0, 0%, 50%, 1)",
    marginTop: 2,
    fontWeight: "500",
  };

  const cardStyle = {
    backgroundColor: "white",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  };

  const cardHeaderStyle = {
    fontSize: 15,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1)",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(129, 190, 95, 0.2)",
  };

  const inputLabelStyle = {
    fontSize: 14,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1)",
    marginTop: 10,
    marginBottom: 6,
  };

  const modernTextInputStyle = {
    backgroundColor: "rgba(129, 190, 95, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(129, 190, 95, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "hsla(0, 0%, 15%, 1)",
  };

  const buttonRowStyle = {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  };

  const modernButtonStyle = (isSelected, color = "hsla(129, 56%, 43%, 1)") => ({
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isSelected ? color : "rgba(0, 0, 0, 0.05)",
    borderWidth: isSelected ? 0 : 1.5,
    borderColor: isSelected ? color : "rgba(0, 0, 0, 0.1)",
    elevation: isSelected ? 1 : 0,
  });

  const modernButtonTextStyle = (isSelected) => ({
    color: isSelected ? "white" : "hsla(0, 0%, 20%, 1)",
    fontWeight: isSelected ? "700" : "600",
    fontSize: 13,
  });

  const selectButtonStyle = {
    backgroundColor: "rgba(129, 190, 95, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(129, 190, 95, 0.4)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 6,
    justifyContent: "center",
  };

  const primaryButtonStyle = {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 12,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  };

  const primaryButtonTextStyle = {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  };

  return (
    <SafeAreaView style={containerStyle} edges={["top"]}>
      <KeyboardWrapper
        style={containerStyle}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Modern Header */}
        <View style={headerStyle}>
          <Pressable
            style={({ pressed }) => [
              backButtonStyle,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Image source={arrow} style={backIconStyle} />
          </Pressable>
          <View style={titleContainerStyle}>
            <Text style={screenTitleStyle}>👤 Tvoj profil</Text>
            <Text style={subtitleStyle}>Uprav svoje osobné údaje</Text>
          </View>
        </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Body Measurements Card */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>📏 Telesné miery</Text>

          <Text style={inputLabelStyle}>Výška (cm)</Text>
          <TextInput
            placeholder="Zadaj výšku"
            style={modernTextInputStyle}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholderTextColor="rgba(0, 0, 0, 0.3)"
          />

          <Text style={inputLabelStyle}>Váha (kg)</Text>
          <TextInput
            placeholder="Zadaj váhu"
            style={modernTextInputStyle}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholderTextColor="rgba(0, 0, 0, 0.3)"
          />

          <Text style={inputLabelStyle}>Vek (rokov)</Text>
          <TextInput
            placeholder="Zadaj vek"
            style={modernTextInputStyle}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholderTextColor="rgba(0, 0, 0, 0.3)"
          />
        </View>

        {/* Gender Card */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>⚧ Pohlavie</Text>

          <View style={buttonRowStyle}>
            <Pressable
              style={modernButtonStyle(gender === "male", "#2196F3")}
              onPress={() => setGender("male")}
            >
              <Text style={modernButtonTextStyle(gender === "male")}>
                👨 Muž
              </Text>
            </Pressable>

            <Pressable
              style={modernButtonStyle(gender === "female", "#E91E63")}
              onPress={() => setGender("female")}
            >
              <Text style={modernButtonTextStyle(gender === "female")}>
                👩 Žena
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Activity Level Card */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>🏃 Úroveň aktivity</Text>

          <Pressable
            style={selectButtonStyle}
            onPress={() => setActivityModalVisible(true)}
          >
            <Text
              style={{ color: "hsla(0, 0%, 15%, 1)", fontWeight: "600", fontSize: 15 }}
            >
              {selectedActivity.label} →
            </Text>
            <Text
              style={{
                color: "hsla(0, 0%, 50%, 1)",
                fontSize: 12,
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              {selectedActivity.label === "Sedavý"
                ? "Väčšinu času v sede"
                : selectedActivity.label === "Ľahko aktívny"
                  ? "Občas v pohybe"
                  : selectedActivity.label === "Stredne aktívny"
                    ? "Pravidelný pohyb"
                    : selectedActivity.label === "Veľmi aktívny"
                      ? "Intenzívny šport"
                      : "Extrémy výkony"}
            </Text>
          </Pressable>
        </View>

        {/* Goal Card */}
        <View style={cardStyle}>
          <Text style={cardHeaderStyle}>🎯 Cieľ</Text>

          <View style={buttonRowStyle}>
            <Pressable
              style={modernButtonStyle(goal === "lose", "#2196F3")}
              onPress={() => setGoal("lose")}
            >
              <Text style={modernButtonTextStyle(goal === "lose")}>
                ⬇️ Chudnúť
              </Text>
            </Pressable>

            <Pressable
              style={modernButtonStyle(goal === "maintain", "#4CAF50")}
              onPress={() => setGoal("maintain")}
            >
              <Text style={modernButtonTextStyle(goal === "maintain")}>
                ➡️ Udržať
              </Text>
            </Pressable>

            <Pressable
              style={modernButtonStyle(goal === "gain", "#FF6B6B")}
              onPress={() => setGoal("gain")}
            >
              <Text style={modernButtonTextStyle(goal === "gain")}>
                ⬆️ Pribrať
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [
            primaryButtonStyle,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleCompletion}
        >
          <Text style={primaryButtonTextStyle}>💾 Uložiť údaje</Text>
        </Pressable>
      </ScrollView>

      {/* Activity Modal */}
      <Modal visible={activityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: "white",
                borderRadius: 20,
                maxHeight: "85%",
              },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🏃</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "hsla(0, 0%, 15%, 1)",
                }}
              >
                Vyber úroveň aktivity
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "hsla(0, 0%, 50%, 1)",
                  marginTop: 4,
                }}
              >
                Výber vplýva na tvoje denné kalórie
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {ACTIVITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor:
                      selectedActivity?.label === option.label
                        ? "rgba(129, 190, 95, 0.1)"
                        : "transparent",
                    borderRadius: 12,
                    borderWidth: selectedActivity?.label === option.label ? 1.5 : 0,
                    borderColor: "rgba(129, 190, 95, 0.3)",
                  }}
                  onPress={() => {
                    setSelectedActivity(option);
                    setActivityModalVisible(false);
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor:
                        selectedActivity?.label === option.label
                          ? "hsla(129, 56%, 43%, 1)"
                          : "hsla(0, 0%, 50%, 1)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    {selectedActivity?.label === option.label && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "hsla(129, 56%, 43%, 1)",
                        }}
                      />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 15,
                        color: "hsla(0, 0%, 15%, 1)",
                        marginBottom: 2,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{
                        color: "hsla(0, 0%, 50%, 1)",
                        fontSize: 12,
                        fontWeight: "500",
                        lineHeight: 16,
                      }}
                    >
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={primaryButtonStyle}
              onPress={() => setActivityModalVisible(false)}
            >
              <Text style={primaryButtonTextStyle}>Zavrieť</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardWrapper>
    </SafeAreaView>
  );
}

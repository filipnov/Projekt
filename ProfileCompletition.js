// ProfileCompletition.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import arrow from "./assets/left-arrow.png";
import { useNavigation } from "@react-navigation/native";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

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

  const [loading, setLoading] = useState(false); // nový stav pre spinner

  const SERVER = "https://app.bitewise.it.com";
  const UPDATE_URL = `${SERVER}/api/updateProfile`;

  useEffect(() => {
    AsyncStorage.getItem("userEmail").then((value) => {
      if (value) setEmail(value);
    });
  }, []);

  useEffect(() => {
    if (!email) return;

    const loadUserProfile = async () => {
      try {
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
        } else {
          const response = await fetch(`${SERVER}/api/userProfile?email=${email}`);
          const data = await response.json();
          if (response.ok) {
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
            await AsyncStorage.setItem("userProfile", JSON.stringify(data));
          } else {
            console.warn("Nepodarilo sa načítať profil:", data.error);
          }
        }
      } catch (err) {
        console.error("Chyba pri načítaní profilu:", err);
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

    setLoading(true); // zapnúť spinner

    try {
      const resp = await fetch(UPDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        try {
          await AsyncStorage.setItem("userProfile", JSON.stringify(body));
        } catch (err) {
          console.error("Error saving profile locally:", err);
        }
        Alert.alert("Úspech", "Údaje boli uložené ✅");
        navigation.goBack();
      } else {
        Alert.alert("Chyba", data.error || "Server error");
      }
    } catch (err) {
      Alert.alert("Network error", err.message);
    } finally {
      setLoading(false); // vypnúť spinner
    }
  }

  return (
    <KeyboardWrapper style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Spinner Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />
            <Text style={styles.generatingModalTitle}>Ukladám údaje...</Text>
            <Text style={styles.generatingModalSubtitle}>Môže to trvať niekoľko sekúnd</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.formContainer}>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.backButtonPressed : styles.backButton
          }
          onPress={() => navigation.goBack()}
        >
          <Image source={arrow} style={styles.backIcon} />
        </Pressable>

        <Text style={styles.screenTitle}>Uprav svoj profil</Text>

        {/* TextInputs a ostatné UI prvky ostávajú nezmenené */}
        <Text style={styles.inputLabel}>Výška (cm):</Text>
        <TextInput
          placeholder="cm"
          style={styles.textInput}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Váha (kg):</Text>
        <TextInput
          placeholder="kg"
          style={styles.textInput}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Vek:</Text>
        <TextInput
          placeholder="rokov"
          style={styles.textInput}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Pohlavie:</Text>
        <View style={styles.optionRow}>
          <Pressable
            onPress={() => setGender("male")}
            style={[styles.optionButton, { backgroundColor: gender === "male" ? "#2196F3" : "#ccc" }]}
          >
            <Text style={styles.optionText}>Muž</Text>
          </Pressable>

          <Pressable
            onPress={() => setGender("female")}
            style={[styles.optionButton, { backgroundColor: gender === "female" ? "#E91E63" : "#ccc" }]}
          >
            <Text style={styles.optionText}>Žena</Text>
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Úroveň aktivity:</Text>
        <Pressable style={styles.selectButton} onPress={() => setActivityModalVisible(true)}>
          <Text style={{ color: "black" }}>{selectedActivity.label}</Text>
        </Pressable>

        <Text style={styles.inputLabel}>Cieľ:</Text>
        <View style={styles.optionRow}>
          <Pressable
            onPress={() => setGoal("lose")}
            style={[styles.optionButton, { backgroundColor: goal === "lose" ? "#2196F3" : "#ccc" }]}
          >
            <Text style={styles.optionText}>Chudnúť</Text>
          </Pressable>

          <Pressable
            onPress={() => setGoal("maintain")}
            style={[styles.optionButton, { backgroundColor: goal === "maintain" ? "#4CAF50" : "#ccc" }]}
          >
            <Text style={styles.optionText}>Udržať sa</Text>
          </Pressable>

          <Pressable
            onPress={() => setGoal("gain")}
            style={[styles.optionButton, { backgroundColor: goal === "gain" ? "#E91E63" : "#ccc" }]}
          >
            <Text style={styles.optionText}>Pribrať</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleCompletion}>
          <Text style={styles.primaryButtonText}>Uložiť údaje</Text>
        </Pressable>
      </View>

      {/* Activity selection modal ostáva nezmenený */}
      <Modal visible={activityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Vyber úroveň aktivity</Text>
            <ScrollView>
              {[
                { label: "Sedavý", description: "Väčšinu času tráviš sedením. Pohybuješ sa skôr výnimočne.", value: 1.2 },
                { label: "Ľahko aktívny", description: "Občas sa postavíš a rozhýbeš, ale inak deň tráviš v sede.", value: 1.375 },
                { label: "Stredne aktívny", description: "Chodíš na prechádzky alebo robíš ľahký šport.", value: 1.55 },
                { label: "Veľmi aktívny", description: "Pravidelne a intenzívne športuješ.", value: 1.725 },
                { label: "Extrémne aktívny", description: "Denne robíš vytrvalostné fyzické výkony.", value: 1.9 },
              ].map((option) => (
                <Pressable
                  key={option.label}
                  style={styles.activityOption}
                  onPress={() => {
                    setSelectedActivity(option);
                    setActivityModalVisible(false);
                  }}
                >
                  <View style={styles.radioCircleOuter}>
                    {selectedActivity?.label === option.label && <View style={styles.radioCircleInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>{option.label}</Text>
                    <Text style={styles.modalDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable style={styles.primaryButton} onPress={() => setActivityModalVisible(false)}>
              <Text style={styles.primaryButtonText}>Zavrieť</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardWrapper>
  );
}

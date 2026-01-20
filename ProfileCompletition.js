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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import arrow from "./assets/left-arrow.png";
import { useNavigation } from "@react-navigation/native";

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

  const SERVER = "https://app.bitewise.it.com";
  const UPDATE_URL = `${SERVER}/api/updateProfile`;

  useEffect(() => {
    AsyncStorage.getItem("userEmail").then((value) => {
      if (value) setEmail(value);
    });
  }, []);

  useEffect(() => {
    if (!email) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${SERVER}/api/userProfile?email=${email}`
        );
        const data = await response.json();

        if (response.ok) {
          setWeight(String(data.weight || ""));
          setHeight(String(data.height || ""));
          setAge(String(data.age || ""));
          setGender(data.gender || "male");
          setGoal(data.goal || "maintain");
          if (data.activityLevel) {
            const activityOption = {
              label: data.activityLabel || "Ľahko aktívny",
              value: data.activityLevel,
            };
            setSelectedActivity(activityOption);
          }
        } else {
          console.warn("Nepodarilo sa načítať profil:", data.error);
        }
      } catch (err) {
        console.error("Chyba pri načítaní profilu:", err);
      }
    };

    fetchUserProfile();
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
    }
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <Pressable
          style={({ pressed }) =>
            pressed ? styles.arrow_pressed : styles.arrow_container
          }
          onPress={() => navigation.goBack()}
        >
          <Image source={arrow} style={styles.arrow} />
        </Pressable>
        <Text style={styles.header}>Uprav svoj profil</Text>

        <Text style={styles.label}>Výška (cm):</Text>
        <TextInput
          placeholder="cm"
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Váha (kg):</Text>
        <TextInput
          placeholder="kg"
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Vek:</Text>
        <TextInput
          placeholder="rokov"
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Pohlavie:</Text>
        <View style={styles.genderContainer}>
          <Pressable
            onPress={() => setGender("male")}
            style={[
              styles.genderButton,
              { backgroundColor: gender === "male" ? "#2196F3" : "#ccc" },
            ]}
          >
            <Text style={styles.genderText}>Muž</Text>
          </Pressable>

          <Pressable
            onPress={() => setGender("female")}
            style={[
              styles.genderButton,
              { backgroundColor: gender === "female" ? "#E91E63" : "#ccc" },
            ]}
          >
            <Text style={styles.genderText}>Žena</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Úroveň aktivity:</Text>
        <Pressable
          style={styles.activityButton}
          onPress={() => setActivityModalVisible(true)}
        >
          <Text style={{ color: "black" }}>{selectedActivity.label}</Text>
        </Pressable>

        <Text style={styles.label}>Cieľ:</Text>
        <View style={styles.genderContainer}>
          <Pressable
            onPress={() => setGoal("lose")}
            style={[
              styles.genderButton,
              { backgroundColor: goal === "lose" ? "#2196F3" : "#ccc" },
            ]}
          >
            <Text style={styles.genderText}>Chudnúť</Text>
          </Pressable>

          <Pressable
            onPress={() => setGoal("maintain")}
            style={[
              styles.genderButton,
              { backgroundColor: goal === "maintain" ? "#4CAF50" : "#ccc" },
            ]}
          >
            <Text style={styles.genderText}>Udržať sa</Text>
          </Pressable>

          <Pressable
            onPress={() => setGoal("gain")}
            style={[
              styles.genderButton,
              { backgroundColor: goal === "gain" ? "#E91E63" : "#ccc" },
            ]}
          >
            <Text style={styles.genderText}>Pribrať</Text>
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={handleCompletion}>
          <Text style={styles.buttonText}>Uložiť údaje</Text>
        </Pressable>
      </View>

      <Modal visible={activityModalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Vyber úroveň aktivity</Text>
            <ScrollView>
              {[
                {
                  label: "Sedavý",
                  description:
                    "Väčšinu času tráviš sedením. Pohybuješ sa skôr výnimočne.",
                  value: 1.2,
                },
                {
                  label: "Ľahko aktívny",
                  description:
                    "Občas sa postavíš a rozhýbeš, ale inak deň tráviš v sede. Chodíš krátke vzdialenosti alebo vykonávaš ľahké domáce práce.",
                  value: 1.375,
                },
                {
                  label: "Stredne aktívny",
                  description:
                    "Chodíš na prechádzky, prácuješ v záhrade, robíš náročnejšie domáce práce alebo aj ľahký šport.",
                  value: 1.55,
                },
                {
                  label: "Veľmi aktívny",
                  description:
                    "Pravidelne a intenzívne športuješ alebo robíš iné náročnejšie aktivity.",
                  value: 1.725,
                },
                {
                  label: "Extrémne aktívny",
                  description:
                    "Denne robíš vytrvalostné fyzické výkony. Napríklad beháš maratóny, máš náročný intervalový tréning alebo robíš športy ako veslovanie a triatlon.",
                  value: 1.9,
                },
              ].map((option) => (
                <Pressable
                  key={option.label}
                  style={styles.option}
                  onPress={() => {
                    setSelectedActivity(option);
                    setActivityModalVisible(false);
                  }}
                >
                  <View style={styles.radioOuter}>
                    {selectedActivity?.label === option.label && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labelModal}>{option.label}</Text>
                    <Text style={styles.description}>{option.description}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.button}
              onPress={() => setActivityModalVisible(false)}
            >
              <Text style={styles.buttonText}>Zavrieť</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 50,
    width: "85%",
    alignSelf: "center",
  },
  header: {
    fontSize: 25,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  input: {
    backgroundColor: "white",
    fontSize: 14,
    fontWeight: "400",
    width: 160,
    height: 40,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    marginTop: 20,
    borderRadius: 6,
    width: "50%",
    alignItems: "center",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  arrow_container: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  arrow: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50,
  },
  arrow_pressed: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    marginBottom: 15,
  },
  genderContainer: {
    flexDirection: "row",
    width: "90%",
    marginTop: 5,
    alignSelf: "center",
  },
  genderButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  genderText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  activityButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    fontSize: 14,
    fontWeight: "400",
    width: 160,
    height: 40,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 3,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#333",
  },
  labelModal: {
    fontWeight: "500",
    marginBottom: 2,
  },
  description: {
    color: "#555",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});

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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import arrow from "./assets/left-arrow.png";
import { useNavigation } from "@react-navigation/native";
import DropDownPicker from "react-native-dropdown-picker";

export default function ProfileCompletition() {
  const navigation = useNavigation();

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("maintain");
  const [value, setValue] = useState(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Žiadna - sedavá", value: 1.2 },
    { label: "Ľahká - 1–3× týždenne", value: 1.375 },
    { label: "Stredná - 3–5× týždenne", value: 1.55 },
    { label: "Ťažká - 6–7× týždenne", value: 1.725 },
    { label: "Veľmi ťažká - každý deň + fyzická práca", value: 1.9 },
  ]);

  const SERVER = "http://10.0.2.2:3000";
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
          setValue(data.activityLevel || null);
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
    if (
      !weight.trim() ||
      !height.trim() ||
      !age.trim() ||
      !gender.trim() ||
      !goal.trim()
    ) {
      Alert.alert("Prosím vyplň všetky polia!");
      return;
    }

    if (!email) {
      Alert.alert("Chyba", "Email používateľa sa nenašiel");
      return;
    }

    const body = {
      email: email,
      weight: Number(weight.trim()),
      height: Number(height.trim()),
      age: Number(age.trim()),
      gender: gender,
      activityLevel: value,
      goal: goal,
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
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify({
              weight: Number(weight.trim()),
              height: Number(height.trim()),
              age: Number(age.trim()),
              gender,
              activityLevel: value,
              goal,
            })
          );
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

  const saveProfileLocally = async (profile) => {
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    } catch (err) {
      console.error("Error saving profile locally:", err);
    }
  };

  useEffect(() => {
    const profile = {
      weight: weight ? Number(weight.trim()) : null,
      height: height ? Number(height.trim()) : null,
      age: age ? Number(age.trim()) : null,
      gender,
      activityLevel: value,
      goal,
    };

    saveProfileLocally(profile);
  }, [weight, height, age, gender, value, goal]);

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

        <View>
          <Text style={styles.label}>Úroveň aktivity:</Text>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems}
            placeholder="Vyber aktivitu"
          />
        </View>
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.label}>Cieľ:</Text>
      </View>

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
});

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
  const [gender, setGender] = useState("male"); // "male" alebo "female"

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([]);
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
      email: email,
      weight: Number(weight.trim()),
      height: Number(height.trim()),
      age: Number(age.trim()),
      gender: gender,
      activityLevel: value,
    };

    try {
      const resp = await fetch(UPDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        setWeight("");
        setHeight("");
        setAge("");
        Alert.alert("Úspech", "Údaje boli uložené ✅");
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
        <Pressable onPress={() => navigation.navigate("Dashboard")}>
          <Image source={arrow} style={styles.arrow} />
        </Pressable>
        <Text style={styles.header}>Dokončite svoj profil</Text>

        <Text style={styles.label}>Váha (kg):</Text>
        <TextInput
          placeholder="kg"
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Výška (cm):</Text>
        <TextInput
          placeholder="cm"
          style={styles.input}
          value={height}
          onChangeText={setHeight}
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
          <DropDownPicker
            multiple={false} // umožní vybrať viac položiek
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

      <Pressable style={styles.button} onPress={handleCompletion}>
        <Text style={styles.buttonText}>Uložiť údaje</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    margin: 25,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    marginTop: 10,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    width: "50%",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    marginTop: 20,
    borderRadius: 6,
    width: "50%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  arrow: {
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 10,
  },
  genderContainer: {
    flexDirection: "row",
    marginTop: 5,
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
  },
});

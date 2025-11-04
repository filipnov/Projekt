import { useState, useEffect } from "react";
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

export default function ProfileCompletition() {
  const navigation = useNavigation();

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

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
      </View>

      <Pressable style={styles.button} onPress={handleCompletion}>
        <Text style={styles.buttonText}>Uložiť údaje</Text>
      </Pressable>
    </>
  );
}

// --- STYLES ---
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
});

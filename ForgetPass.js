// ForgetPass.js
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo.png";
import arrow from "./assets/left-arrow.png";
import styles from "./styles"
import KeyboardWrapper from "./KeyboardWrapper";

export default function PasswordForgetScreen() {

  const SERVER_URL = "https://app.bitewise.it.com"
  const navigation = useNavigation();

    const [email, setEmail] = useState("");

    const handleForgot = async () => {
      try{
        const res = await fetch(`${SERVER_URL}/api/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.ok) {
      Alert.alert("Succes", "Check your email for reset link! ");
    }
    else{
      Alert.alert("Error", data.error);
    }
      }
      catch (err){
        Alert.alert("Error", "Something went wrong");
        console.error(err);
      }
    };

   

  return (
    <KeyboardWrapper style={styles.screenWrapper}>
      <View style={styles}>
        <Image style={styles} />

    <View style={styles.cardBox}>
      <Text style={styles.headingText}>Zabudli ste heslo?</Text>

      <Text style={styles.descriptionText}>
        Zadajte do polia nižšie e-mail použitý na registráciu
        a my Vám pošleme odkaz na zresetovanie vásho hesla.
      </Text>

      <TextInput
        placeholder="e-mail"
        value={email}
        onChangeText={setEmail}
        style={styles.emailInput}
      />

      <Pressable
        style={({ pressed }) =>
          pressed ? styles.submitButtonPressed : styles.submitButton
        }
        onPress={handleForgot}
      >
        <Text style={styles.submitButtonText}>Poslať link</Text>
      </Pressable>
    </View>

    <Pressable
      style={({ pressed }) =>
        pressed ? styles.backNavPressed : styles.backNav
      }
      onPress={() => navigation.navigate("HomeScreen")}
    >
      <Image source={arrow} style={styles.backIcon} />
    </Pressable>
      </View>
    </KeyboardWrapper>

  );
}

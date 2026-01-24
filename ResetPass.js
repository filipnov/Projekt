// ResetPass.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo.png";
import arrow from "./assets/left-arrow.png";
import * as Linking from "expo-linking";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function ResetPasswordScreen({ route }) {
  const SERVER_URL = "https://app.bitewise.it.com"
  const navigation = useNavigation();

  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    //Get token from route params or deep link
    const params = route.params || {};
    if (params.token) {
      setToken(params.token);
    }
    else{
      // fallback: parse initial URL
      Linking.getInitialURL().then(url => {
        if (url){
          const parsed = Linking.parse(url);
          if (parsed.queryParams?.token){
            setToken(parsed.queryParams.token);
          }
        }
      });
    }
  }, []);

   const handleReset = async () => {
    if(!newPassword) {
      return Alert.alert("Error", "Enter new password");
    }

    try{
      const res = await fetch(`${SERVER_URL}/api/reset-password`, {
        method: "POST",
        headers: {"Content-Type" : "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (data.ok){
        Alert.alert("Succes", "Password has been reset");
      }
      else{
        Alert.alert("Error", data.error);
      }
    }

    catch (err){
      Alert.alert("Error", "Something went wrong");
      console.error(err);
    }}

  return (
  <KeyboardWrapper style={styles.mainLayout}>
    <View style={styles.bgImage}>

      <View style={styles.cardContainer}>
        <TextInput
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.textInput}
        />
        <Pressable onPress={handleReset} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Resetovať heslo</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) =>
          pressed ? styles.backArrowPressed : styles.backArrowContainer
        }
        onPress={() => navigation.navigate("HomeScreen")}
      >
        <Image source={arrow} style={styles.backArrow} />
      </Pressable>
    </View>
  </KeyboardWrapper>
);
}
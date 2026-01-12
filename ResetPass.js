// ResetPass.js
import React, { useState, useEffect } from "react";
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
import * as Linking from "expo-linking";




export default function ResetPasswordScreen({ route }) {
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
      const res = await fetch("http://10.0.2.2:3000/api/reset-password", {
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
    }

   }

  return (
    <View style={styles.layout}>
      <View style={styles.image}>

        <View style={styles.container}>
          <TextInput  placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
                     ></TextInput>
          <Pressable onPress={handleReset}><Text>Resetovat heslo</Text></Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("HomeScreen")}>
          <Image source={arrow} style={styles.arrow} />
        </Pressable>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  layout: {
   flex: 1,
    backgroundColor: "#618a335d",
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  image: {
    resizeMode: "cover",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
     height: 200,
    width: 200,
    marginBottom: 20,
    ckgroundColor: "white",
    borderRadius: 20,
  },
  arrow: {
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 30,
  },
  arrow_pressed: {
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 30,
    opacity: 0.8
  },
  text: {
   fontSize: 50,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)"
  },
  container: {
    backgroundColor: "hsla(0, 0%, 100%, 0.65)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    height: 500,
    width: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
     backgroundColor: "white",
    fontSize: 20,
    fontWeight: "200",
    width: 240,
    height: 55,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6,
  },
  info_text: {
    fontWeight: "800",
    fontSize: 14,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
    color: "hsla(0, 0%, 15%, 1.00)"
  },
  button: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  button_text: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
});

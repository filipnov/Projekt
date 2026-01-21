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
  import styles from "../styles";




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
    <View style={styles.layout}>
      <View style={styles.image}>
            <Image style={styles.avatar} source={logo} />
        <View style={styles.container}>
          <Text style={styles.text}>Zabudli ste heslo?</Text>
          <Text style={styles.info_text}
          >Zadajte do polia nižšie e-mail použitý na registráciu
           a my Vám pošleme odkaz na zresetovanie vásho hesla.
           </Text>
          <TextInput placeholder="e-mail"
                     value={email}
                     onChangeText={setEmail}
                     style={styles.input}
                     ></TextInput>
          <Pressable style={({pressed}) => 
                     pressed ? styles.button_pressed : styles.button}
                     onPress={handleForgot}>
          <Text style={styles.button_text}>Poslať link</Text>
          </Pressable>
        </View>

        <Pressable style={({pressed}) => 
          pressed ? styles.arrow_pressed : styles.arrow_container} onPress={() => navigation.navigate("HomeScreen")}>
          <Image source={arrow} style={styles.arrow} />
        </Pressable>
      </View>
    </View>
  );
}

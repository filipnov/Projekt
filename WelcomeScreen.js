// ForgetPass.js
import { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo-slogan.png";
import styles from "./styles"
import KeyboardWrapper from "./KeyboardWrapper";

export default function WelcomeScreen() {

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
    <KeyboardWrapper style={styles.mainLayout}>

        <Image style={styles.logo_slogan} source={logo} />

    <View style={styles.cardContainer}>
      <Text style={styles.welcomeTitle}>Vitaj u nás!</Text>

      <Text style={styles.welcomeText}>
       Míňaj menej jedla, jedz múdrejšie.
Naskenuj svoje potraviny, objav recepty z toho, čo máš doma, a sleduj svoje výživové ciele, jednoducho a prehľadne.
Zníž plýtvanie potravín, sleduj kalórie, živiny aj pitný režim, všetko na jednom mieste.
      </Text>

      <Pressable
        style={({ pressed }) =>
          pressed ? styles.loginBtnPressed : styles.loginBtn
        }
        onPress={() => {navigation.navigate("HomeScreen")}}
      >
        <Text style={styles.loginBtnText}>Už mám účet</Text>
      </Pressable>
       <Pressable
        style={({ pressed }) =>
          pressed ? styles.registerBtnPressed : styles.registerBtn
        }
        onPress={() => {navigation.navigate("RegistrationScreen")}}
      >
        <Text style={styles.registerBtnText}>Zaregistrovať sa</Text>
      </Pressable>
    </View>  
    </KeyboardWrapper>

  );
}

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





export default function PasswordForgetScreen() {
  const navigation = useNavigation();

    const [email, setEmail] = useState("");

    const handleForgot = async () => {
      try{
        const res = await fetch("http://10.0.2.2:3000/api/forgot-password", {
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
    backgroundColor: "white",
    borderRadius: 20,
  },
  arrow_container: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40
  },
  arrow: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50
  },
  arrow_pressed: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    opacity: 0.8
  },
  text: {
   fontSize: 38,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
    marginTop: 15,
    marginBottom: 15
  },
  container: {
    backgroundColor: "hsla(0, 0%, 100%, 0.65)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    height: 360,
    width: 340,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 15
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
    marginBottom: 15,
    textAlign: "center",
    elevation: 6
  },
  info_text: {
    fontWeight: "600",
    fontSize: 17,
    marginTop: 5,
    alignSelf: "flex-start",
    textAlign: "leftr",
    color: "hsla(0, 0%, 15%, 1.00)",
    marginBottom: 20
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

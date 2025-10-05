// HomeScreen.js
import React from 'react';
import { StyleSheet, Text, View, ImageBackground, Image, TextInput, Pressable, Linking } from 'react-native';
import background from "./assets/background.png";
import logo from "./assets/logo.png";
import arrow from "./assets/left-arrow.png"
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.layout}>
      <ImageBackground source={background} style={styles.image}>
        <Image style={styles.avatar} source={logo} />
        <View style={styles.container}>
          <Text style={styles.text}>Registruj sa!</Text>
          <Text style={styles.info_text}>Zadaj email:</Text>
          
          <TextInput placeholder='e-mail' style={styles.input_email} />
          <Text style={styles.info_text}>Zadaj ako ťa máme volať:</Text>
          <TextInput placeholder='prezývka' style={styles.input_password} />
          <Text style={styles.info_text}>Zadaj svoje heslo:</Text>
          <TextInput placeholder='heslo' style={styles.input_password} />
          <Text style={styles.info_text}>Zopakuj heslo:</Text>
          <TextInput placeholder='heslo znova' style={styles.input_password} />

          <Pressable style={({pressed})=> 
            pressed ? styles.button_register_pressed : styles.button_register
          } onPress={() => navigation.navigate("RegistrationScreen")}>
            <Text style={styles.button_text_register}>Registrovať sa!</Text>
          </Pressable>
        </View>
        <Pressable style={({pressed}) => 
        pressed ? styles.arrow_pressed :""} onPress={() => navigation.navigate("HomeScreen")}><Image source={arrow} style={styles.arrow} ></Image></Pressable>
      </ImageBackground>
      
    </View>
  );
}
const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    height: "100%"
  },
  image:{
    flex: 1,
    resizeMode: "cover",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar:{
    height: 300,
    width: 300,
    marginBottom: 20,
    backgroundColor: "hsla(0, 0%, 100%, 1)",
    borderRadius: 50,  
  },
  arrow:{
    height: 50,
    width: 50,
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 10
  },
  arrow_pressed:{
    opacity: 0.8
  },
  text:{
    fontSize: 50,
    fontWeight: "900",
    borderBottomColor: "black",
  },
  container: {
    backgroundColor: "hsla(0, 0%, 85%, 0.7)",
    padding: 10,
    borderRadius: 25,
    borderColor: "white",
    borderWidth: 2,
    height: 500,
    width: 340,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  input_email:{
    backgroundColor: "white",
    fontSize: 20,
    fontWeight: "200",
    width: 240,
    height: 55,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6
  },
  input_password:{
    backgroundColor: "white",
    fontSize: 20,
    fontWeight: "200",
    width: 240,
    height: 55,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    textAlign: "center",
    elevation: 6
  },
  
  button_register:{
    backgroundColor: "hsla(129, 56%, 43%, 1.00)",
    width: 225,
    height: 55,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
    elevation: 6
    
    },
    button_register_pressed:{
       backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
    elevation: 6
    },

  button_text_register:{
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
 
  info_text:{
    fontWeight: "800",
    fontSize: 14,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40
  },

});

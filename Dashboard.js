import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import background from "./assets/background.png";
import logo from "./assets/logo.png";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

export default function Dashboard(){
const navigation = useNavigation();
    return(
        <>
        <View
        style = {styles.topBar}
        >
           <Image
        source={logo}
        style={styles.topBar_img}
        >
        </Image>
        <Text
        style ={styles.topBar_text}
        >Ahoj User!
        </Text>
        
        </View>
        <Pressable
        onPress={() => navigation.navigate("HomeScreen")}
        
        ><Text>Chod späť</Text></Pressable>
        </>
        
    );
}
const styles = StyleSheet.create({
    topBar:{
        backgroundColor: "hsl(0, 0%, 88%)",
        marginTop: 0,
        height: "fitContent",
        display: "flex",
        paddingBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        elevation: 10,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        },
    topBar_text: {
        marginTop: 50,
        fontSize: 30,
        fontWeight: "bold"
    },
    topBar_img:{
    height: 60,
    width: 60,
    marginTop: 50,
    }
});
    

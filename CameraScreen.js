import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ViewComponent, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation, useRoute } from "@react-navigation/native";
import arrow from "./assets/left-arrow.png";

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showContent, setShowContent] = useState(false);

  if (!permission) {
    // The hook hasn’t returned permission info yet
    return <Text>Načítavam oprávnenia...</Text>;
  }

  if (!permission.granted) {
    // Permission was denied or not yet granted
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Táto aplikácia potrebuje prístup ku kamere.</Text>
        <Button title="Povoliť kameru" onPress={requestPermission} />
      </View>
    );
  }

  const handleShowContent = () => {
    setShowContent(!showContent);
  }

  const renderContent = () =>{
    if (showContent){
      return (
        <>
        <Text>FUNGUJE TO</Text>
        </>
    )
    }
    return null;
  }

  // Permission granted → show camera view
  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing="back" />
      <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
         <Pressable style={styles.manual_add_button}
                    onPress={handleShowContent}>
        <Text style={styles.manual_add_button_text}>Zadať manuálne</Text>
        </Pressable>
         {renderContent()}
        <Pressable style={({pressed}) => 
        pressed ? styles.arrow_pressed : styles.arrow_container}  title="Zavrieť" onPress={() => navigation.navigate("Dashboard")}><Image source={arrow} style={styles.arrow} /></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
    back_button:{
        backgroundColor: "red"
    },
    arrow_container: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    alignSelf: "center"
  },
  arrow: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50,
    marginBottom: 40
  },
  arrow_pressed: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 40,
    opacity: 0.8,
  },
  manual_add_button:{
    backgroundColor: "white",
    padding: 5,
    width: 160,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10
  },
  manual_add_button_text:{
    fontSize: 18,
    fontWeight: 700
  }
})
   
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { use, useEffect, useState } from 'react';
import { View, Text, Button, ViewComponent, StyleSheet, Pressable, Image, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from "@react-navigation/native";
import arrow from "./assets/left-arrow.png";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CameraScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [showContent, setShowContent] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");

  const API_URL = "https://world.openfoodfacts.org/api/v0/product";

   async function handleAddProduct(product){
    const email = await AsyncStorage.getItem("userEmail");
     console.log("📤 Sending product:", product, "for email:", email); // LOG FRONTEND
    await fetch("http://10.0.2.2:3000/api/addProduct",{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body :JSON.stringify({ email, product})
    })
    const data = await response.json();
  console.log("📥 Server response:", data);
  }
  

  async function handleBarCodeScanned({ data, type}){
    if (scanned){
      return;
    }
    setScanned(true);
    console.log("Detected barcode: ", data, "Type: ", type);

    try{
      const response = await fetch(`${API_URL}/${data}.json`);
      const result = await response.json();

      if (result.status === 1){
        const product = result.product;
        handleAddProduct(product.product_name);
        Alert.alert("✅ Produkt nájdený", product.product_name || "Neznámy názov"); 
        navigation.navigate("Dashboard", {startTab: 3 });
        
      }
      else{
         Alert.alert("❌ Produkt sa nenašiel", `Kód: ${data}`);
      }
    }
    catch (err){
     console.error("Chyba pri načítaní produktu:", err);
    Alert.alert("Chyba", "Nepodarilo sa načítať dáta.");
    }
    setTimeout(() => setScanned(false), 3000);
  }

  async function fetchProductData(){
    const response = await fetch(`${API_URL}/${code}.json`)  
    const data = await response.json();

    if(data.status === 1){
        console.log(data.product.product_name); 
        handleAddProduct(data.product.product_name);
        Alert.alert("✅ Produkt nájdený", product.product_name || "Neznámy názov"); 
        navigation.navigate("Dashboard", { startTab: 3 });
      }else{
        console.log("Product not found.");
      }
      
    }
  

    if (!permission) {
    return <Text>Načítavam oprávnenia...</Text>;
  }

  if (!permission.granted) {
    return (
      <View>
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
        <View style={styles.manual_add_container}>
          <Text style={styles.manual_add_text}>
            Zadajte čísla pod čiarovým kódom pre pridanie produktu.
          </Text>
          <TextInput style={styles.manual_add_input} value={code} onChangeText={setCode}></TextInput>
          <Pressable onPress={fetchProductData} style={styles.manual_add_container_button}>
          <Text style={styles.manual_add_container_button_text}>
            Pridať
            </Text>  
          </Pressable>
        </View>
        </>
        
        
    )
    }
    return null;
  }

  // Permission granted → show camera view
  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }}
       facing="back"
      onBarcodeScanned={handleBarCodeScanned} />
      <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
         {renderContent()}
         <Pressable style={styles.manual_add_button}
                    onPress={handleShowContent}>
        <Text style={styles.manual_add_button_text}>Zadať manuálne</Text>
        
        </Pressable>
        
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
    borderRadius: 10,
    alignSelf: "center"
  },
  manual_add_button_text:{
    fontSize: 18,
    fontWeight: 700
  },
  manual_add_container:{
    backgroundColor: "white",
    borderRadius: 15,
    width: 300,
    height: 250,
    alignSelf: "center",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center"
},
  manual_add_text:{
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    elevation: 6
  },
  manual_add_input:{
    backgroundColor: "white",
    fontSize: 18,
    fontWeight: "200",
    width: 180,
    height: 45,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 25,
    textAlign: "center",
    elevation: 6,
    alignSelf: "center"
    
  },
  manual_add_container_button:{
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 180,
    height: 35,
    borderRadius: 5,
    marginTop: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    alignSelf: "center"
  },
  manual_add_container_button_text:{
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  }
})

   
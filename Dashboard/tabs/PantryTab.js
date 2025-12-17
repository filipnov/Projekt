// PantryTab.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles";
import MealBoxItem from "../MealBoxItem";
import MealBoxWindow from "../MealBoxWindow";

export default function PantryTab({ mealBox, removeMealBox, removeProduct, refreshMealBoxes }) {
  const [userEmail, setUserEmail] = useState(null);
  const [activeBox, setActiveBox] = useState(null); // currently opened box (object)

  // load email from AsyncStorage right away
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("userEmail")
      .then((e) => {
        if (mounted && e) setUserEmail(e);
      })
      .catch((err) => console.error("AsyncStorage error:", err));
    return () => (mounted = false);
  }, []);

  const openWindow = (box) => {
    setActiveBox(box);
  };

  const closeWindow = () => setActiveBox(null);

  return (
    <View style={styles.mealBox}>
      <Pressable onPress={refreshMealBoxes}>
        <Text
          style={{
            color: "black",
            backgroundColor: "yellow",
            borderRadius: 20,
            width: "40%",
            textAlign: "center",
            alignSelf: "center",
            padding: 10,
            marginTop: 10,
          }}
        >
          Obnoviť
        </Text>
      </Pressable>

      <Modal visible={!!activeBox} animationType="slide" transparent={true} onRequestClose={closeWindow}>
      
        <MealBoxWindow productName={activeBox?.name} email={userEmail} close={closeWindow} />
      </Modal>

      <ScrollView style={styles.mealContainer}>
        <View style={styles.row}>
          {mealBox.map((box) => (
            <MealBoxItem
              key={box.id}
              box={box}
              removeMealBox={removeMealBox}
              removeProduct={removeProduct}
              openWindow={openWindow}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

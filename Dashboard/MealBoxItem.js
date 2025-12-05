// MealBoxItem.js
import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import styles from "./styles";
import removeBtn from "../assets/remove.png";
import infoBtn from "../assets/info-icon.jpg";

export default function MealBoxItem({
  box,
  removeMealBox,
  removeProduct,
  openWindow,
}) {
  return (
    <>
      <Pressable onPress={() => openWindow(box)} style={styles.box}>
        <Text style={styles.mealBoxText}>{box.name}</Text>
        <View>
          <Pressable
            onPress={() => {
              removeMealBox(box.id);
              removeProduct(box.name);
            }}
          >
            <Text style={styles.removeButton}>Vymazať</Text>
          </Pressable>
        </View>
      </Pressable>
    </>
  );
}

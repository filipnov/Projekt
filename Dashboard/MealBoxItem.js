// MealBoxItem.js
import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import styles from "./styles";
import removeBtn from "../assets/remove.png";

export default function MealBoxItem({ box, removeMealBox, removeProduct, openWindow }) {
  return (
    <View style={styles.box}>
      <Text style={styles.mealBoxText}>{box.name}</Text>
      <View>
        <Pressable
          onPress={() => {
            removeMealBox(box.id);
            removeProduct(box.name);
          }}
        >
          <Image source={removeBtn} style={styles.removeBtn} />
        </Pressable>

        <Pressable onPress={() => openWindow(box)}>
          <Text>STLAC MA</Text>
        </Pressable>
      </View>
    </View>
  );
}

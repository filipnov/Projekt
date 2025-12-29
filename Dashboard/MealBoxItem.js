// MealBoxItem.js
import React from "react";
import { View, Text, Pressable, Image, ImageBackground } from "react-native";
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
        <ImageBackground
          source={{ uri: box.image }}
          style={{
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.mealBoxText}>{box.name}</Text>

          <View>
            <Pressable onPress={() => removeMealBox(box.id)}>
              <Text style={styles.eatenButton}>Zjedené ✅</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Pressable>
    </>
  );
}

import React from "react";
import { View, Text, Pressable } from "react-native";
import styles from "./styles";

export default function MealBoxItem({ box, removeMealBox, removeProduct }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{box.name}</Text>
      <View>
        <Pressable onPress={() => { removeMealBox(box.id); removeProduct(box.name); }}>
          <Text>Odstrániť</Text>
        </Pressable>
      </View>
    </View>
  );
}

import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import styles from "../styles";
import MealBoxItem from "../MealBoxItem";

export default function PantryTab({ mealBox, removeMealBox, removeProduct, refreshMealBoxes }) {
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

      <ScrollView style={styles.mealContainer}>
        <View style={styles.row}>
          {mealBox.map((box) => (
            <MealBoxItem
              key={box.id}
              box={box}
              removeMealBox={removeMealBox}
              removeProduct={removeProduct}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

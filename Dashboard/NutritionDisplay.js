//NutritionDisplay.js
import React from "react";
import { View, Text } from "react-native";
import styles from "./styles";

export default function NutritionDisplay({
  proteinBar,
  carbBar,
  fatBar,
  proteinConsumed,
  carbConsumed,
  fatConsumed,
  proteinGoal,
  carbGoal,
  fatGoal,
  fiberBar,
  fiberConsumed,
  fiberGoal,
  sugarBar,
  sugarConsumed,
  sugarGoal,
  saltBar,
  saltConsumed,
  saltGoal,
}) {
  const renderNutriItem = (label, valueConsumed, valueGoal, barPercent) => (
    <View style={styles.nutriDisplay}>
      <Text style={styles.nutriDisplay_text}>{label}</Text>
      <View style={styles.caloriesBarContainer}>
        <View
          style={[
            styles.caloriesBar,
            {
              width: `${barPercent}%`,
              backgroundColor: barPercent >= 100 ? "#FF3B30" : "#4CAF50",
            },
          ]}
        />
      </View>
      <Text style={{ color: "white", marginBottom: 5 }}>
        {valueConsumed.toFixed(0)} / {valueGoal} g
      </Text>
    </View>
  );

  return (
    <View style={styles.nutriDisplay_container}>
      <View style={{ flexDirection: "row" }}>
        {renderNutriItem(
          "Bielkoviny",
          proteinConsumed,
          proteinGoal,
          proteinBar,
        )}
        {renderNutriItem("Sacharidy", carbConsumed, carbGoal, carbBar)}
        {renderNutriItem("Tuky", fatConsumed, fatGoal, fatBar)}
      </View>
      <View style={{ flexDirection: "row" }}>
        {renderNutriItem("Vláknina", fiberConsumed, fiberGoal, fiberBar)}
        {renderNutriItem("Soľ", saltConsumed, saltGoal, saltBar)}
        {renderNutriItem("Cukry", sugarConsumed, sugarGoal, sugarBar)}
      </View>
    </View>
  );
}

//OverviewTab.js
import React from "react";
import { View, Text } from "react-native";
import NutritionDisplay from "../NutritionDisplay";
import styles from "../styles";

export default function OverviewTab({
  eatenOutput,
  progressBar,
  barColor,
  eatOutput,
  currentDate,
  bmiOutput,
  bmiBar,
  bmiBarColor,
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
  return (
    <>
      <View style={styles.caloriesDisplay}>
        <Text style={{ color: "white", marginBottom: 14 }}>{eatenOutput}</Text>
        <View style={styles.caloriesBarContainer}>
          <View
            style={[
              styles.caloriesBar,
              { width: `${progressBar}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={{ color: "white", marginBottom: 20 }}>{eatOutput}</Text>
        <Text style={styles.dateText}>
          {new Date(currentDate).toLocaleDateString()}
        </Text>
      </View>

      <NutritionDisplay
        proteinBar={proteinBar}
        carbBar={carbBar}
        fatBar={fatBar}
        proteinConsumed={proteinConsumed}
        carbConsumed={carbConsumed}
        fatConsumed={fatConsumed}
        proteinGoal={proteinGoal}
        carbGoal={carbGoal}
        fatGoal={fatGoal}
        fiberBar={fiberBar}
        fiberConsumed={fiberConsumed}
        fiberGoal={fiberGoal}
        sugarBar={sugarBar}
        sugarConsumed={sugarConsumed}
        sugarGoal={sugarGoal}
        saltBar={saltBar}
        saltConsumed={saltConsumed}
        saltGoal={saltGoal}
      />

      <View style={styles.bmiContainer}>
        <Text style={{ color: "white", textAlign: "center" }}>{bmiOutput}</Text>
        <View style={styles.caloriesBarContainer}>
          <View
            style={[styles.caloriesBar, { width: `${bmiBar}%`, backgroundColor: bmiBarColor }]}
          />
        </View>
      </View>
    </>
  );
}

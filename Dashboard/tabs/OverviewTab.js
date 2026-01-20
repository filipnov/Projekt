// OverviewTab.js
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";
import NutritionDisplay from "../NutritionDisplay";
import styles from "../styles";
import plus from "../../assets/plus.png";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [totalWater, setTotalWater] = useState(0);
  const [weight, setWeight] = useState();

  let waterBar = (totalWater / 2000) * 100;

  const addWater = () => {
    let water;
    switch (selectedOption) {
      case "Malý pohár / šálka ":
        water = 150;
        break;
      case "Stredný pohár / šálka":
        water = 250;
        break;
      case "Veľký pohár / hrnček":
        water = 350;
        break;
      case "Fľaša":
        water = 500;
        break;
      default:
        water = 0;
    }
    setTotalWater((prev) => prev + water);

    console.log("Vypité " + totalWater + " ml");
    setModalVisible(false);
  };

  const options = [
    { label: "Malý pohár / šálka ", description: "150 ml" },
    { label: "Stredný pohár / šálka", description: "250 ml" },
    { label: "Veľký pohár / hrnček", description: "350 ml" },
    { label: "Fľaša", description: "500 ml" },
  ];

  /*async function reloadProfileFromStorage() {
    try {
      const storedProfile = await AsyncStorage.getItem("userProfile");
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setWeight(profile.weight);
      }
    } catch (err) {
      console.error("Error loading profile from storage:", err);
    }
  }*/

  let waterGoal = 2000;

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
        <Text style={styles.dateText}>{currentDate}</Text>
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

      {/* Pitný režim s plus */}
      <View style={styles.bmiContainer}>
        <Text style={{ color: "white" }}>Pitný režim</Text>
        <View style={styles.caloriesBarContainer}>
          <View
            style={[
              styles.caloriesBar,
              { width: `${waterBar}%`, backgroundColor: "blue" },
            ]}
          />
        </View>
        <Text style={{ color: "white" }}>
          {totalWater} / {waterGoal} ml
        </Text>
        <Pressable backgroundColor="green" padding={5} borderRadius={20} marginTop={5} onPress={() => setModalVisible(true)}>
          <Image source={plus}  style={{ width: 20, height: 20 }} />
        </Pressable>

        {/* Modal s radio buttonmi */}
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
                width: "80%",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                Vyber možnosť
              </Text>

              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 5,
                  }}
                  onPress={() => setSelectedOption(opt.label)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#000",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 10,
                    }}
                  >
                    {selectedOption === opt.label && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "#4CAF50",
                        }}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={{ fontWeight: "bold" }}>{opt.label}</Text>
                    <Text style={{ color: "#555" }}>{opt.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Pressable
                style={{
                  marginTop: 15,
                  backgroundColor: "#4CAF50",
                  padding: 10,
                  borderRadius: 5,
                }}
                onPress={() => {
                  setModalVisible(false);
                  addWater();
                }}
              >
                <Text style={{ color: "white", textAlign: "center" }}>
                  Potvrdiť
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>

      {/* BMI zobrazenie */}
      <View style={styles.bmiContainer}>
        <Text style={{ color: "white", textAlign: "center" }}>{bmiOutput}</Text>
        <View style={styles.caloriesBarContainer}>
          <View
            style={[
              styles.caloriesBar,
              { width: `${bmiBar}%`, backgroundColor: bmiBarColor },
            ]}
          />
        </View>
      </View>
    </>
  );
}

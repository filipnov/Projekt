import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
} from "react-native";
import styles from "../../styles";
import plus from "../../assets/plus.png";

export default function OverviewTab({
  navigation,
  profileLoaded,
  weight,
  height,
  age,
  gender,
  goal,
  activityLevel,
  eatenTotals,
  setEatenTotals,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [overviewData, setOverviewData] = useState({});
  const [currentDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  });

  const options = [
    { label: "Malý pohár / šálka ", description: "150 ml" },
    { label: "Stredný pohár / šálka", description: "250 ml" },
    { label: "Veľký pohár / hrnček", description: "350 ml" },
    { label: "Fľaša", description: "500 ml" },
  ];

  const renderNutriItem = (label, valueConsumed, valueGoal, barPercent) => (
    <View style={styles.dashNutriDisplay}>
      <Text style={styles.dashNutriDisplay_text}>{label}</Text>
      <View style={styles.dashCaloriesBarContainer}>
        <View
          style={[
            styles.dashCaloriesBar,
            {
              width: `${barPercent}%`,
              backgroundColor: barPercent >= 100 ? "#FF3B30" : "#4CAF50",
            },
          ]}
        />
      </View>
      <Text style={{ color: "white", marginBottom: 5 }}>
        {valueConsumed} / {valueGoal} g
      </Text>
    </View>
  );

  const addWater = () => {
    let water = 0;
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

    setEatenTotals((prev) => ({
      ...prev,
      drunkWater: (prev.drunkWater || 0) + water,
    }));

    setModalVisible(false);
  };

  useEffect(() => {
    if (
      !profileLoaded ||
      !weight ||
      !height ||
      !age ||
      !activityLevel ||
      !gender
    )
      return;

    const { calories, proteins, carbs, fat, fiber, sugar, salt, drunkWater } =
      eatenTotals;

    let cal;
    if (gender === "male")
      cal = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
    else cal = (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;

    if (goal === "lose") cal -= 500;
    else if (goal === "gain") cal += 500;

    const progressBar = Math.min((calories / cal) * 100, 100);
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput;
    if (calories < cal)
      eatOutput = `Ešte ti chýba ${Math.round(cal - calories)} kcal`;
    else if (calories === cal)
      eatOutput = "Dostal/-a si sa na svoj denný cieľ!";
    else eatOutput = `Prekročil/a si cieľ o ${Math.round(calories - cal)} kcal`;

    const proteinGoal = ((cal * 0.13) / 4).toFixed(0);
    const carbGoal = ((cal * 0.65) / 4).toFixed(0);
    const fatGoal = ((cal * 0.23) / 9).toFixed(0);
    const fiberGoal = ((cal / 1000) * 14).toFixed(0);
    const sugarGoal = ((cal * 0.075) / 4).toFixed(0);
    const saltGoal = 5;
    const waterGoal = 33 * weight;

    const proteinBar = (proteins / proteinGoal) * 100;
    const carbBar = (carbs / carbGoal) * 100;
    const fatBar = (fat / fatGoal) * 100;
    const fiberBar = (fiber / fiberGoal) * 100;
    const sugarBar = (sugar / sugarGoal) * 100;
    const saltBar = (salt / saltGoal) * 100;
    const waterBar = (drunkWater / waterGoal) * 100;

    const bmiValue = ((weight / (height * height)) * 10000).toFixed(1);
    let bmiOutput = "",
      bmiBarColor = "#4CAF50";
    if (bmiValue < 18.5) {
      bmiOutput = `BMI: ${bmiValue}\nPodváha`;
      bmiBarColor = "#2196F3";
    } else if (bmiValue < 25) bmiOutput = `BMI: ${bmiValue}\nNormálna váha`;
    else if (bmiValue < 30) {
      bmiOutput = `BMI: ${bmiValue}\nNadváha`;
      bmiBarColor = "#FF9800";
    } else {
      bmiOutput = `BMI: ${bmiValue}\nObezita`;
      bmiBarColor = "#FF3B30";
    }

    const bmiBar = (bmiValue / 40) * 100;

    setOverviewData({
      caloriesGoal: cal,
      caloriesConsumed: calories,
      progressBar,
      barColor,
      eatOutput,
      eatenOutput: `${Math.round(calories)} / ${Math.round(cal)} kcal`,
      proteinGoal,
      proteinConsumed: Number(proteins).toFixed(0),
      proteinBar,
      carbGoal,
      carbConsumed: Number(carbs).toFixed(0),
      carbBar,
      fatGoal,
      fatConsumed: Number(fat).toFixed(0),
      fatBar,
      fiberGoal,
      fiberConsumed: Number(fiber).toFixed(0),
      fiberBar,
      sugarGoal,
      sugarConsumed: Number(sugar).toFixed(0),
      sugarBar,
      saltGoal,
      saltConsumed: Number(salt).toFixed(0),
      saltBar,
      bmiOutput,
      bmiBar,
      bmiBarColor,
      waterGoal,
      drunkWater,
      waterBar,
    });
  }, [
    weight,
    height,
    age,
    activityLevel,
    gender,
    goal,
    eatenTotals,
    profileLoaded,
  ]);

  if (!weight || !height || !age) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 18, textAlign: "center" }}>
          Vyplň si svoj profil, aby si videl/-a prehľad!
        </Text>
        <Pressable
          style={{
            marginTop: 15,
            backgroundColor: "#4CAF50",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}
          onPress={() => navigation.navigate("ProfileCompletition")}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Vyplniť profil
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.dashCaloriesDisplay}>
        <Text style={styles.dashDateText}>{currentDate}</Text>
        <Text style={{ color: "white", marginTop: 20 }}>
          {overviewData.eatOutput}
        </Text>

        <View style={styles.dashCaloriesBarContainer}>
          <View
            style={[
              styles.dashCaloriesBar,
              {
                width: `${overviewData.progressBar}%`,
                backgroundColor: overviewData.barColor,
              },
            ]}
          />
        </View>
        <Text style={{ color: "white", marginTop: 14 }}>
          {overviewData.eatenOutput}
        </Text>
      </View>

      <View style={styles.dashNutriDisplay_container}>
        <View style={{ flexDirection: "row" }}>
          {renderNutriItem(
            "Bielkoviny",
            overviewData.proteinConsumed,
            overviewData.proteinGoal,
            overviewData.proteinBar,
          )}
          {renderNutriItem(
            "Sacharidy",
            overviewData.carbConsumed,
            overviewData.carbGoal,
            overviewData.carbBar,
          )}
          {renderNutriItem(
            "Tuky",
            overviewData.fatConsumed,
            overviewData.fatGoal,
            overviewData.fatBar,
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          {renderNutriItem(
            "Vláknina",
            overviewData.fiberConsumed,
            overviewData.fiberGoal,
            overviewData.fiberBar,
          )}
          {renderNutriItem(
            "Soľ",
            overviewData.saltConsumed,
            overviewData.saltGoal,
            overviewData.saltBar,
          )}
          {renderNutriItem(
            "Cukry",
            overviewData.sugarConsumed,
            overviewData.sugarGoal,
            overviewData.sugarBar,
          )}
        </View>
      </View>

      <View style={styles.dashBmiContainer}>
        <Text style={{ color: "white" }}>
          {overviewData.drunkWater} / {overviewData.waterGoal} ml
        </Text>
        <View style={styles.dashCaloriesBarContainer}>
          <View
            style={[
              styles.dashCaloriesBar,
              {
                width: `${overviewData.waterBar}%`,
                backgroundColor: "#2cdba1",
              },
            ]}
          />
        </View>

        <Pressable
          backgroundColor="green"
          padding={5}
          borderRadius={20}
          onPress={() => setModalVisible(true)}
        >
          <Image source={plus} style={{ width: 20, height: 20 }} />
        </Pressable>

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

      <View style={styles.dashBmiContainer}>
        <Text style={{ color: "white", textAlign: "center" }}>
          {overviewData.bmiOutput}
        </Text>
        <View style={styles.dashCaloriesBarContainer}>
          <View
            style={[
              styles.dashCaloriesBar,
              {
                width: `${overviewData.bmiBar}%`,
                backgroundColor: overviewData.bmiBarColor,
              },
            ]}
          />
        </View>
      </View>
    </>
  );
}

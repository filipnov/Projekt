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
  const currentDate = (() => {
    const d = new Date();
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  })();

  const options = [
    { label: "Malý pohár / šálka ", description: "150 ml", ml: 150 },
    { label: "Stredný pohár / šálka", description: "250 ml", ml: 250 },
    { label: "Veľký pohár / hrnček", description: "350 ml", ml: 350 },
    { label: "Fľaša", description: "500 ml", ml: 500 },
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
    const picked = options.find((opt) => opt.label === selectedOption);
    const water = picked?.ml || 0;

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
    if (goal === "gain") cal += 500;

    const progressBar = Math.min((calories / cal) * 100, 100);
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput = `Prekročil/a si cieľ o ${Math.round(calories - cal)} kcal`;
    if (calories < cal)
      eatOutput = `Ešte ti chýba ${Math.round(cal - calories)} kcal`;
    if (calories === cal)
      eatOutput = "Dostal/-a si sa na svoj denný cieľ!";

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
    let bmiOutput = "";
    let bmiBarColor = "#4CAF50";
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

  const topNutri = [
    {
      label: "Bielkoviny",
      consumed: overviewData.proteinConsumed,
      goal: overviewData.proteinGoal,
      bar: overviewData.proteinBar,
    },
    {
      label: "Sacharidy",
      consumed: overviewData.carbConsumed,
      goal: overviewData.carbGoal,
      bar: overviewData.carbBar,
    },
    {
      label: "Tuky",
      consumed: overviewData.fatConsumed,
      goal: overviewData.fatGoal,
      bar: overviewData.fatBar,
    },
  ];

  const bottomNutri = [
    {
      label: "Vláknina",
      consumed: overviewData.fiberConsumed,
      goal: overviewData.fiberGoal,
      bar: overviewData.fiberBar,
    },
    {
      label: "Soľ",
      consumed: overviewData.saltConsumed,
      goal: overviewData.saltGoal,
      bar: overviewData.saltBar,
    },
    {
      label: "Cukry",
      consumed: overviewData.sugarConsumed,
      goal: overviewData.sugarGoal,
      bar: overviewData.sugarBar,
    },
  ];

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
          {topNutri.map((item) => (
            <React.Fragment key={item.label}>
              {renderNutriItem(item.label, item.consumed, item.goal, item.bar)}
            </React.Fragment>
          ))}
        </View>
        <View style={{ flexDirection: "row" }}>
          {bottomNutri.map((item) => (
            <React.Fragment key={item.label}>
              {renderNutriItem(item.label, item.consumed, item.goal, item.bar)}
            </React.Fragment>
          ))}
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

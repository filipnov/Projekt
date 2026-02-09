import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles";
import plus from "../../assets/plus.png";

// URL backendu (z tohto servera načítavame dáta)
const SERVER_URL = "https://app.bitewise.it.com";

// Základná štruktúra denných súhrnov
// (používa sa ako bezpečný „štart“ keď ešte nemáme dáta)
const DEFAULT_TOTALS = {
  calories: 0,
  proteins: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  salt: 0,
  drunkWater: 0,
};

// Pomocná funkcia na dnešný dátum (YYYY-MM-DD) v lokálnom čase
// Tento formát vyžaduje aj backend API
const getTodayKey = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Preferujeme serverové hodnoty (aby bol prehľad vždy aktuálny)
// Ak server pošle hodnotu, prepíše lokálnu (ak je dostupná)
const mergeTotalsPreferRemote = (localTotals, remoteTotals) => {
  if (!remoteTotals) return localTotals;
  const merged = { ...localTotals };
  for (const key of Object.keys(merged)) {
    const remoteVal = remoteTotals[key];
    if (remoteVal !== null && remoteVal !== undefined) {
      merged[key] = remoteVal;
    }
  }
  return merged;
};

export default function OverviewTab({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [overviewData, setOverviewData] = useState({});
  const [email, setEmail] = useState(null);

  // Stav profilu (či je profil načítaný + konkrétne hodnoty)
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);

  // Denné súhrny skonzumovaných živín
  const [eatenTotals, setEatenTotals] = useState(DEFAULT_TOTALS);
  const [eatenLoaded, setEatenLoaded] = useState(false);
  const [currentDayKey, setCurrentDayKey] = useState(getTodayKey());
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
    <View key={label} style={styles.dashNutriDisplay}>
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
      <Text style={styles.dashNutriValueText}>
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

  // Načíta uložený e‑mail
  useEffect(() => {
    AsyncStorage.getItem("userEmail").then((storedEmail) => {
      if (storedEmail) setEmail(storedEmail);
    });
  }, []);

  // Načíta používateľský profil (váha, výška, cieľ atď.)
  // Používame useFocusEffect, aby sa hodnoty obnovili vždy pri návrate na prehľad
  useFocusEffect(
    useCallback(() => {
      async function reloadProfileFromStorage() {
        try {
          const storedProfile = await AsyncStorage.getItem("userProfile");
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setWeight(profile.weight);
            setHeight(profile.height);
            setAge(profile.age);
            setGender(profile.gender);
            setGoal(profile.goal);
            setActivityLevel(profile.activityLevel);
          }
        } catch (err) {
          console.error("Error loading profile from storage:", err);
        } finally {
          setProfileLoaded(true);
        }
      }

      reloadProfileFromStorage();
    }, []),
  );

  // Načíta denné súhrny z backendu (ak sú dostupné)
  // Tieto hodnoty majú prednosť, aby bol prehľad vždy presný
  const fetchDailyTotals = useCallback(async () => {
    if (!email) return null;
    try {
      const response = await fetch(
        `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(
          email,
        )}&date=${getTodayKey()}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data?.totals || null;
    } catch (err) {
      console.error("Error fetching daily consumption from server:", err);
      return null;
    }
  }, [email]);

  // Načíta lokálne uložené súhrny (ak existujú)
  // Ak lokálne súbory chýbajú alebo sú poškodené, použijeme DEFAULT_TOTALS
  const loadStoredTotals = useCallback(async () => {
    const storedTotalsRaw = await AsyncStorage.getItem("eatenTotals");
    if (!storedTotalsRaw) return { ...DEFAULT_TOTALS };
    try {
      return { ...DEFAULT_TOTALS, ...JSON.parse(storedTotalsRaw) };
    } catch (e) {
      console.error("Error parsing stored eatenTotals:", e);
      return { ...DEFAULT_TOTALS };
    }
  }, []);

  // Načíta uložené dáta pri otvorení Prehľadu
  // Cieľ: mať rýchly štart (lokálne údaje) + vždy aktuálne hodnoty (server)
  const loadOverviewTotals = useCallback(async () => {
    try {
      let totals = await loadStoredTotals();

      const todayKey = getTodayKey();
      const storedTotalsDate = await AsyncStorage.getItem("eatenTotalsDate");
      if (storedTotalsDate !== todayKey) {
        totals = { ...DEFAULT_TOTALS };
        await AsyncStorage.setItem("eatenTotals", JSON.stringify(totals));
        await AsyncStorage.setItem("eatenTotalsDate", todayKey);
      }

      setCurrentDayKey(todayKey);

      const remoteTotals = await fetchDailyTotals();
      totals = mergeTotalsPreferRemote(totals, remoteTotals);

      setEatenTotals(totals);
      setEatenLoaded(true);
    } catch (err) {
      console.error("Error loading overview totals:", err);
    }
  }, [fetchDailyTotals, loadStoredTotals]);

  useFocusEffect(
    useCallback(() => {
      loadOverviewTotals();
    }, [loadOverviewTotals]),
  );

  useEffect(() => {
    if (email) loadOverviewTotals();
  }, [email, loadOverviewTotals]);

  // Ukladá denné súhrny do lokálneho úložiska
  // Pozn.: ukladáme až po prvom načítaní, aby sme neprepísali hodnoty 0
  useEffect(() => {
    if (!eatenLoaded) return;
    AsyncStorage.setItem("eatenTotals", JSON.stringify(eatenTotals));
    AsyncStorage.setItem("eatenTotalsDate", getTodayKey());
  }, [eatenTotals, eatenLoaded]);

  // Reset o polnoci (lokálny čas) aj pri otvorenej appke
  useEffect(() => {
    if (!eatenLoaded) return;

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime() + 500;

    const timer = setTimeout(async () => {
      const todayKey = getTodayKey();
      const cleared = { ...DEFAULT_TOTALS };
      setEatenTotals(cleared);
      await AsyncStorage.setItem("eatenTotals", JSON.stringify(cleared));
      await AsyncStorage.setItem("eatenTotalsDate", todayKey);
      setCurrentDayKey(todayKey);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentDayKey, eatenLoaded]);

  // Posiela denné súhrny na server (po každej zmene)
  // Toto drží backend v synchronizovanom stave
  useEffect(() => {
    if (!eatenLoaded || !email) return;

    const pushConsumedToDB = async () => {
      try {
        await fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: getTodayKey(),
            totals: eatenTotals,
          }),
        });
      } catch (err) {
        console.error("Error pushing consumed totals:", err);
      }
    };

    pushConsumedToDB();
  }, [eatenTotals, eatenLoaded, email]);

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
      <View style={styles.overviewMissingProfileContainer}>
        <Text style={styles.overviewMissingProfileText}>
          Vyplň si svoj profil, aby si videl/-a prehľad!
        </Text>
        <Pressable
          style={styles.overviewMissingProfileButton}
          onPress={() => navigation.navigate("ProfileCompletition")}
        >
          <Text style={styles.overviewMissingProfileButtonText}>
            Vyplniť profil
          </Text>
        </Pressable>
      </View>
    );
  }

  const nutriBarColor = (barPercent) =>
    barPercent >= 100 ? "#FF3B30" : "#4CAF50";

  return (
    <>
      <View style={styles.dashCaloriesDisplay}>
        <Text style={styles.dashDateText}>{currentDate}</Text>
        <Text style={styles.dashEatOutputText}>
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
        <Text style={styles.dashCaloriesText}>
          {overviewData.eatenOutput}
        </Text>
      </View>

      <View style={styles.dashNutriDisplay_container}>
        <View style={styles.dashNutriRow}>
          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Bielkoviny</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.proteinBar}%`,
                    backgroundColor: nutriBarColor(overviewData.proteinBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.proteinConsumed} / {overviewData.proteinGoal} g
            </Text>
          </View>

          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Sacharidy</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.carbBar}%`,
                    backgroundColor: nutriBarColor(overviewData.carbBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.carbConsumed} / {overviewData.carbGoal} g
            </Text>
          </View>

          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Tuky</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.fatBar}%`,
                    backgroundColor: nutriBarColor(overviewData.fatBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.fatConsumed} / {overviewData.fatGoal} g
            </Text>
          </View>
        </View>
        <View style={styles.dashNutriRow}>
          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Vláknina</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.fiberBar}%`,
                    backgroundColor: nutriBarColor(overviewData.fiberBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.fiberConsumed} / {overviewData.fiberGoal} g
            </Text>
          </View>

          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Soľ</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.saltBar}%`,
                    backgroundColor: nutriBarColor(overviewData.saltBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.saltConsumed} / {overviewData.saltGoal} g
            </Text>
          </View>

          <View style={styles.dashNutriDisplay}>
            <Text style={styles.dashNutriDisplay_text}>Cukry</Text>
            <View style={styles.dashCaloriesBarContainer}>
              <View
                style={[
                  styles.dashCaloriesBar,
                  {
                    width: `${overviewData.sugarBar}%`,
                    backgroundColor: nutriBarColor(overviewData.sugarBar),
                  },
                ]}
              />
            </View>
            <Text style={styles.dashNutriValueText}>
              {overviewData.sugarConsumed} / {overviewData.sugarGoal} g
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.dashBmiContainer}>
        <Text style={styles.dashWaterText}>
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
          style={styles.dashAddWaterButton}
          onPress={() => setModalVisible(true)}
        >
          <Image source={plus} style={styles.dashAddWaterIcon} />
        </Pressable>

        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.dashModalOverlay}>
            <View style={styles.dashModalContent}>
              <Text style={styles.dashModalTitle}>
                Vyber možnosť
              </Text>

              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.dashModalOptionRow}
                  onPress={() => setSelectedOption(opt.label)}
                >
                  <View style={styles.dashModalRadioOuter}>
                    {selectedOption === opt.label && (
                      <View style={styles.dashModalRadioInner} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.dashModalOptionLabel}>
                      {opt.label}
                    </Text>
                    <Text style={styles.dashModalOptionDescription}>
                      {opt.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Pressable
                style={styles.dashModalConfirmButton}
                onPress={() => {
                  setModalVisible(false);
                  addWater();
                }}
              >
                <Text style={styles.dashModalConfirmButtonText}>
                  Potvrdiť
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.dashBmiContainer}>
        <Text style={styles.dashBmiText}>
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

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadTotalsForDate as loadStoredTotalsForDate,
  saveTotalsForDate as saveStoredTotalsForDate,
} from "../../dailyTotalsStorage";
import styles from "../../styles";
import plus from "../../assets/plus.png";
import { useAppTheme } from "../../ThemeContext";

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

const DAY_LABELS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Máj",
  "Jún",
  "Júl",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

const formatDisplayDate = (date = new Date()) =>
  `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

const formatShortDate = (date = new Date()) =>
  `${date.getDate()}.${date.getMonth() + 1}.`;

const parseDateKey = (value) => {
  const [yyyy, mm, dd] = String(value).split("-").map(Number);
  if (!yyyy || !mm || !dd) return new Date();
  return new Date(yyyy, mm - 1, dd);
};

const shiftDateByDays = (date, delta) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);

const getRangeForView = (date, view) => {
  if (view === "week") {
    const day = date.getDay();
    const diffToMonday = (day + 6) % 7;
    const startDate = shiftDateByDays(date, -diffToMonday);
    return {
      startDate,
      endDate: shiftDateByDays(startDate, 6),
    };
  }
  if (view === "year") {
    return {
      startDate: new Date(date.getFullYear(), 0, 1),
      endDate: new Date(date.getFullYear(), 11, 31),
    };
  }

  return { startDate: date, endDate: date };
};

const buildDateKeysInRange = (startDate, endDate) => {
  const keys = [];
  const cursor = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const last = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  while (cursor <= last) {
    keys.push(getTodayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
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
  const { colors, isDark } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [customWaterMl, setCustomWaterMl] = useState("");
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeView, setRangeView] = useState("day");
  const [rangeTotals, setRangeTotals] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const activeDateKeyRef = useRef(null);
  const [loadedDateKey, setLoadedDateKey] = useState(null);
  const [hasTotalsData, setHasTotalsData] = useState(false);
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  const themed = {
    screen: { backgroundColor: colors.dashboardBackground },
    text: { color: colors.text },
    textSoft: { color: colors.textSoft },
    muted: { color: colors.mutedText },
    subtle: { color: colors.subtleText },
    surface: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowOpacity: isDark ? 0 : 0.08,
      elevation: isDark ? 0 : 3,
    },
    surfaceAlt: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    progressTrack: {
      backgroundColor: isDark ? "#2d3a31" : "#e5e7eb",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      color: colors.text,
    },
  };

  const selectedDateKey = getTodayKey(selectedDate);
  const todayKey = getTodayKey();
  const currentDate = formatDisplayDate(selectedDate);
  const isTodaySelected = selectedDateKey === todayKey;

  const options = [
    { label: "Malý pohár / šálka ", description: "150 ml", ml: 150 },
    { label: "Stredný pohár / šálka", description: "250 ml", ml: 250 },
    { label: "Veľký pohár / hrnček", description: "350 ml", ml: 350 },
    { label: "Fľaša", description: "500 ml", ml: 500 },
  ];

  const CUSTOM_WATER_OPTION = "custom";

  const rangeOptions = [
    { key: "day", label: "Dnes" },
    { key: "week", label: "Týždeň" },
    { key: "year", label: "Rok" },
  ];

  const parseWaterInput = (value) => {
    const cleaned = String(value || "")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.round(parsed));
  };

  const closeWaterModal = () => {
    setModalVisible(false);
    setSelectedOption(null);
    setCustomWaterMl("");
  };

  const addWater = () => {
    const picked = options.find((opt) => opt.label === selectedOption);
    const customWater = parseWaterInput(customWaterMl);
    const water =
      selectedOption === CUSTOM_WATER_OPTION
        ? customWater
        : picked?.ml || 0;

    if (!water) {
      closeWaterModal();
      return;
    }

    setEatenTotals((prev) => {
      const nextTotals = {
        ...prev,
        drunkWater: (prev.drunkWater || 0) + water,
      };

      saveStoredTotalsForDate(selectedDateKey, nextTotals, true).catch(
        (err) => {
          console.error("Error saving daily totals:", err);
        },
      );

      if (email && isTodaySelected) {
        fetch(`${SERVER_URL}/api/updateDailyConsumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            date: selectedDateKey,
            totals: nextTotals,
          }),
        }).catch((err) => {
          console.error("Error pushing water totals:", err);
        });
      }

      return nextTotals;
    });

    setHasTotalsData(true);
    closeWaterModal();
  };

  const customWaterValue = parseWaterInput(customWaterMl);
  const canConfirmWater =
    selectedOption === CUSTOM_WATER_OPTION
      ? customWaterValue > 0
      : Boolean(options.find((opt) => opt.label === selectedOption));

  useEffect(() => {
    if (rangeView === "month") setRangeView("week");
  }, [rangeView]);

  const isSameOrBeforeToday = (date) => getTodayKey(date) <= todayKey;
  const getNextDateForView = (date) => {
    if (rangeView === "week") return shiftDateByDays(date, 7);
    if (rangeView === "year") {
      return new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
    }
    return shiftDateByDays(date, 1);
  };
  const canShiftForward = isSameOrBeforeToday(getNextDateForView(selectedDate));

  const handleDateShift = (delta) => {
    setSelectedDate((prev) => {
      const nextDate =
        rangeView === "week"
          ? shiftDateByDays(prev, delta * 7)
          : rangeView === "year"
            ? new Date(
                prev.getFullYear() + delta,
                prev.getMonth(),
                prev.getDate(),
              )
            : shiftDateByDays(prev, delta);

      if (delta > 0 && !isSameOrBeforeToday(nextDate)) {
        return new Date();
      }

      return nextDate;
    });
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
  const fetchDailyTotals = useCallback(
    async (dateKey) => {
      if (!email) return null;
      try {
        const response = await fetch(
          `${SERVER_URL}/api/getDailyConsumption?email=${encodeURIComponent(
            email,
          )}&date=${encodeURIComponent(dateKey)}`,
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data?.totals || null;
      } catch (err) {
        console.error("Error fetching daily consumption from server:", err);
        return null;
      }
    },
    [email],
  );

  const fetchRangeTotals = useCallback(
    async (startKey, endKey) => {
      if (!email) return [];
      try {
        const response = await fetch(
          `${SERVER_URL}/api/getDailyConsumptionRange?email=${encodeURIComponent(
            email,
          )}&start=${encodeURIComponent(startKey)}&end=${encodeURIComponent(
            endKey,
          )}`,
        );
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.range) ? data.range : [];
      } catch (err) {
        console.error("Error fetching range consumption from server:", err);
        return [];
      }
    },
    [email],
  );

  const mergeRangeTotalsWithLocal = useCallback(
    async (startDate, endDate, remoteRange) => {
      const mergedMap = new Map();
      (remoteRange || []).forEach((entry) => {
        if (entry?.date) mergedMap.set(entry.date, entry);
      });

      const dateKeys = buildDateKeysInRange(startDate, endDate);
      const localEntries = await Promise.all(
        dateKeys.map(async (dateKey) => {
          const localTotals = await loadStoredTotalsForDate(
            dateKey,
            DEFAULT_TOTALS,
          );

          if (!localTotals) return null;

          const remoteEntry = mergedMap.get(dateKey);
          if (remoteEntry) {
            return {
              ...remoteEntry,
              totals: mergeTotalsPreferRemote(localTotals, remoteEntry.totals),
            };
          }

          return { date: dateKey, totals: localTotals };
        }),
      );

      localEntries.forEach((entry) => {
        if (!entry?.date) return;
        mergedMap.set(entry.date, entry);
      });

      return Array.from(mergedMap.values());
    },
    [],
  );

  // Načíta uložené dáta pri otvorení Prehľadu
  // Cieľ: mať rýchly štart (lokálne údaje) + vždy aktuálne hodnoty (server)
  const loadTotalsForDate = useCallback(
    async (dateKey) => {
      activeDateKeyRef.current = dateKey;
      try {
        let totals = { ...DEFAULT_TOTALS };
        const cachedTotals = await loadStoredTotalsForDate(
          dateKey,
          DEFAULT_TOTALS,
        );
        if (cachedTotals) totals = cachedTotals;

        const remoteTotals = await fetchDailyTotals(dateKey);
        totals = mergeTotalsPreferRemote(totals, remoteTotals);

        if (activeDateKeyRef.current !== dateKey) return;
        const hasData = Boolean(cachedTotals) || Boolean(remoteTotals);
        setHasTotalsData(hasData);
        setLoadedDateKey(dateKey);
        setEatenTotals(totals);
        setEatenLoaded(true);

        if (remoteTotals) {
          await saveStoredTotalsForDate(
            dateKey,
            totals,
            dateKey === getTodayKey(),
          );
        }
      } catch (err) {
        console.error("Error loading overview totals:", err);
      }
    },
    [fetchDailyTotals],
  );

  useFocusEffect(
    useCallback(() => {
      if (email) loadTotalsForDate(selectedDateKey);
    }, [email, selectedDateKey, loadTotalsForDate]),
  );

  useEffect(() => {
    if (!email) return;
    if (rangeView === "day") {
      setRangeTotals([]);
      setRangeLoading(false);
      return;
    }

    const { startDate, endDate } = getRangeForView(selectedDate, rangeView);
    const startKey = getTodayKey(startDate);
    const endKey = getTodayKey(endDate);
    let isActive = true;

    setRangeLoading(true);
    (async () => {
      const range = await fetchRangeTotals(startKey, endKey);
      const mergedRange = await mergeRangeTotalsWithLocal(
        startDate,
        endDate,
        range,
      );
      if (!isActive) return;
      setRangeTotals(mergedRange);
      setRangeLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [
    email,
    rangeView,
    selectedDate,
    fetchRangeTotals,
    mergeRangeTotalsWithLocal,
  ]);

  // Ukladá denné súhrny do lokálneho úložiska
  // Pozn.: ukladáme až po prvom načítaní, aby sme neprepísali hodnoty 0
  useEffect(() => {
    if (
      !eatenLoaded ||
      !isTodaySelected ||
      loadedDateKey !== selectedDateKey ||
      !hasTotalsData
    )
      return;
    saveStoredTotalsForDate(selectedDateKey, eatenTotals, true).catch(
      (err) => {
        console.error("Error saving daily totals:", err);
      },
    );
  }, [
    eatenTotals,
    eatenLoaded,
    isTodaySelected,
    selectedDateKey,
    loadedDateKey,
    hasTotalsData,
  ]);

  // Reset o polnoci (lokálny čas) aj pri otvorenej appke
  useEffect(() => {
    if (!eatenLoaded || !isTodaySelected) return;

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime() + 500;

    const timer = setTimeout(async () => {
      const cleared = { ...DEFAULT_TOTALS };
      setHasTotalsData(false);
      setEatenTotals(cleared);
      setSelectedDate(new Date());
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [eatenLoaded, isTodaySelected]);

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
    
    // Vzorec závisí od veku
    if (age < 18) {
      // Vzorec pre deti/tínedžerov (FAO/WHO/UNU)
      if (gender === "male")
        cal = (17.686 * weight + 658.2) * activityLevel;
      else
        cal = (13.384 * weight + 692.6) * activityLevel;
    } else {
      // Vzorec pre dospelých (Mifflin-St Jeor)
      if (gender === "male")
        cal = (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel;
      else
        cal = (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;
    }

    if (goal === "lose") cal -= 500;
    if (goal === "gain") cal += 500;

    const progressBar = Math.min((calories / cal) * 100, 100);
    const barColor = progressBar >= 100 ? "#FF3B30" : "#4CAF50";

    let eatOutput = `Prekročil/a si cieľ o ${Math.round(calories - cal)} kcal`;
    if (calories < cal)
      eatOutput = `Ešte ti chýba ${Math.round(cal - calories)} kcal`;
    if (calories === cal) eatOutput = "Dostal/-a si sa na svoj denný cieľ!";

    // Age-based nutritional targets (DRI AMDR + AHA sugars)
    let proteinPercent;
    let carbPercent;
    let fatPercent;

    if (age >= 1 && age <= 3) {
      // AMDR: protein 5-20%, carbs 45-65%, fat 30-40% (higher fat, lower protein)
      proteinPercent = 0.12;
      carbPercent = 0.50;
      fatPercent = 0.38;
    } else if (age <= 18) {
      // AMDR: protein 10-30%, carbs 45-65%, fat 25-35% (higher fat, lower protein)
      proteinPercent = 0.15;
      carbPercent = 0.50;
      fatPercent = 0.35;
    } else {
      // AMDR: protein 10-35%, carbs 45-65%, fat 20-35%
      proteinPercent = 0.20;
      carbPercent = 0.50;
      fatPercent = 0.30;
    }

    let proteinRda;
    if (age <= 3) {
      proteinRda = 13;
    } else if (age <= 8) {
      proteinRda = 19;
    } else if (age <= 13) {
      proteinRda = 34;
    } else if (age <= 18) {
      proteinRda = gender === "male" ? 52 : 46;
    } else {
      proteinRda = gender === "male" ? 56 : 46;
    }

    const minProteinPercent = (proteinRda * 4) / cal;
    const proteinPercentEffective = Math.max(proteinPercent, minProteinPercent);
    const remainingPercent = Math.max(0, 1 - proteinPercentEffective);
    const carbFatTotal = carbPercent + fatPercent;
    const carbPercentEffective = (carbPercent / carbFatTotal) * remainingPercent;
    const fatPercentEffective = (fatPercent / carbFatTotal) * remainingPercent;

    const proteinGoal = ((cal * proteinPercentEffective) / 4).toFixed(0);
    const carbGoal = ((cal * carbPercentEffective) / 4).toFixed(0);
    const fatGoal = ((cal * fatPercentEffective) / 9).toFixed(0);

    // Fiber AI by age/sex (DRI)
    let fiberGoal;
    if (age <= 3) {
      fiberGoal = 19;
    } else if (age <= 8) {
      fiberGoal = 25;
    } else if (age <= 13) {
      fiberGoal = gender === "male" ? 31 : 26;
    } else if (age <= 18) {
      fiberGoal = gender === "male" ? 38 : 26;
    } else if (age <= 50) {
      fiberGoal = gender === "male" ? 38 : 25;
    } else {
      fiberGoal = gender === "male" ? 30 : 21;
    }

    // Added sugar: AHA recommends <=6% of calories (stricter than WHO <10%)
    const sugarGoal = ((cal * 0.06) / 4).toFixed(0);

    // Sodium AI (DRI) converted to salt using WHO conversion
    const sodiumToSalt = 2.5; // 1 g sodium = 2.5 g salt
    let sodiumGoal;
    if (age <= 3) {
      sodiumGoal = 1.0;
    } else if (age <= 8) {
      sodiumGoal = 1.2;
    } else if (age <= 18) {
      sodiumGoal = 1.5;
    } else if (age <= 50) {
      sodiumGoal = 1.5;
    } else if (age <= 70) {
      sodiumGoal = 1.3;
    } else {
      sodiumGoal = 1.2;
    }
    const saltGoal = Number((sodiumGoal * sodiumToSalt).toFixed(2));

    // Total water AI by age/sex (DRI, includes food + beverages)
    let waterGoal;
    if (age <= 3) {
      waterGoal = 1300;
    } else if (age <= 8) {
      waterGoal = 1700;
    } else if (age <= 13) {
      waterGoal = gender === "male" ? 2400 : 2100;
    } else if (age <= 18) {
      waterGoal = gender === "male" ? 3300 : 2300;
    } else if (age <= 50) {
      waterGoal = gender === "male" ? 3700 : 2700;
    } else {
      waterGoal = gender === "male" ? 3700 : 2700;
    }

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

  const dailyGoal = Number(overviewData.caloriesGoal) || 0;
  const dailyConsumed = Number(overviewData.caloriesConsumed) || 0;
  const dailyRatio = dailyGoal > 0 ? dailyConsumed / dailyGoal : 0;
  const isDailyGoalMet = dailyRatio >= 1;
  const isDailyGoalOver = dailyRatio >= 1.5;
  const showGoalBanner = rangeView === "day" && isTodaySelected && isDailyGoalMet;

  useEffect(() => {
    if (!showGoalBanner) {
      celebrationAnim.stopAnimation();
      celebrationAnim.setValue(0);
      return;
    }

    celebrationAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [showGoalBanner, celebrationAnim]);

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const celebrationRotate = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "8deg"],
  });

  if (!weight || !height || !age) {
    return (
      <View style={[styles.overviewMissingProfileContainer, themed.surface]}>
        <Text style={[styles.overviewMissingProfileText, themed.text]}>
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

  const macroCards = [
    {
      key: "protein",
      label: "Bielkoviny",
      consumed: overviewData.proteinConsumed,
      goal: overviewData.proteinGoal,
      bar: overviewData.proteinBar,
      unit: "g",
      accent: "#f59e0b",
    },
    {
      key: "carbs",
      label: "Sacharidy",
      consumed: overviewData.carbConsumed,
      goal: overviewData.carbGoal,
      bar: overviewData.carbBar,
      unit: "g",
      accent: "#5d8c3a",
    },
    {
      key: "fat",
      label: "Tuky",
      consumed: overviewData.fatConsumed,
      goal: overviewData.fatGoal,
      bar: overviewData.fatBar,
      unit: "g",
      accent: "#ec5757",
    },
    {
      key: "fiber",
      label: "Vláknina",
      consumed: overviewData.fiberConsumed,
      goal: overviewData.fiberGoal,
      bar: overviewData.fiberBar,
      unit: "g",
      accent: "#10b981",
    },
    {
      key: "sugar",
      label: "Pridané cukry",
      consumed: overviewData.sugarConsumed,
      goal: overviewData.sugarGoal,
      bar: overviewData.sugarBar,
      unit: "g",
      accent: "#f97316",
    },
    {
      key: "salt",
      label: "Soľ",
      consumed: overviewData.saltConsumed,
      goal: overviewData.saltGoal,
      bar: overviewData.saltBar,
      unit: "g",
      accent: "#3b82f6",
    },
  ];

  const buildChartData = () => {
    if (rangeView === "day") {
      return { title: "", rangeLabel: "", data: [] };
    }

    const totalsByDate = {};
    rangeTotals.forEach((entry) => {
      if (!entry?.date) return;
      totalsByDate[entry.date] = entry;
    });

    if (rangeView === "week") {
      const { startDate, endDate } = getRangeForView(selectedDate, rangeView);
      const dateKeys = buildDateKeysInRange(startDate, endDate);
      const data = dateKeys.map((dateKey) => {
        const entry = totalsByDate[dateKey];
        const totals = entry?.totals;
        const dateObj = parseDateKey(dateKey);
        const label = DAY_LABELS[dateObj.getDay()];
        const subLabel = formatShortDate(dateObj);
        const calories =
          totals?.calories !== undefined && totals?.calories !== null
            ? totals.calories
            : null;
        const hasCalories = calories !== null;
        const ratio = hasCalories && dailyGoal > 0 ? calories / dailyGoal : null;
        const fallbackGoalMet = typeof entry?.goalMet === "boolean" ? entry.goalMet : false;
        const goalMet = ratio !== null ? ratio >= 1 : fallbackGoalMet;
        const overLimit = ratio !== null ? ratio >= 1.5 : false;
        const value =
          hasCalories
            ? calories
            : dailyGoal > 0 && goalMet
              ? dailyGoal
              : 0;
        const percent = dailyGoal > 0 ? (value / dailyGoal) * 100 : 0;

        return {
          label,
          subLabel,
          value,
          percent,
          goalMet,
          status: overLimit ? "over" : goalMet ? "met" : "none",
        };
      });

      return {
        title: "KALORIE",
        rangeLabel: "Týždeň",
        data,
      };
    }

    if (rangeView === "year") {
      const year = selectedDate.getFullYear();
      const monthStats = Array.from({ length: 12 }, (_, index) => ({
        monthIndex: index,
        daysInMonth: new Date(year, index + 1, 0).getDate(),
        metDays: 0,
      }));

      rangeTotals.forEach((entry) => {
        if (!entry?.date) return;
        const dateObj = parseDateKey(entry.date);
        if (dateObj.getFullYear() !== year) return;
        const monthIndex = dateObj.getMonth();
        const calories =
          entry?.totals?.calories !== undefined && entry?.totals?.calories !== null
            ? entry.totals.calories
            : null;
        const ratio = calories !== null && dailyGoal > 0 ? calories / dailyGoal : null;
        const goalMet =
          ratio !== null
            ? ratio >= 1
            : typeof entry?.goalMet === "boolean"
              ? entry.goalMet
              : false;

        if (goalMet) monthStats[monthIndex].metDays += 1;
      });

      return {
        rangeLabel: "Rok",
        data: monthStats.map((item) => ({
          label: MONTH_LABELS[item.monthIndex],
          value: item.metDays,
          daysInMonth: item.daysInMonth,
          percent: item.daysInMonth
            ? (item.metDays / item.daysInMonth) * 100
            : 0,
          isCurrent: item.monthIndex === selectedDate.getMonth(),
        })),
      };
    }

    return { title: "", rangeLabel: "", data: [] };
  };

  const chartConfig = buildChartData();
  const isYearView = rangeView === "year";
  const chartTotalValue = chartConfig.data.reduce(
    (sum, item) => sum + (item.value || 0),
    0,
  );
  const chartAverageValue = chartConfig.data.length
    ? chartTotalValue / chartConfig.data.length
    : 0;
  const chartTopItem = chartConfig.data.reduce((best, item) => {
    if (!best || (item.value || 0) > (best.value || 0)) return item;
    return best;
  }, null);

  const renderRangeChart = () => {
    if (!chartConfig.data.length) {
      return (
        <Text style={[styles.overviewChartEmptyText, themed.subtle]}>
          Žiadne dáta
        </Text>
      );
    }
    const rangeSuffix = rangeView === "year" ? "mesiacov" : "dni";
    const averageSuffix = rangeView === "year" ? "na mesiac" : "na deň";
    const rangeMeta = chartConfig.rangeLabel
      ? `${chartConfig.rangeLabel} (${chartConfig.data.length} ${rangeSuffix})`
      : "";
    const totalValueLabel = isYearView
      ? `${Math.round(chartTotalValue)} splnených dní`
      : `${Math.round(chartTotalValue)} kcal spolu`;
    const averageValueLabel = isYearView
      ? `${Math.round(chartAverageValue)} dní`
      : `${Math.round(chartAverageValue)} kcal`;
    const maxValueLabel = isYearView
      ? `${chartTopItem ? Math.round(chartTopItem.value) : 0} dní`
      : `${chartTopItem ? Math.round(chartTopItem.value) : 0} kcal`;
    const maxMetaLabel =
      chartTopItem && isYearView
        ? `${chartTopItem.label} (${chartTopItem.value}/${chartTopItem.daysInMonth} dní)`
        : "";

    return (
      <View>
        <View style={styles.overviewChartMetaRow}>
          <Text style={[styles.overviewChartMetaLabel, themed.text]}>
            {rangeMeta}
          </Text>
          <Text style={[styles.overviewChartMetaValue, themed.muted]}>
            {totalValueLabel}
          </Text>
        </View>

        <View style={[styles.overviewChartSummary, themed.surfaceAlt]}>
          <View style={styles.overviewChartSummaryItem}>
            <Text style={[styles.overviewChartSummaryLabel, themed.muted]}>
              Priemer
            </Text>
            <Text style={[styles.overviewChartSummaryValue, themed.text]}>
              {averageValueLabel}
            </Text>
            <Text style={[styles.overviewChartSummaryMeta, themed.subtle]}>
              {averageSuffix}
            </Text>
          </View>
          <View style={styles.overviewChartSummaryItem}>
            <Text style={[styles.overviewChartSummaryLabel, themed.muted]}>
              Maximum
            </Text>
            <Text style={[styles.overviewChartSummaryValue, themed.text]}>
              {maxValueLabel}
            </Text>
            {chartTopItem ? (
              <Text style={[styles.overviewChartSummaryMeta, themed.subtle]}>
                {isYearView
                  ? maxMetaLabel
                  : `${chartTopItem.label}${chartTopItem.subLabel ? ` (${chartTopItem.subLabel})` : ""}`}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.overviewChartList}>
          {chartConfig.data.map((item, index) => {
            const percentValue = Number(item.percent || 0);
            const barPercent = Math.min(percentValue, 100);
            const isPeak = item === chartTopItem && !isYearView;
            const isCurrentMonth = isYearView && item.isCurrent;
            const isOverLimit = !isYearView && item.status === "over";
            const isGoalMet = !isYearView && (item.status === "met" || item.status === "over");
            const barColor = isOverLimit
              ? "#ef4444"
              : isGoalMet
                ? "#2f7d32"
                : "#5d8c3a";
            const rowValueText = isYearView
              ? `${item.value} / ${item.daysInMonth} dní`
              : `${Math.round(item.value)} kcal`;

            return (
              <View
                key={`${item.label}-${index}`}
                style={[
                  styles.overviewChartRowCard,
                  themed.surfaceAlt,
                  isPeak && styles.overviewChartRowCardHighlight,
                  isCurrentMonth && styles.overviewChartRowCardCurrent,
                  isGoalMet && styles.overviewChartRowCardSuccess,
                  isOverLimit && styles.overviewChartRowCardOver,
                ]}
              >
                <View style={styles.overviewChartRowHeader}>
                  <View style={styles.overviewChartRowLabelGroup}>
                    <Text style={[styles.overviewChartRowLabel, themed.text]}>
                      {item.label}
                    </Text>
                    {item.subLabel ? (
                      <Text style={[styles.overviewChartRowSubLabel, themed.muted]}>
                        {item.subLabel}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.overviewChartRowValueGroup}>
                    <Text style={[styles.overviewChartRowValue, themed.text]}>
                      {rowValueText}
                    </Text>
                    <Text style={[styles.overviewChartRowPercent, themed.muted]}>
                      {Math.round(percentValue)}%
                    </Text>
                  </View>
                </View>
                <View style={[styles.overviewChartRowBarTrack, themed.progressTrack]}>
                  <View
                    style={[
                      styles.overviewChartRowBarFill,
                      { width: `${barPercent}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.overviewScreen, themed.screen]}>
      {showGoalBanner ? (
        <View
          style={[
            styles.overviewGoalBanner,
            {
              backgroundColor: isDailyGoalOver
                ? colors.dangerSoft
                : colors.primarySoft,
              borderColor: isDailyGoalOver ? colors.danger : colors.primary,
            },
          ]}
        >
          <View style={styles.overviewGoalBannerRow}>
            <View style={styles.overviewGoalBannerTextBlock}>
              <Text
                style={[
                  styles.overviewGoalBannerTitle,
                  { color: isDailyGoalOver ? colors.danger : colors.primary },
                ]}
              >
                {isDailyGoalOver
                  ? "Pozor, značne si prekročil cieľ"
                  : "Denný cieľ splnený"}
              </Text>
              <Text style={[styles.overviewGoalBannerText, themed.textSoft]}>
                {isDailyGoalOver
                  ? "Skus trochu ubrat, aby si ostal v rovnovahe."
                  : "Skvelá práca, pokračuj!"}
              </Text>
            </View>
            <View style={styles.overviewGoalConfettiContainer}>
              <Animated.Text
                style={[
                  styles.overviewGoalConfetti,
                  {
                    opacity: celebrationAnim,
                    transform: [
                      { scale: celebrationScale },
                      { rotate: celebrationRotate },
                    ],
                  },
                ]}
              >
                {isDailyGoalOver ? "❗" : "🎉"}
              </Animated.Text>
            </View>
          </View>
        </View>
      ) : null}
      <View style={styles.overviewHeader}>
        <Text style={[styles.overviewTitle, themed.text]}>Prehľad</Text>
      </View>

      <View style={styles.overviewDateRow}>
        <Pressable
          style={[styles.overviewDateButton, themed.surface]}
          onPress={() => handleDateShift(-1)}
        >
          <Text style={[styles.overviewDateArrow, themed.text]}>{"<"}</Text>
        </Pressable>
        <Text style={[styles.overviewDateText, themed.muted]}>
          {currentDate}
        </Text>
        {canShiftForward ? (
          <Pressable
            style={[styles.overviewDateButton, themed.surface]}
            onPress={() => handleDateShift(1)}
          >
            <Text style={[styles.overviewDateArrow, themed.text]}>{">"}</Text>
          </Pressable>
        ) : (
          <View style={styles.overviewDateButtonSpacer} />
        )}
      </View>

      <View style={[styles.overviewRangeRow, themed.surfaceAlt]}>
        {rangeOptions.map((option) => {
          const isActive = rangeView === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                if (option.key === "day") {
                  setSelectedDate(new Date());
                }
                setRangeView(option.key);
              }}
              style={[
                styles.overviewRangeButton,
                isActive && styles.overviewRangeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.overviewRangeButtonText,
                  themed.muted,
                  isActive && styles.overviewRangeButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {rangeView !== "day" ? (
        <View style={[styles.overviewChartCard, themed.surface]}>
          {rangeLoading ? (
            <Text style={[styles.overviewChartLoading, themed.muted]}>
              Načítavam dáta...
            </Text>
          ) : (
            renderRangeChart()
          )}
        </View>
      ) : null}

      {rangeView === "day" ? (
        <>
          <View style={[styles.overviewCard, styles.overviewCardAccent, themed.surface]}>
            <View style={styles.overviewCardTopRow}>
              <View>
                <Text style={[styles.overviewCardLabel, themed.muted]}>Kalórie</Text>
                <Text style={[styles.overviewCardValueLarge, themed.text]}>
                  {overviewData.caloriesConsumed} kcal
                </Text>
              </View>
              {isTodaySelected ? (
                <View style={styles.overviewBadge}>
                  <Text style={styles.overviewBadgeText}>Dnes</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.overviewCardSubText, themed.textSoft]}>
              {overviewData.eatOutput}
            </Text>
            <View style={[styles.overviewProgressBar, themed.progressTrack]}>
              <View
                style={[
                  styles.overviewProgressFill,
                  {
                    width: `${overviewData.progressBar}%`,
                    backgroundColor: overviewData.barColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.overviewProgressText, themed.muted]}>
              {overviewData.eatenOutput}
            </Text>
          </View>

          <Text style={[styles.overviewSectionTitle, themed.text]}>Makronutrienty</Text>
          <View style={styles.overviewGrid}>
            {macroCards.map((card) => (
              <View
                key={card.key}
                style={[
                  styles.overviewStatCard,
                  themed.surfaceAlt,
                  { borderLeftColor: card.accent },
                ]}
              >
                <Text style={[styles.overviewStatLabel, themed.muted]}>
                  {card.label}
                </Text>
                <Text style={[styles.overviewStatValue, themed.text]}>
                  {card.consumed} / {card.goal} {card.unit}
                </Text>
                <View style={[styles.overviewProgressBarSmall, themed.progressTrack]}>
                  <View
                    style={[
                      styles.overviewProgressFill,
                      {
                        width: `${card.bar}%`,
                        backgroundColor: nutriBarColor(card.bar),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.overviewSectionTitle, themed.text]}>Hydratácia</Text>
          <View style={[styles.overviewCard, styles.overviewCardAccentBlue, themed.surface]}>
            <View style={styles.overviewCardTopRow}>
              <View>
                <Text style={[styles.overviewCardLabel, themed.muted]}>Voda</Text>
                <Text style={[styles.overviewCardValue, themed.text]}>
                  {overviewData.drunkWater} / {overviewData.waterGoal} ml
                </Text>
              </View>
              <Pressable
                style={[
                  styles.overviewAddWaterButton,
                  !isTodaySelected && styles.overviewAddWaterButtonDisabled,
                ]}
                onPress={() => setModalVisible(true)}
                disabled={!isTodaySelected}
              >
                <Image source={plus} style={styles.overviewAddWaterIcon} />
              </Pressable>
            </View>
            <View style={[styles.overviewProgressBar, themed.progressTrack]}>
              <View
                style={[
                  styles.overviewProgressFill,
                  {
                    width: `${overviewData.waterBar}%`,
                    backgroundColor: "#3b82f6",
                  },
                ]}
              />
            </View>
          </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeWaterModal}
      >
        <View style={[styles.overviewModalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.overviewModalContent, themed.modalContent]}>
            <Text style={[styles.overviewModalTitle, themed.text]}>
              Vyber možnosť
            </Text>

            {options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.overviewModalOptionRow}
                onPress={() => setSelectedOption(opt.label)}
              >
                <View
                  style={[
                    styles.overviewModalRadioOuter,
                    { borderColor: colors.text },
                  ]}
                >
                  {selectedOption === opt.label && (
                    <View style={styles.overviewModalRadioInner} />
                  )}
                </View>
                <View>
                  <Text style={[styles.overviewModalOptionLabel, themed.text]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.overviewModalOptionDescription, themed.muted]}>
                    {opt.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.overviewModalOptionRow}
              onPress={() => setSelectedOption(CUSTOM_WATER_OPTION)}
            >
              <View
                style={[
                  styles.overviewModalRadioOuter,
                  { borderColor: colors.text },
                ]}
              >
                {selectedOption === CUSTOM_WATER_OPTION && (
                  <View style={styles.overviewModalRadioInner} />
                )}
              </View>
              <View style={styles.overviewModalCustomContent}>
                <Text style={[styles.overviewModalOptionLabel, themed.text]}>
                  Vlastná hodnota
                </Text>
                <View style={styles.overviewModalCustomInputRow}>
                  <TextInput
                    value={customWaterMl}
                    onChangeText={(value) => {
                      const cleaned = value.replace(/[^0-9]/g, "");
                      setCustomWaterMl(cleaned);
                      if (selectedOption !== CUSTOM_WATER_OPTION) {
                        setSelectedOption(CUSTOM_WATER_OPTION);
                      }
                    }}
                    onFocus={() => setSelectedOption(CUSTOM_WATER_OPTION)}
                    placeholder="Zadaj ml"
                    keyboardType="numeric"
                    style={[styles.overviewModalCustomInput, themed.input]}
                    placeholderTextColor={colors.placeholder}
                  />
                  <Text style={[styles.overviewModalCustomUnit, themed.muted]}>ml</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Pressable
              style={[
                styles.overviewModalConfirmButton,
                !canConfirmWater && styles.overviewModalConfirmButtonDisabled,
              ]}
              onPress={addWater}
              disabled={!canConfirmWater}
            >
              <Text
                style={[
                  styles.overviewModalConfirmButtonText,
                  !canConfirmWater &&
                    styles.overviewModalConfirmButtonTextDisabled,
                ]}
              >
                Potvrdiť
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Text style={[styles.overviewSectionTitle, themed.text]}>BMI</Text>
      <View style={[styles.overviewCard, themed.surface]}>
    
        <Text style={[styles.overviewBmiText, themed.text]}>
          {overviewData.bmiOutput}
        </Text>
        <View style={[styles.overviewProgressBar, themed.progressTrack]}>
          <View
            style={[
              styles.overviewProgressFill,
              {
                width: `${overviewData.bmiBar}%`,
                backgroundColor: overviewData.bmiBarColor,
              },
            ]}
          />
        </View>
      </View>
        </>
      ) : null}
    </View>
  );
}

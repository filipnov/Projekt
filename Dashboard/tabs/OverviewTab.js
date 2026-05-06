import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadTotalsForDate as loadStoredTotalsForDate,
  saveTotalsForDate as saveStoredTotalsForDate,
} from "../../dailyTotalsStorage";
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

  const selectedDateKey = getTodayKey(selectedDate);
  const currentDate = formatDisplayDate(selectedDate);
  const isTodaySelected = selectedDateKey === getTodayKey();

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

  const handleDateShift = (delta) => {
    setSelectedDate((prev) => shiftDateByDays(prev, delta));
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
    fetchRangeTotals(startKey, endKey).then((range) => {
      if (!isActive) return;
      setRangeTotals(range);
      setRangeLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [email, rangeView, selectedDate, fetchRangeTotals]);

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

    const proteinGoal = ((cal * 0.18) / 4).toFixed(0);
    const carbGoal = ((cal * 0.55) / 4).toFixed(0);
    const fatGoal = ((cal * 0.27) / 9).toFixed(0);
    const fiberGoal = ((cal / 1000) * 14).toFixed(0);
    const sugarGoal = ((cal * 0.1) / 4).toFixed(0);
    const saltGoal = 5;
    const waterGoal = 35 * weight;

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
      label: "Cukry",
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

  const dailyGoal = Number(overviewData.caloriesGoal) || 0;

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
        const goalMet =
          typeof entry?.goalMet === "boolean"
            ? entry.goalMet
            : dailyGoal > 0
              ? (calories || 0) >= dailyGoal
              : false;
        const value =
          calories !== null
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
        const calories = entry?.totals?.calories || 0;
        const goalMet =
          typeof entry?.goalMet === "boolean"
            ? entry.goalMet
            : dailyGoal > 0
              ? calories >= dailyGoal
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
        <Text style={styles.overviewChartEmptyText}>Žiadne dáta</Text>
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
          <Text style={styles.overviewChartMetaLabel}>{rangeMeta}</Text>
          <Text style={styles.overviewChartMetaValue}>{totalValueLabel}</Text>
        </View>

        <View style={styles.overviewChartSummary}>
          <View style={styles.overviewChartSummaryItem}>
            <Text style={styles.overviewChartSummaryLabel}>Priemer</Text>
            <Text style={styles.overviewChartSummaryValue}>
              {averageValueLabel}
            </Text>
            <Text style={styles.overviewChartSummaryMeta}>{averageSuffix}</Text>
          </View>
          <View style={styles.overviewChartSummaryItem}>
            <Text style={styles.overviewChartSummaryLabel}>Maximum</Text>
            <Text style={styles.overviewChartSummaryValue}>
              {maxValueLabel}
            </Text>
            {chartTopItem ? (
              <Text style={styles.overviewChartSummaryMeta}>
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
            const isGoalMet = !isYearView && percentValue >= 100;
            const barColor = isGoalMet ? "#2f7d32" : "#5d8c3a";
            const rowValueText = isYearView
              ? `${item.value} / ${item.daysInMonth} dní`
              : `${Math.round(item.value)} kcal`;

            return (
              <View
                key={`${item.label}-${index}`}
                style={[
                  styles.overviewChartRowCard,
                  isPeak && styles.overviewChartRowCardHighlight,
                  isCurrentMonth && styles.overviewChartRowCardCurrent,
                ]}
              >
                <View style={styles.overviewChartRowHeader}>
                  <View style={styles.overviewChartRowLabelGroup}>
                    <Text style={styles.overviewChartRowLabel}>{item.label}</Text>
                    {item.subLabel ? (
                      <Text style={styles.overviewChartRowSubLabel}>
                        {item.subLabel}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.overviewChartRowValueGroup}>
                    <Text style={styles.overviewChartRowValue}>
                      {rowValueText}
                    </Text>
                    <Text style={styles.overviewChartRowPercent}>
                      {Math.round(percentValue)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.overviewChartRowBarTrack}>
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
    <View style={styles.overviewScreen}>
      <View style={styles.overviewHeader}>
        <Text style={styles.overviewTitle}>Prehľad</Text>
      </View>

      <View style={styles.overviewDateRow}>
        <Pressable
          style={styles.overviewDateButton}
          onPress={() => handleDateShift(-1)}
        >
          <Text style={styles.overviewDateArrow}>{"<"}</Text>
        </Pressable>
        <Text style={styles.overviewDateText}>{currentDate}</Text>
        <Pressable
          style={styles.overviewDateButton}
          onPress={() => handleDateShift(1)}
        >
          <Text style={styles.overviewDateArrow}>{">"}</Text>
        </Pressable>
      </View>

      <View style={styles.overviewRangeRow}>
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
        <View style={styles.overviewChartCard}>
          {rangeLoading ? (
            <Text style={styles.overviewChartLoading}>Načítavam dáta...</Text>
          ) : (
            renderRangeChart()
          )}
        </View>
      ) : null}

      <View style={[styles.overviewCard, styles.overviewCardAccent]}>
        <View style={styles.overviewCardTopRow}>
          <View>
            <Text style={styles.overviewCardLabel}>Kalórie</Text>
            <Text style={styles.overviewCardValueLarge}>
              {overviewData.caloriesConsumed} kcal
            </Text>
          </View>
          {isTodaySelected ? (
            <View style={styles.overviewBadge}>
              <Text style={styles.overviewBadgeText}>Dnes</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.overviewCardSubText}>{overviewData.eatOutput}</Text>
        <View style={styles.overviewProgressBar}>
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
        <Text style={styles.overviewProgressText}>{overviewData.eatenOutput}</Text>
      </View>

      <Text style={styles.overviewSectionTitle}>Makronutrienty</Text>
      <View style={styles.overviewGrid}>
        {macroCards.map((card) => (
          <View
            key={card.key}
            style={[styles.overviewStatCard, { borderLeftColor: card.accent }]}
          >
            <Text style={styles.overviewStatLabel}>{card.label}</Text>
            <Text style={styles.overviewStatValue}>
              {card.consumed} / {card.goal} {card.unit}
            </Text>
            <View style={styles.overviewProgressBarSmall}>
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

      <Text style={styles.overviewSectionTitle}>Hydratácia</Text>
      <View style={[styles.overviewCard, styles.overviewCardAccentBlue]}>
        <View style={styles.overviewCardTopRow}>
          <View>
            <Text style={styles.overviewCardLabel}>Voda</Text>
            <Text style={styles.overviewCardValue}>
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
        <View style={styles.overviewProgressBar}>
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
        <View style={styles.overviewModalOverlay}>
          <View style={styles.overviewModalContent}>
            <Text style={styles.overviewModalTitle}>Vyber možnosť</Text>

            {options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.overviewModalOptionRow}
                onPress={() => setSelectedOption(opt.label)}
              >
                <View style={styles.overviewModalRadioOuter}>
                  {selectedOption === opt.label && (
                    <View style={styles.overviewModalRadioInner} />
                  )}
                </View>
                <View>
                  <Text style={styles.overviewModalOptionLabel}>{opt.label}</Text>
                  <Text style={styles.overviewModalOptionDescription}>
                    {opt.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.overviewModalOptionRow}
              onPress={() => setSelectedOption(CUSTOM_WATER_OPTION)}
            >
              <View style={styles.overviewModalRadioOuter}>
                {selectedOption === CUSTOM_WATER_OPTION && (
                  <View style={styles.overviewModalRadioInner} />
                )}
              </View>
              <View style={styles.overviewModalCustomContent}>
                <Text style={styles.overviewModalOptionLabel}>
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
                    style={styles.overviewModalCustomInput}
                  />
                  <Text style={styles.overviewModalCustomUnit}>ml</Text>
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

      <Text style={styles.overviewSectionTitle}>BMI</Text>
      <View style={styles.overviewCard}>
    
        <Text style={styles.overviewBmiText}>{overviewData.bmiOutput}</Text>
        <View style={styles.overviewProgressBar}>
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
    </View>
  );
}

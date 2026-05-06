import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_CONSUMPTION_KEY = "dailyConsumption";
const LEGACY_TOTALS_KEY = "eatenTotals";
const LEGACY_DATE_KEY = "eatenTotalsDate";

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const readDailyConsumption = async () => {
  const raw = await AsyncStorage.getItem(DAILY_CONSUMPTION_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch (err) {
    console.error("Error parsing dailyConsumption cache:", err);
    return {};
  }
};

export const loadTotalsForDate = async (dateKey, defaultTotals) => {
  const dailyConsumption = await readDailyConsumption();
  const storedTotals = dailyConsumption[dateKey];

  if (isPlainObject(storedTotals)) {
    return { ...defaultTotals, ...storedTotals };
  }

  const legacyDate = await AsyncStorage.getItem(LEGACY_DATE_KEY);
  if (legacyDate === dateKey) {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_TOTALS_KEY);
    if (legacyRaw) {
      try {
        const legacyTotals = JSON.parse(legacyRaw);
        if (isPlainObject(legacyTotals)) {
          const merged = { ...defaultTotals, ...legacyTotals };
          dailyConsumption[dateKey] = merged;
          await AsyncStorage.setItem(
            DAILY_CONSUMPTION_KEY,
            JSON.stringify(dailyConsumption),
          );
          return merged;
        }
      } catch (err) {
        console.error("Error parsing legacy eatenTotals:", err);
      }
    }
  }

  return null;
};

export const saveTotalsForDate = async (
  dateKey,
  totals,
  writeLegacy = false,
) => {
  const dailyConsumption = await readDailyConsumption();
  dailyConsumption[dateKey] = totals;

  const entries = [
    [DAILY_CONSUMPTION_KEY, JSON.stringify(dailyConsumption)],
  ];

  if (writeLegacy) {
    const payload = JSON.stringify(totals);
    entries.push([LEGACY_TOTALS_KEY, payload], [LEGACY_DATE_KEY, dateKey]);
  }

  await AsyncStorage.multiSet(entries);
};

export const updateTotalsForDate = async (
  dateKey,
  defaultTotals,
  updater,
  writeLegacy = false,
) => {
  const currentTotals =
    (await loadTotalsForDate(dateKey, defaultTotals)) || { ...defaultTotals };
  const nextTotals = updater(currentTotals);
  await saveTotalsForDate(dateKey, nextTotals, writeLegacy);
  return nextTotals;
};

//notifications.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Kľúč pre uloženie času notifikácií
const STORAGE_KEY = "notificationTimes";
const DAILY_NOTIFICATION_IDS_KEY = "dailyNotificationIds";
const EXPIRATION_NOTIFICATION_IDS_KEY = "expirationNotificationIds";
const EXPIRATION_NOTIFICATION_PLANS_KEY = "expirationNotificationPlans";

const DEFAULT_TIMES = ["08:00", "11:00", "14:00", "17:00", "20:00"];
const DEFAULT_EXPIRATION_TIME = "08:00";
const MESSAGE_VARIANTS = [
  {
    title: "Čas na vodu",
    body: "Nezabudni dodržiavať pitný režim",
  },
  {
    title: "Špajza čaká",
    body: "Máś niečo nové? Pridaj to, nech máš prehľad.",
  },
];

const parseTimeValue = (timeValue, fallback = DEFAULT_EXPIRATION_TIME) => {
  const safeValue = typeof timeValue === "string" ? timeValue : fallback;
  const [hour, minute] = safeValue.split(":").map(Number);
  const safeHour = Number.isFinite(hour) ? hour : 8;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  return { hour: safeHour, minute: safeMinute };
};

const loadStoredIds = async (key) => {
  const stored = await AsyncStorage.getItem(key);
  const parsed = stored ? JSON.parse(stored) : [];
  return Array.isArray(parsed) ? parsed : [];
};

const saveStoredIds = async (key, ids) => {
  await AsyncStorage.setItem(key, JSON.stringify(ids));
};

const cancelNotificationsByIds = async (ids) => {
  if (!ids.length) return;
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
};

const loadExpirationPlans = async () => {
  const stored = await AsyncStorage.getItem(EXPIRATION_NOTIFICATION_PLANS_KEY);
  const parsed = stored ? JSON.parse(stored) : [];
  return Array.isArray(parsed) ? parsed : [];
};

const saveExpirationPlans = async (plans) => {
  await AsyncStorage.setItem(
    EXPIRATION_NOTIFICATION_PLANS_KEY,
    JSON.stringify(plans),
  );
};

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildExpirationKey = (product) => {
  const rawExpiration = product?.expirationDate;
  if (!rawExpiration) return null;

  const expirationDate = new Date(rawExpiration);
  if (Number.isNaN(expirationDate.getTime())) return null;

  const localDate = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate(),
  );
  const dateKey = toDateKey(localDate);
  const nameValue = typeof product?.name === "string" ? product.name.trim() : "";
  const normalizedName = nameValue ? nameValue.toLowerCase() : "potravina";

  return `${normalizedName}::${dateKey}`;
};

const buildExpirationTarget = (product, time = DEFAULT_EXPIRATION_TIME) => {
  const rawExpiration = product?.expirationDate;
  if (!rawExpiration) return null;

  const expirationDate = new Date(rawExpiration);
  if (Number.isNaN(expirationDate.getTime())) return null;

  const now = Date.now();
  const { hour, minute } = parseTimeValue(time, DEFAULT_EXPIRATION_TIME);
  const targetKey = buildExpirationKey(product);
  if (!targetKey) return null;

  const triggerDate = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate() - 1,
    hour,
    minute,
    0,
    0,
  );

  if (triggerDate.getTime() <= now) return null;

  const nameValue = typeof product?.name === "string" ? product.name.trim() : "";
  return {
    key: targetKey,
    name: nameValue || "Potravina",
    triggerDate,
  };
};

// Požiada používateľa o povolenia
export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Naplánuje notifikácie na konkrétne časy 
export async function scheduleDailyNotifications(times = DEFAULT_TIMES) {
  const storedIds = await loadStoredIds(DAILY_NOTIFICATION_IDS_KEY);

  if (storedIds.length) {
    await cancelNotificationsByIds(storedIds);
  }

  const nextIds = [];

  for (let index = 0; index < times.length; index += 1) {
    const time = times[index];
    const { hour, minute } = parseTimeValue(time, "08:00");
    const message = MESSAGE_VARIANTS[index % MESSAGE_VARIANTS.length];

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
      },
      trigger: {
        type: "daily",
        hour,
        minute,
      },
    });

    nextIds.push(id);
  }

  // Uložíme čas notifikácií do AsyncStorage
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(times));
  await saveStoredIds(DAILY_NOTIFICATION_IDS_KEY, nextIds);
}

export async function ensureNotificationsSetup(times = DEFAULT_TIMES) {
  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    status = (await requestPermissions()) ? "granted" : "denied";
    if (status !== "granted") return false;
  }

  const storedIds = await loadStoredIds(DAILY_NOTIFICATION_IDS_KEY);
  if (storedIds.length) return true;

  await scheduleDailyNotifications(times);
  return true;
}

export async function cancelExpirationNotifications() {
  const storedIds = await loadStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY);
  await cancelNotificationsByIds(storedIds);
  await saveStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY, []);
  await saveExpirationPlans([]);
}

export async function scheduleExpirationNotificationForProduct(
  product,
  time = DEFAULT_EXPIRATION_TIME,
) {
  const permissionStatus = await Notifications.getPermissionsAsync();
  if (permissionStatus.status !== "granted") return false;

  const target = buildExpirationTarget(product, time);
  if (!target) return false;

  const plans = await loadExpirationPlans();
  const existing = plans.find((plan) => plan.key === target.key);
  if (existing) return true;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Zajtra končí spotreba",
      body: `${target.name} - o deň končí dátum spotreby.`,
      sound: true,
    },
    trigger: {
      date: target.triggerDate,
    },
  });

  const nextPlans = [
    ...plans,
    {
      key: target.key,
      id,
      name: target.name,
      triggerDate: target.triggerDate.toISOString(),
    },
  ];

  const storedIds = await loadStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY);
  await saveStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY, [...storedIds, id]);
  await saveExpirationPlans(nextPlans);

  return true;
}

export async function removeExpirationNotificationForProduct(product) {
  const key = buildExpirationKey(product);
  if (!key) return false;

  const plans = await loadExpirationPlans();
  const matchIndex = plans.findIndex((plan) => plan.key === key);
  if (matchIndex === -1) return false;

  const match = plans[matchIndex];
  const nextPlans = plans.filter((_, index) => index !== matchIndex);
  await saveExpirationPlans(nextPlans);

  if (match?.id) {
    await Notifications.cancelScheduledNotificationAsync(match.id);

    const storedIds = await loadStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY);
    const nextIds = storedIds.filter((id) => id !== match.id);
    await saveStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY, nextIds);
  }

  return true;
}

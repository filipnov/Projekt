//notifications.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Kľúč pre uloženie času notifikácií
const STORAGE_KEY = "notificationTimes";
const PERMISSION_KEY = "notificationPermissionRequested";
const DAILY_NOTIFICATION_IDS_KEY = "dailyNotificationIds";
const EXPIRATION_NOTIFICATION_IDS_KEY = "expirationNotificationIds";
const EXPIRATION_NOTIFICATION_TIME_KEY = "expirationNotificationTime";

const DEFAULT_TIMES = ["08:00", "11:00", "14:00", "17:00", "20:00"];
const DEFAULT_EXPIRATION_TIME = "08:00";
const MESSAGE_VARIANTS = [
  {
    title: "💧 Čas na vodu",
    body: "Daj si pár dúškov a pokračuj v pohode.",
  },
  {
    title: "🥫 Špajza čaká",
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

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Požiada používateľa o povolenia
export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// Naplánuje notifikácie na konkrétne časy (napr. 10:00 a 18:00)
export async function scheduleDailyNotifications(times = DEFAULT_TIMES) {
  const storedIds = await loadStoredIds(DAILY_NOTIFICATION_IDS_KEY);

  if (storedIds.length) {
    await cancelNotificationsByIds(storedIds);
  } else {
    // Legacy cleanup pre staré verzie bez uložených ID.
    await cancelAllNotifications();
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

export async function ensureNotificationsSetup() {
  const requested = await AsyncStorage.getItem(PERMISSION_KEY);

  let status = null;
  if (!requested) {
    status = await requestPermissions();
    await AsyncStorage.setItem(PERMISSION_KEY, "true");
    if (!status) return false;
  } else {
    status = (await getPermissionStatus()) === "granted";
    if (!status) return false;
  }

  await scheduleDailyNotifications();
  return true;
}

// Zruší všetky naplánované notifikácie
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Načíta uložené časy notifikácií
export async function loadNotificationTimes() {
  const times = await AsyncStorage.getItem(STORAGE_KEY);
  return times ? JSON.parse(times) : null;
}

// Upraví existujúce časy notifikácií
export async function updateNotificationTimes(times) {
  await scheduleDailyNotifications(times);
}

export async function cancelExpirationNotifications() {
  const storedIds = await loadStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY);
  await cancelNotificationsByIds(storedIds);
  await saveStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY, []);
}

export async function rescheduleExpirationNotifications(
  products,
  time = DEFAULT_EXPIRATION_TIME,
) {
  const permissionStatus = await Notifications.getPermissionsAsync();
  if (permissionStatus.status !== "granted") return false;

  await cancelExpirationNotifications();

  const now = Date.now();
  const { hour, minute } = parseTimeValue(time, DEFAULT_EXPIRATION_TIME);
  const uniqueTargets = new Map();

  for (const product of products || []) {
    const rawExpiration = product?.expirationDate;
    if (!rawExpiration) continue;

    const expirationDate = new Date(rawExpiration);
    if (Number.isNaN(expirationDate.getTime())) continue;

    const localDate = new Date(
      expirationDate.getFullYear(),
      expirationDate.getMonth(),
      expirationDate.getDate(),
    );
    const dateKey = toDateKey(localDate);
    const nameValue = typeof product?.name === "string" ? product.name.trim() : "";
    const normalizedName = nameValue ? nameValue.toLowerCase() : "potravina";
    const targetKey = `${normalizedName}::${dateKey}`;

    if (uniqueTargets.has(targetKey)) continue;

    const triggerDate = new Date(
      expirationDate.getFullYear(),
      expirationDate.getMonth(),
      expirationDate.getDate() - 1,
      hour,
      minute,
      0,
      0,
    );

    if (triggerDate.getTime() <= now) continue;

    uniqueTargets.set(targetKey, {
      name: nameValue || "Potravina",
      triggerDate,
    });
  }

  const nextIds = [];

  for (const target of uniqueTargets.values()) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📆 Zajtra končí spotreba",
        body: `${target.name} – o deň končí dátum spotreby.`,
        sound: true,
      },
      trigger: {
        date: target.triggerDate,
      },
    });

    nextIds.push(id);
  }

  await saveStoredIds(EXPIRATION_NOTIFICATION_IDS_KEY, nextIds);
  await AsyncStorage.setItem(EXPIRATION_NOTIFICATION_TIME_KEY, time);

  return nextIds.length > 0;
}

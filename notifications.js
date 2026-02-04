//notifications.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Kľúč pre uloženie času notifikácií
const STORAGE_KEY = "notificationTimes";
const PERMISSION_KEY = "notificationPermissionRequested";

const DEFAULT_TIMES = ["08:00", "11:00", "14:00", "17:00", "20:00"];
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
  // Zruší staré notifikácie, aby sa neduplicovali
  await cancelAllNotifications();

  for (let index = 0; index < times.length; index += 1) {
    const time = times[index];
    const [hour, minute] = time.split(':').map(Number);
    const message = MESSAGE_VARIANTS[index % MESSAGE_VARIANTS.length];

    await Notifications.scheduleNotificationAsync({
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
  }

  // Uložíme čas notifikácií do AsyncStorage
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(times));
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
  await cancelAllNotifications();
  await scheduleDailyNotifications(times);
}

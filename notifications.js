/*// notifications.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kľúč pre uloženie času notifikácií
const STORAGE_KEY = 'notificationTimes';

// Požiada používateľa o povolenia
export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Naplánuje notifikácie na konkrétne časy (napr. 10:00 a 18:00)
export async function scheduleDailyNotifications(times = ['10:00', '22:09']) {
  // Zruší staré notifikácie, aby sa neduplicovali
  await cancelAllNotifications();

  for (let time of times) {
    const [hour, minute] = time.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nezabudni pridať do špajze!',
        body: 'Sleduj svoj pitný režim a pridaj nové položky do špajze.',
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true, // opakovanie každý deň
      },
    });
  }

  // Uložíme čas notifikácií do AsyncStorage
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(times));
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
*/
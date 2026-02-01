// ResetPass.js
// ResetPass.js
// Obrazovka na reset hesla cez token z e‑mailu (deep link)
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import logo from "./assets/logo.png";
import arrow from "./assets/left_arrow.png";
import * as Linking from "expo-linking";
import styles from "./styles";
import KeyboardWrapper from "./KeyboardWrapper";

export default function ResetPasswordScreen({ route }) {
  // URL backendu
  const SERVER_URL = "https://app.bitewise.it.com";
  // Navigácia medzi obrazovkami
  const navigation = useNavigation();

  // Lokálny stav pre nové heslo a token z linku
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");

  // Jednoduché helpery na zobrazovanie hlášok
  const showError = (message) => Alert.alert("Chyba", message);
  const showSuccess = (message) => Alert.alert("Úspech", message);

  // Vytiahne token z URL (deep linku)
  // 1) Najprv skontroluje, či URL vôbec existuje
  // 2) Potom ju rozparsuje na časti (path + query)
  // 3) Nakoniec vráti hodnotu parametra `token` alebo prázdny string
  const getTokenFromUrl = (url) => {
    if (!url) return "";
    const parsed = Linking.parse(url);
    return parsed.queryParams?.token || "";
  };

  // Ak je token platný (nie je prázdny), uloží ho do stavu
  // Vďaka tomu vieme token neskôr poslať na server pri resetovaní hesla
  const applyToken = (value) => {
    if (value) setToken(value);
  };

  useEffect(() => {
    // 1) Skús token z route params (ak appka otvorila tento screen priamo)
    //    Napr. keď navigácia poslala { token: "..." } v parametroch
    const paramsToken = route?.params?.token || "";
    if (paramsToken) {
      applyToken(paramsToken);
      return;
    }

    // 2) Skús token z deep linku (initial URL pri štarte appky)
    //    Toto je dôležité, keď používateľ otvorí link z e‑mailu
    //    a appka sa spustí úplne od nuly
    Linking.getInitialURL().then((url) => applyToken(getTokenFromUrl(url)));

    // 3) Počúvaj na nové deep linky, ak appka už beží
    //    Napr. keď je appka otvorená na pozadí a používateľ klikne na link
    const subscription = Linking.addEventListener("url", (event) => {
      applyToken(getTokenFromUrl(event?.url));
    });

    // Upratanie listenera pri odchode zo screenu
    // Aby sme nepočúvali zbytočne a nevznikali memory leaky
    return () => subscription?.remove?.();
  }, [route?.params]);

  // Odoslanie novej hodnoty hesla na server
  const handleReset = async () => {
    // Validácia: musí existovať token
    if (!token) {
      return showError(
        "Token pre reset hesla sa nenašiel. Skús otvoriť link z e‑mailu znova.",
      );
    }

    // Validácia: nové heslo nesmie byť prázdne
    if (!newPassword) {
      return showError("Zadaj nové heslo");
    }

    try {
      // POST požiadavka na server s tokenom a novým heslom
      const res = await fetch(`${SERVER_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      // Odpoveď zo servera
      const data = await res.json();

      // Úspech alebo chyba podľa odpovede
      if (data.ok) {
        showSuccess("Heslo bolo úspešne zmenené");
      } else {
        showError(data.error || "Reset hesla zlyhal");
      }
    } catch (err) {
      // Sieťová alebo iná chyba
      showError("Niečo sa pokazilo");
      console.error(err);
    }
  };

  return (
    <KeyboardWrapper style={styles.resetMainLayout}>
      <SafeAreaView style={styles.resetSafeArea} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.resetScrollContent}>
          {/* Hlavná karta resetu hesla */}
          <View style={styles.resetCardContainer}>
            <Text style={styles.resetTitleText}>Reset hesla</Text>
            <Text style={styles.resetInfoText}>
              Zadaj nové heslo a potvrď.
            </Text>

            {/* Vstup pre nové heslo */}
            <TextInput
              placeholder="Nové heslo"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.resetTextInput}
            />
            {/* Tlačidlo na odoslanie resetu */}
            <Pressable
              onPress={handleReset}
              style={({ pressed }) =>
                pressed
                  ? styles.resetActionButtonPressed
                  : styles.resetActionButton
              }
            >
              <Text style={styles.resetActionButtonText}>Resetovať heslo</Text>
            </Pressable>
          </View>

          {/* Návrat späť na HomeScreen */}
          <Pressable
            style={({ pressed }) =>
              pressed
                ? styles.resetBackArrowPressed
                : styles.resetBackArrowContainer
            }
            onPress={() => navigation.navigate("HomeScreen")}
          >
            <Image source={arrow} style={styles.resetBackArrow} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardWrapper>
  );
}
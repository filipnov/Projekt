// PantryTab.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import styles from "../styles";
import MealBoxItem from "../MealBoxItem";
import MealBoxWindow from "../MealBoxWindow";

export default function PantryTab({
  removeMealBox,
  removeProduct,
  addEatenValues,
}) {

  const SERVER_URL = "https://app.bitewise.it.com"
  const [userEmail, setUserEmail] = useState(null);
  const [mealBoxes, setMealBoxes] = useState([]); // opravené z mealBox
  const [activeBox, setActiveBox] = useState(null);

  // Funkcia pre načítanie produktov z backendu
  const fetchMealBoxes = async (email) => {
    try {
      const res = await fetch(
        `${SERVER_URL}/api/getProducts?email=${encodeURIComponent(
          email,
        )}`,
      );
      const data = await res.json();
      if (data.success) {
        const boxes = data.products.map((p) => ({
          id: p.productId || p.name,
          productId: p.productId,
          name: p.name,
          image: p.image,
          calories: p.calories || 0, // <-- na 100g
          proteins: p.proteins || 0, // <-- na 100g
          carbs: p.carbs || 0,
          fat: p.fat || 0,
          fiber: p.fiber || 0,
          sugar: p.sugar || 0,
          salt: p.salt || 0,
          totalCalories: p.totalCalories || 0, // celkové
          totalProteins: p.totalProteins || 0,
          totalCarbs: p.totalCarbs || 0,
          totalFat: p.totalFat || 0,
          totalFiber: p.totalFiber || 0,
          totalSugar: p.totalSugar || 0,
          totalSalt: p.totalSalt || 0,
        }));

        setMealBoxes(boxes);
      }
    } catch (err) {
      console.error("Error fetching meal boxes:", err);
    }
  };

  // načítanie emailu z AsyncStorage a fetchovanie produktov
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("userEmail")
      .then((email) => {
        if (mounted && email) {
          setUserEmail(email);
        }
      })
      .catch((err) => console.error("AsyncStorage error:", err));
    return () => (mounted = false);
  }, []);

  // Automatické načítanie produktov pri každom zobrazení tabu
  useFocusEffect(
    React.useCallback(() => {
      if (userEmail) {
        fetchMealBoxes(userEmail);
      }
    }, [userEmail]),
  );

  const openWindow = (box) => {
    setActiveBox(box);
  };

  const closeWindow = () => setActiveBox(null);

  const handleRemoveMealBox = async (id, productId, box) => {
    removeMealBox(id, productId, box);
    setTimeout(() => {
      if (userEmail) {
        fetchMealBoxes(userEmail);
      }
    }, 300);
  };

  return (
    <View style={styles.mealBox}>
      <Pressable onPress={() => userEmail && fetchMealBoxes(userEmail)}>
        <Text
          style={{
            color: "black",
            backgroundColor: "yellow",
            borderRadius: 20,
            width: "40%",
            textAlign: "center",
            alignSelf: "center",
            padding: 10,
            marginTop: 10,
          }}
        >
          Obnoviť
        </Text>
      </Pressable>

      <Modal
        visible={!!activeBox}
        animationType="slide"
        transparent={true}
        onRequestClose={closeWindow}
      >
        <MealBoxWindow
          productName={activeBox?.name}
          email={userEmail}
          close={closeWindow}
        />
      </Modal>

      <ScrollView style={styles.mealContainer}>
        <View style={styles.row}>
          {mealBoxes.map((box) => (
            <MealBoxItem
              key={box.id}
              box={box}
              removeMealBox={(id) =>
                handleRemoveMealBox(id, box.productId, box)
              }
              removeProduct={removeProduct}
              openWindow={openWindow}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles";

export default function RecipesTab() {
  const [recipe, setRecipe] = useState("");
  const [selectedRecept, setSelectedRecept] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  // 🔹 Load logged-in user email from AsyncStorage
  useEffect(() => {
    const loadEmail = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) {
        Alert.alert("Chyba", "Používateľ nie je prihlásený");
        return;
      }
      setUserEmail(email);
    };

    loadEmail();
  }, []);

  // 🔹 Generate recipe + save to DB
  const generateRecipe = async () => {
    if (!userEmail) {
      Alert.alert("Chyba", "Používateľ nie je prihlásený");
      return;
    }

    try {
      // 1️⃣ Generate recipe from AI
      const response = await fetch(
        "http://10.0.2.2:3000/api/generateRecipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!data.success || !data.recipe) {
        Alert.alert("Chyba", "Nepodarilo sa vygenerovať recept");
        return;
      }

      console.log("🍳 AI RECIPE:", data.recipe);
      setGeneratedRecipe(data.recipe);

      // 2️⃣ Save recipe to DB
      const saveResponse = await fetch(
        "http://10.0.2.2:3000/api/addRecipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            recipe: data.recipe,
          }),
        }
      );

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        console.error("❌ Failed to save recipe:", saveData);
        Alert.alert("Chyba", "Recept sa nepodarilo uložiť");
        return;
      }

      console.log("✅ Recipe saved:", saveData.recipes);
      Alert.alert("Hotovo", "Recept bol úspešne uložený 🎉");
    } catch (error) {
      console.error("❌ ERROR:", error);
      Alert.alert("Chyba", "Nastala chyba pri generovaní receptu");
    }
  };

  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup:
        "1. Pripravíme si suroviny...\n9. Podávame so slaninou a pažítkou.",
      obrazok: require("../../assets/bryndzove-halusky.jpg"),
    },
    {
      id: 2,
      nazov: "Kapustnica",
      obsah: "Ingrediencie: kapusta, klobása...\nPostup...",
      obrazok: require("../../assets/kapustnica.jpg"),
    },
    {
      id: 3,
      nazov: "Segedínsky guláš",
      ingrediencie:
        "bravčové mäso, kapusta, paprika, smotana",
      postup:
        "1. Orestujeme mäso...\n9. Podávame s knedľou.",
      obrazok: require("../../assets/segedin.jpg"),
    },
    {
      id: 4,
      nazov: "Placky",
      obsah: "Ingrediencie...\nPostup...",
      obrazok: require("../../assets/placky.jpg"),
    },
    {
      id: 5,
      nazov: "Palacinky",
      ingrediencie: "vajce, mlieko, múka",
      postup: "1. Vymiešame cesto...\n3. Podávame.",
      obrazok: require("../../assets/palacinky.jpg"),
    },
  ];

  return (
    <>
      <View style={styles.recipesContainer}>
        <TextInput
          placeholder="Vygeneruj si recept"
          style={styles.AiInput}
          onChangeText={setRecipe}
          value={recipe}
        />

        <Pressable onPress={generateRecipe} style={styles.recipeButton}>
          <Text>Generovať recept</Text>
        </Pressable>
      </View>

      <View>
        <View style={styles.grid}>
          {recepty.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.card,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setSelectedRecept(item)}
            >
              <ImageBackground
                source={item.obrazok}
                style={styles.imageBackground}
                imageStyle={styles.image}
              >
                <Text style={styles.cardText}>{item.nazov}</Text>
              </ImageBackground>
            </Pressable>
          ))}
        </View>

        <Modal
          visible={selectedRecept !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecept(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedRecept?.obrazok && (
                <Image
                  source={selectedRecept.obrazok}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                  resizeMode="cover"
                />
              )}

              <Text style={styles.modalTitle}>
                {selectedRecept?.nazov}
              </Text>

              <ScrollView style={styles.modalContent}>
                {selectedRecept?.ingrediencie && (
                  <Text style={{ marginBottom: 10 }}>
                    <Text style={{ fontWeight: "bold" }}>
                      Ingrediencie:{"\n"}
                    </Text>
                    {selectedRecept.ingrediencie}
                  </Text>
                )}

                {selectedRecept?.postup && (
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>
                      Postup:{"\n"}
                    </Text>
                    {selectedRecept.postup}
                  </Text>
                )}
              </ScrollView>

              <Button
                title="Zatvoriť"
                color="hsla(129, 56%, 43%, 1)"
                onPress={() => setSelectedRecept(null)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

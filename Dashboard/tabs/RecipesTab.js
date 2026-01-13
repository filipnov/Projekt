import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles";

export default function RecipesTab() {
  const [recipe, setRecipe] = useState("");
  const [selectedRecept, setSelectedRecept] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [generatedRecipeModal, setGeneratedRecipeModal] = useState(null);

  // Načítanie emailu prihláseného používateľa
  useEffect(() => {
    const loadEmail = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (email) setUserEmail(email);
    };
    loadEmail();
  }, []);

  // Funkcia na generovanie receptu z AI
  const generateRecipe = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch("http://10.0.2.2:3000/api/generateRecipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!data.success || !data.recipe) return;

      // Otvoríme Modal s generovaným receptom, ale **neukladáme ho hneď**
      setGeneratedRecipeModal(data.recipe);

    } catch (error) {
      console.error("❌ ERROR:", error);
    }
  };

  // Funkcia na uloženie receptu do DB
  const saveGeneratedRecipe = async () => {
    if (!userEmail || !generatedRecipeModal) return;

    try {
      const saveResponse = await fetch("http://10.0.2.2:3000/api/addRecipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, recipe: generatedRecipeModal }),
      });

      const saveData = await saveResponse.json();
      if (!saveData.success) {
        console.error("❌ Failed to save recipe:", saveData);
      } else {
        console.log("✅ Recipe saved:", saveData.recipes);
      }
    } catch (error) {
      console.error("❌ ERROR saving recipe:", error);
    } finally {
      // Modal sa zavrie vždy po akcii
      setGeneratedRecipeModal(null);
    }
  };

  // Hardcoded recepty
  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup: "1. Pripravíme si suroviny...\n9. Podávame so slaninou a pažítkou.",
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
      ingrediencie: "bravčové mäso, kapusta, paprika, smotana",
      postup: "1. Orestujeme mäso...\n9. Podávame s knedľou.",
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

      <View style={styles.grid}>
        {recepty.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
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

      {/* Modal pre statické recepty */}
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
                style={{ width: "100%", height: 200, borderRadius: 10, marginBottom: 10 }}
                resizeMode="cover"
              />
            )}

            <Text style={styles.modalTitle}>{selectedRecept?.nazov}</Text>

            <ScrollView style={styles.modalContent}>
              {selectedRecept?.ingrediencie && (
                <Text style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>Ingrediencie:{"\n"}</Text>
                  {selectedRecept.ingrediencie}
                </Text>
              )}

              {selectedRecept?.postup && (
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Postup:{"\n"}</Text>
                  {selectedRecept.postup}
                </Text>
              )}

              {selectedRecept?.obsah && (
                <Text>{selectedRecept.obsah}</Text>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setSelectedRecept(null)}
              style={{
                marginTop: 15,
                backgroundColor: "hsla(129, 56%, 43%, 1)",
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
                Zatvoriť
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal pre generovaný recept */}
      <Modal
        visible={generatedRecipeModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setGeneratedRecipeModal(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 20,
            width: "90%",
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <ScrollView>
              <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
                {generatedRecipeModal?.name}
              </Text>

              <Text style={{ fontWeight: "bold", marginTop: 10 }}>Čas prípravy:</Text>
              <Text>{generatedRecipeModal?.estimatedCookingTime}</Text>

              <Text style={{ fontWeight: "bold", marginTop: 10 }}>Ingrediencie:</Text>
              {generatedRecipeModal?.ingredients?.map((ing, idx) => (
                <Text key={idx}>• {ing.name}: {ing.amountGrams} g</Text>
              ))}

              <Text style={{ fontWeight: "bold", marginTop: 10 }}>Postup:</Text>
              {generatedRecipeModal?.steps?.map((step, idx) => (
                <Text key={idx}>{step}</Text>
              ))}
            </ScrollView>

            {/* Tlačidlá Zavrieť a Uložiť */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <Pressable
                onPress={() => setGeneratedRecipeModal(null)}
                style={{
                  flex: 1,
                  marginRight: 5,
                  backgroundColor: "grey",
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
                  Zavrieť
                </Text>
              </Pressable>

              <Pressable
                onPress={saveGeneratedRecipe}
                style={{
                  flex: 1,
                  marginLeft: 5,
                  backgroundColor: "hsla(129, 56%, 43%, 1)",
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
                  Uložiť
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

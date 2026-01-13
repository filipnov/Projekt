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
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Načítanie emailu prihláseného používateľa
  useEffect(() => {
    const loadEmail = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (email) setUserEmail(email);
    };
    loadEmail();
  }, []);

  useEffect(() => {
    if (userEmail) fetchSavedRecipes();
  }, [userEmail]);

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
      if (saveData.success) fetchSavedRecipes();
    } catch (error) {
      console.error("❌ ERROR saving recipe:", error);
    } finally {
      setGeneratedRecipeModal(null);
    }
  };

  const fetchSavedRecipes = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(
        `http://10.0.2.2:3000/api/getRecipes?email=${userEmail}`
      );
      const data = await res.json();
      if (data.success) setSavedRecipes(data.recipes);
    } catch (err) {
      console.error("❌ Failed to fetch recipes:", err);
    }
  };

  const deleteRecipe = async () => {
    if (!userEmail || !selectedRecept?.recipeId) return;

    try {
      const res = await fetch("http://10.0.2.2:3000/api/deleteRecipe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          recipeId: selectedRecept.recipeId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRecept(null);
        fetchSavedRecipes();
      }
    } catch (err) {
      console.error("❌ Failed to delete recipe:", err);
    }
  };

  const recipeImagesByCategory = {
    mäsité: require("./../../assets/meat.png"),
    bezmäsité: require("./../../assets/no-meat.png"),
    vegánske: require("./../../assets/lettuce.png"),
    sladké: require("./../../assets/cake.png"),
    štipľavé: require("./../../assets/chili.png"),
  };

  const getRecipeImage = (category) => {
    if (!category) return require("../../assets/logo.png");
    const key = category.toLowerCase();
    return recipeImagesByCategory[key] || require("../../assets/logo.png");
  };

  // Hardcoded recepty
  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup: "1. Pripravíme si suroviny...",
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
      postup: "1. Vymiešame cesto...",
      obrazok: require("../../assets/palacinky.jpg"),
    },
  ];

  // --- RENDER ---
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

      <Text>Overené recepty</Text>
      <View style={styles.grid}>
        {recepty.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setSelectedRecept({ ...item, type: "static" })}
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

      <Text>Uložené recepty</Text>
      <View style={styles.grid}>
        {savedRecipes.map((item) => (
          <Pressable
            key={item.recipeId}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setSelectedRecept({ ...item, type: "ai" })}
          >
            <ImageBackground
              source={getRecipeImage(item.category)}
              style={styles.imageBackground}
              imageStyle={styles.image}
            >
              <Text style={styles.cardText}>{item.name}</Text>
            </ImageBackground>
          </Pressable>
        ))}
      </View>

      {/* --- MODAL PRE VSETKY RECEPTY --- */}
      <Modal
        visible={selectedRecept !== null || generatedRecipeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedRecept(null);
          setGeneratedRecipeModal(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {/* IMAGE */}
              <Image
                source={
                  selectedRecept
                    ? selectedRecept.type === "static"
                      ? selectedRecept.obrazok
                      : getRecipeImage(selectedRecept.category)
                    : generatedRecipeModal
                    ? getRecipeImage(generatedRecipeModal.category)
                    : require("../../assets/logo.png")
                }
                style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 15 }}
                resizeMode="cover"
              />

              {/* TITLE */}
              <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
                {selectedRecept?.nazov || selectedRecept?.name || generatedRecipeModal?.name}
              </Text>

              {/* STATIC RECEPT */}
              {selectedRecept?.type === "static" && (
                <>
                  {selectedRecept?.ingrediencie && (
                    <Text>
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
                  {selectedRecept?.obsah && <Text>{selectedRecept.obsah}</Text>}
                </>
              )}

              {/* AI / GENERATED RECEPT */}
              {(selectedRecept?.type === "ai" || generatedRecipeModal) && (
                <>
                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>Kategória:</Text>
                  <Text>{selectedRecept?.category || generatedRecipeModal?.category}</Text>

                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>Čas prípravy:</Text>
                  <Text>{selectedRecept?.estimatedCookingTime || generatedRecipeModal?.estimatedCookingTime}</Text>

                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>Ingrediencie:</Text>
                  {(selectedRecept?.ingredients || generatedRecipeModal?.ingredients)?.map((ing, idx) => (
                    <Text key={idx}>
                      • {ing.name}: {ing.amountGrams} g
                    </Text>
                  ))}

                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>Postup:</Text>
                  {(selectedRecept?.steps || generatedRecipeModal?.steps)?.map((step, idx) => (
                    <Text key={idx}>{step}</Text>
                  ))}
                </>
              )}
            </ScrollView>

            {/* BUTTONS */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <Pressable
                onPress={() => {
                  setSelectedRecept(null);
                  setGeneratedRecipeModal(null);
                }}
                style={{
                  flex: 1,
                  marginRight: 5,
                  backgroundColor: "grey",
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Zavrieť</Text>
              </Pressable>

              {generatedRecipeModal && (
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
                  <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Uložiť</Text>
                </Pressable>
              )}

              {selectedRecept?.type === "ai" && (
                <Pressable
                  onPress={deleteRecipe}
                  style={{
                    flex: 1,
                    marginLeft: 5,
                    backgroundColor: "#ff4d4d",
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>🗑️ Zmazať recept</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
        </Modal>
        </>)}

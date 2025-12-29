// RecipesTab.js
import React, { useState } from "react";
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
import styles from "../styles";

export default function RecipesTab() {
  const [recipe, setRecipe] = useState("");
  const [selectedRecept, setSelectedRecept] = useState(null);

  function generateRecipe() {
    if (!recipe.trim()) {
      Alert.alert("Chyba", "Prosím, zadajte názov receptu!");
      return;
    }
    console.log("Generating recipe for:", recipe);
    setRecipe("");
  }

  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup:
        "1. Pripravíme si suroviny. \n2. Zemiaky očistíme a nastrúhame do misky. \n3. Zemiaky zasypeme 250g múky a pridáme lyžicu soli. Dobre premiešame. \n4. Postupne podľa potreby prisypeme aj zvyšnú časť múky - v závislosti od zemiakov. Cesto by malo byť vláčne, ale aj dostatočne pevné. Cesto má správnu hustotu vtedy, ak v ňom stojí varecha - nesmie sa váľať. \n5. Do veľkého hrnca dáme vodu, trochu soli a necháme zovrieť. \n 6. Keď voda zovrie, pomocou haluškára alebo cez lopárik hádžeme halušky do vriacej vody a necháme variť pár minút. Keď vyplávajú na povrch, sú hotové. \n 7. Hotové halušky dáme do misky a premiešame s bryndzou. (Ak halušky neplánujeme ihneď podávať, prepláchneme ich vodou a pokvapkáme troškou oleja, aby sa nezlepili). \n 8. Slaninu nakrájame na kocky a opečieme do chrumkava. \n 9. Hotové halušky podávame s opečenou slaninou a voňavou pažítkou. ",
      obrazok: require("../../assets/bryndzove-halusky.jpg"),
    },
    {
      id: 2,
      nazov: "Kapustnica",
      obsah:
        "Ingrediencie: kyslá kapusta, klobása, cibuľa...\nPostup: 1. Orestuj cibuľu, 2. Pridaj kapustu, 3. ...",
      obrazok: require("../../assets/kapustnica.jpg"),
    },
    {
      id: 3,
      nazov: "Segedínsky guláš",
      ingrediencie:
        "bravčové pliecko (800g - 1,5kg), 750 g kyslá kapusta, 2 PL bravčová masť, 1 ks cibuľa, 2 PL mletá červená paprika, 500 ml smotana na šľahanie, 1 ČL mletá rasca, 1/2 KL mleté čierne korenie",
      postup:
        "1. Bravčové mäso dobre umyjeme a nakrájame na kocky. Cibuľu očistíme a nakrájame na drobno.\n2. Do hlbokého hrnca dáme bravčovú masť a cibuľku orestujeme do sklovita. \n3. Pridáme mäso a restujeme, kým sa zatiahne. \n4. Pridáme mletú rascu, mleté čierne korenie a podľa chuti soľ. Podlejeme vodou a dusíme zhruba 45 minút. \n5. Medzitým si kapustu nakrájame. \n6. Pridáme ju k mäsu. \n7. Ďalej pridáme mletú červenú papriku, dobre premiešame a dusíme do mäkka. Podľa potreby podlejem vodou. \n8. Na záver pridáme smotanu. Ak chcete mať guláš hustejší, v smotane rozmiešame lyžicu hladkej múky. Necháme povariť na miernom ohni ešte 10 minút, podľa potreby dochutíme a môžeme podávať. \n9. Najlepšie chutí s domácou parenou knedľou.",
      obrazok: require("../../assets/segedin.jpg"),
    },
    {
      id: 4,
      nazov: "Placky",
      obsah:
        "Ingrediencie: bravčové mäso, kapusta, cibuľa, paprika...\nPostup: 1. Orestuj cibuľu, 2. Pridaj mäso, 3. ...",
      obrazok: require("../../assets/placky.jpg"),
    },
    {
      id: 5,
      nazov: "Palacinky",
      ingrediencie: "1ks vajce, 400ml mlieko, 200g hladká múka, soľ",
      postup:
        "1. Z uvedených surovín vypracujeme hladké cesto. \n2. Cesto lejeme naberačkou na rozpálenú panvicu a kvapkou oleja alebo masla a pečieme z oboch strán. \n3. Hotové palacinky plníme džemom a posypeme cukrom.",
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

              <Text style={styles.modalTitle}>{selectedRecept?.nazov}</Text>

              <ScrollView style={styles.modalContent}>
                {selectedRecept?.ingrediencie && (
                  <Text style={{ marginBottom: 10 }}>
                    <Text style={{ fontWeight: "bold" }}>
                      Ingrediencie:{"\n"}
                    </Text>
                    {selectedRecept.ingrediencie.replace(
                      /^Ingrediencie:\s*/,
                      ""
                    )}
                  </Text>
                )}

                {selectedRecept?.postup && (
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>Postup:{"\n"}</Text>
                    {selectedRecept.postup.replace(/^Postup:\s*/, "")}
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

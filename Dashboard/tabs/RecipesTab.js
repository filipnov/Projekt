import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ImageBackground,
  Image,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import Slider from '@react-native-community/slider'; 
import styles from "../../styles";

export default function RecipesTab() {

    const SERVER_URL = "https://app.bitewise.it.com"
  const [selectedRecept, setSelectedRecept] = useState(null);
const [generatedRecipeModal, setGeneratedRecipeModal] = useState(null);
const [generateModalVisible, setGenerateModalVisible] = useState(false);
const [savedRecipes, setSavedRecipes] = useState([]);
const [userEmail, setUserEmail] = useState(null);

const [selectedPreferences, setSelectedPreferences] = useState([]);
const [showAdditionalPreferences, setShowAdditionalPreferences] = useState(false);
const [showPreferenceInfo, setShowPreferenceInfo] = useState(false);

const [useFitnessGoal, setUseFitnessGoal] = useState(false);
const [usePantryItems, setUsePantryItems] = useState(false);
const [pantryItems, setPantryItems] = useState([]);
const [selectedPantryItems, setSelectedPantryItems] = useState([]);
const [isGenerating, setIsGenerating] = useState(false);
const [maxCookingTime, setMaxCookingTime] = useState(60);
const [showUnitInfo, setShowUnitInfo] = useState(false);


useEffect(() => { 
  const loadEmail = async () => { 
    const email = await AsyncStorage.getItem("userEmail");
     setUserEmail(email); }; loadEmail(); }, []);

 useEffect(() => { 
  fetchSavedRecipes();
 }, [userEmail]);

  useEffect(() => {
     if (!userEmail || !usePantryItems) return;
      const fetchPantryItems = async () => {
         try { 
          const res = await fetch(`${SERVER_URL}/api/getProducts?email=${userEmail}`); 
          const data = await res.json();
           if (data.success) { 
            setPantryItems(data.products); 
            setSelectedPantryItems([]); } 
          } catch (err) 
          { console.error("Failed to load pantry items:", err); 

          } }; fetchPantryItems(); 
        }, [userEmail, usePantryItems]);

  // Funkcia na generovanie receptu z AI
  const generateRecipe = async () => {

  setIsGenerating(true);
  const preferencesText =
  selectedPreferences.length > 0
    ? selectedPreferences
        .map(p => p.label.replace(/^[^\w\s]+ /, "")) // odstráni emoji na začiatku
        .join(", ")
    : "žiadne špecifické preferencie";

    const pantryText =
    selectedPantryItems.length > 0
      ? `Musíš použiť tieto produkty zo špajze: ${selectedPantryItems.join(", ")}.
      Cieľom je čo najmenej plýtvať jedlom, takže musíš použiť všetky produkty pokiaľ je to možné.
      Pokiaľ nieje možné použiť všetky, použi ich čo najviac!`
      : "";

    const userPrompt = `
Vygeneruj recept podľa týchto kritérií:
- Preferencie: ${preferencesText}
${useFitnessGoal ? "- Zohľadni fitness cieľ používateľa." : ""}
${maxCookingTime ? `- Čas varenia max ${maxCookingTime} minút.` : ""}
${pantryText}
Dodrž všetky pravidlá (JSON formát, ingrediencie, kroky).
`;
  try {
    const response = await fetch(`${SERVER_URL}/api/generateRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrompt,
        email: userEmail,
        useFitnessGoal,
        maxCookingTime,
        pantryItems: selectedPantryItems
      }),
    });
    const data = await response.json();
    if (!data.success || !data.recipe) return;
    setGeneratedRecipeModal(data.recipe);
  } catch (error) {
    console.error("❌ ERROR:", error);
  }finally {
    setIsGenerating(false);
  }
};
  // Funkcia na uloženie receptu do DB
  const saveGeneratedRecipe = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/addRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        recipe: generatedRecipeModal,
      }),
    });

    const data = await res.json();

    // ⬇️ ZMENA JE LEN TU
    if (data.success && Array.isArray(data.recipes)) {
      setSavedRecipes(data.recipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(data.recipes));

      setGeneratedRecipeModal(null);
      setSelectedRecept(null);
      console.log("✅ Recipe saved + Async updated");
    }
  } catch (err) {
    console.error("❌ Save recipe failed:", err);
  }
};

  // Funkcia na konzumáciu receptu (pripočítanie nutričných hodnôt)
  const consumeRecipe = async () => {
    const nutrition = generatedRecipeModal?.nutrition || selectedRecept?.nutrition;
    
    if (!nutrition || !userEmail) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/consumeRecipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          nutrition: nutrition,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        console.log("✅ Recipe consumed, nutrition added to daily goal");
        setGeneratedRecipeModal(null);
        setSelectedRecept(null);
      } else {
        console.error("❌ Failed to consume recipe:", data.error);
      }
    } catch (err) {
      console.error("❌ Consume recipe failed:", err);
    }
  };

// Načítanie receptov
const fetchSavedRecipes = async () => {
  if (!userEmail) return;

  try {
    // 1️⃣ AsyncStorage first
    const stored = await AsyncStorage.getItem("recipes");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedRecipes(parsed);
        console.log("✅ Recipes loaded from AsyncStorage");
        return;
      }
    }

    // 2️⃣ Server fallback
    console.log("⚠️ Async empty → fetching recipes from server");
    const res = await fetch(`${SERVER_URL}/api/getRecipes?email=${userEmail}`);
    const data = await res.json();

    if (data.success) {
      setSavedRecipes(data.recipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(data.recipes));
      console.log("✅ Recipes saved to AsyncStorage");
    }
  } catch (err) {
    console.error("❌ Failed to load recipes:", err);
  }
};

  const deleteRecipe = async () => {
  if (!selectedRecept?.recipeId) return;

  try {
    const res = await fetch(`${SERVER_URL}/api/deleteRecipe`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        recipeId: selectedRecept.recipeId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      const updatedRecipes = savedRecipes.filter(
        r => r.recipeId !== selectedRecept.recipeId
      );

      setSavedRecipes(updatedRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));

      setSelectedRecept(null);
      console.log("✅ Recipe deleted + Async updated");
    }
  } catch (err) {
    console.error("❌ Failed to delete recipe:", err);
  }
};


  const recipeImagesByCategory = {
    mäsité: require("./../../assets/meat.png"),
    bezmäsité: require("./../../assets/no_meat.png"),
    vegánske: require("./../../assets/lettuce.png"),
    sladké: require("./../../assets/cake.png"),
    štipľavé: require("./../../assets/chili.png"),
  };

  const getRecipeImage = (category) => {
    if (!category) return require("../../assets/logo.png");
    const key = category.toLowerCase();
    return recipeImagesByCategory[key] || require("../../assets/logo.png");
  };

  const resetState = () => {
  setSelectedPreferences([]);
  setUseFitnessGoal(false);
  setUsePantryItems(false);
  setSelectedPantryItems([]);
  setMaxCookingTime(60);
  setShowAdditionalPreferences(false);
};
  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup: "",
      obrazok: require("../../assets/bryndzove_halusky.jpg"),
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
      postup: "",
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
const ALL_PREFERENCES = [
  {
    id: "sweet",
    label: "🍰 Sladké",
    description: "Recepty s dôrazom na sladkú chuť, vhodné ako dezerty alebo sladké jedlá."
  },
  {
    id: "salty",
    label: "🧂 Slané",
    description: "Slané jedlá bez sladkého profilu, typicky hlavné jedlá alebo snacky."
  },
  {
    id: "spicy",
    label: "🌶️ Štipľavé",
    description: "Jedlá so štipľavými ingredienciami ako chilli, paprika alebo korenie."
  },
  {
    id: "vegan",
    label: "🥬 Vegánske",
    description: "Recepty bez živočíšnych produktov – žiadne mäso, mlieko, vajcia ani med."
  },
  {
    id: "meat",
    label: "🥩 Mäsité",
    description: "Jedlá obsahujúce mäso ako hlavný zdroj bielkovín."
  },
  {
    id: "fish",
    label: "🐟 Rybie",
    description: "Jedlá obsahujúce rybu ako hlavný zdroj bielkovín."
  },
  {
    id: "no_meat",
    label: "🥕 Bezmäsité",
    description: "Recepty bez mäsa, môžu však obsahovať mliečne výrobky alebo vajcia."
  },
  {
    id: "seafood",
    label: "🦐 Morské plody",
    description: "Jedlá z rýb alebo morských plodov ako krevety, losos či tuniak."
  },
  {
    id: "dessert",
    label: "🍮 Dezert",
    description: "Sladké jedlá určené ako dezert po hlavnom jedle."
  },
  {
    id: "healthy",
    label: "🥗 Zdravé",
    description: "Nutrične vyvážené jedlá s dôrazom na kvalitné suroviny."
  },
  {
    id: "soup",
    label: "🍲 Polievka",
    description: "Tekuté alebo krémové jedlá vhodné ako predjedlo alebo ľahké hlavné jedlo."
  },];

const ADDITIONAL_PREFERENCES = [
 {
  category: "Druh jedla",
  items: [
    {
      id: "breakfast", label: "🍳 Raňajky", description: "Jedlá vhodné na ráno – rýchle, výživné a ľahké na trávenie."
    },
    {
      id: "lunch",    label: "🥪 Obed",   description: "Plnohodnotné jedlá vhodné na obed."
    },
    {
      id: "dinner",    label: "🍽️ Večera", description: "Jedlá vhodné na večer, často ľahšie alebo sýte podľa preferencie."
    },
    { 
      id: "snack",    label: "🍿 Snack",   description: "Malé jedlá medzi hlavnými chodmi."
    },],},
 {
  category: "Pre koho",
  items: [
    {
      id: "kids", label: "👶 Pre deti", description: "Jedlá prispôsobené chutiam a potrebám detí."
    },
    {
      id: "seniors", label: "👵 Pre seniorov", description: "Ľahko stráviteľné a výživné jedlá."
    },
    {
      id: "pregnancy", label: "🤰 Pre tehotné", description: "Jedlá s dôrazom na bezpečné a výživné suroviny."
    },
    {
      id: "beginner", label: "🧑‍🍳 Pre začiatočníkov", description: "Jednoduché recepty bez zložitých postupov."
    },
    {
      id: "meal_prep", label: "🏋️ Meal prep (na viac dní)", description: "Jedlá vhodné na prípravu dopredu."
    },],},
  {
  category: "Zdravotné & citlivé",
  items: [
    {
      id: "low_salt", label: "🧂 Nízky obsah soli", description: "Jedlá s obmedzeným množstvom soli."
    },
    {
      id: "no_added_sugar", label: "🍬 Bez pridaného cukru", description: "Recepty bez pridaného cukru."
    },
    {
      id: "nut_free", label: "🥜 Bez orechov", description: "Jedlá bez orechov, vhodné pre alergikov."
    },
    {
      id: "no_alcohol", label: "🍷 Bez alkoholu", description: "Recepty neobsahujúce alkohol."
    },
    {
      id: "not_spicy", label: "🌶️ Bez štipľavosti", description: "Jemné jedlá bez pálivých ingrediencií."
    },],},
{
  category: "Alergici",
  items: [
    {
      id: "no-gluten", label: "🌾 Bez lepku", description: "Vylúči všetky potraviny obsahujúce lepok. Vhodné pre celiatikov."
    },
    {
      id: "no-lactose", label: "🥛 Bez laktózy", description: "Vylúči mlieko a mliečne výrobky obsahujúce laktózu."
    },
    {
      id: "no-milk-protein", label: "🍼 Bez mliečnej bielkoviny", description: "Vylúči všetky mliečne produkty vrátane bezlaktózových."
    },
    {
      id: "no-eggs", label: "🥚 Bez vajec", description: "Vylúči vajcia a potraviny, ktoré ich obsahujú."
    },
    {
      id: "no-peanuts", label: "🥜 Bez arašidov", description: "Vylúči arašidy a produkty, ktoré ich môžu obsahovať."
    },
    {
      id: "no-tree-nuts", label: "🌰 Bez orechov", description: "Vylúči všetky stromové orechy (vlašské, lieskové, mandle, kešu atď.)."
    },
    {
      id: "no-soy", label: "🫘 Bez sóje", description: "Vylúči sóju a výrobky zo sóje."
    },
    {
      id: "no-fish", label: "🐟 Bez rýb", description: "Vylúči ryby a produkty z nich."
    },
    {
      id: "no-shellfish", label: "🦐 Bez kôrovcov a mäkkýšov", description: "Vylúči krevety, kraby, mušle, ustrice a podobné morské plody."
    },
    {
      id: "no-sesame", label: "🌿 Bez sezamu", description: "Vylúči sezamové semienka a sezamové produkty."
    },
    {
      id: "no-mustard", label: "🌱 Bez horčice", description: "Vylúči horčicu a výrobky, ktoré ju obsahujú."
    },
    {
      id: "no-celery", label: "🥬 Bez zeleru", description: "Vylúči zeler a jedlá, kde sa používa ako prísada."
    },
    {
      id: "no-sulfites", label: "⚗️ Bez siričitanov", description: "Vylúči potraviny a nápoje obsahujúce siričitany."
    }],},
  {
  category: "Kuchyne sveta",
  items: [
    {
      id: "slovak",
      label: "🇸🇰 Slovenská kuchyňa",
      description: "Tradičné jedlá ako bryndzové halušky, kapustnica či pirohy."
    },
    {
      id: "czech",
      label: "🇨🇿 Česká kuchyňa",
      description: "Sýte jedlá ako sviečková, knedle, guláš a vyprážaný syr."
    },
    {
      id: "italian",
      label: "🇮🇹 Talianska kuchyňa",
      description: "Tradičné talianske jedlá ako pizza, cestoviny, rizoto a tiramisu."
    },
    {
      id: "french",
      label: "🇫🇷 Francúzska kuchyňa",
      description: "Elegantné recepty, omáčky, syry, dezerty a pečivo."
    },
    {
      id: "greek",
      label: "🇬🇷 Grécka kuchyňa",
      description: "Stredomorské jedlá s olivovým olejom, zeleninou, syrom feta a rybami."
    },
    {
      id: "mexican",
      label: "🇲🇽 Mexická kuchyňa",
      description: "Výrazné chute, chilli, tacos, burritos, fazuľa a kukurica."
    },
    {
      id: "american",
      label: "🇺🇸 Americká kuchyňa",
      description: "Burgery, BBQ, hranolky, pancakes a street food."
    },
    {
      id: "japanese",
      label: "🇯🇵 Japonská kuchyňa",
      description: "Jedlá ako sushi, ramen, tempura a bento."
    },
    {
      id: "chinese",
      label: "🇨🇳 Čínska kuchyňa",
      description: "Rezance, ryža, wok jedlá, sladkokyslé a pikantné chute."
    },
    {
      id: "indian",
      label: "🇮🇳 Indická kuchyňa",
      description: "Korenisté kari, ryža, šošovica a množstvo vegetariánskych jedál."
    },
    {
      id: "thai",
      label: "🇹🇭 Thajská kuchyňa",
      description: "Vyvážené chute, sladké, kyslé, slané a pikantné."
    }
  ]
}
  ];

const availablePreferences = ALL_PREFERENCES.filter(
    pref => !selectedPreferences.some(sel => sel.id === pref.id)
  );

  return (
    <>
      <View style={styles.recipesContainer}>
  <Pressable
    onPress={() => setGenerateModalVisible(true)}
    style={styles.recipeButton}
  >
    <Text style={styles.createRecipeText}>
      Vytvoriť recept
    </Text>
  </Pressable>
</View>

      <Modal
  visible={generateModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setGenerateModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    {/* Hlavný container dostane flex:1 a maxHeight pre správne scrollovanie */}
    <View style={[styles.modalContainer, styles.generateModalContainer]}>
  <ScrollView
    contentContainerStyle={styles.scrollPaddingBottom}
    showsVerticalScrollIndicator={true}
  >
    <Text style={styles.generateTitle}>
      Generovanie receptu
    </Text>

    {/* Vybrané preferencie */}
    <View style={styles.selectedPreferencesBox}>
      <View style={styles.preferencesHeader}>
        <Text style={styles.preferencesTitle}>
          Preferencie
        </Text>

        <Pressable
          onPress={() => setShowPreferenceInfo(true)}
          style={styles.infoCircleSmall}
        >
          <Text style={styles.infoCircleSmallText}>i</Text>
        </Pressable>
      </View>

      {selectedPreferences.length === 0 ? (
        <Text style={styles.emptyPreferencesText}>
          Vybrané preferencie sa zobrazia tu…
        </Text>
      ) : (
        <View style={styles.preferencesWrap}>
          {selectedPreferences.map(pref => (
            <View
              key={pref.id}
              style={styles.selectedPreferenceChip}
            >
              <Text style={styles.selectedPreferenceText}>
                {pref.label}
              </Text>

              <Pressable
                onPress={() =>
                  setSelectedPreferences(prev =>
                    prev.filter(p => p.id !== pref.id)
                  )
                }
              >
                <Text style={styles.removePreferenceText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>

        {/* Dostupné preferencie */}
<View style={styles.availablePreferencesContainer}>
  {availablePreferences.map(pref => (
    <Pressable
      key={pref.id}
      onPress={() => setSelectedPreferences(prev => [...prev, pref])}
      style={styles.availablePreferenceChip}
    >
      <Text>{pref.label}</Text>
    </Pressable>
  ))}
</View>

       {/* Ďalšie preferencie */}
<Pressable
  onPress={() => setShowAdditionalPreferences(prev => !prev)}
  style={styles.additionalPreferencesButton}
>
  <Text style={styles.additionalPreferencesButtonText}>
    {showAdditionalPreferences
      ? "Skryť ďalšie preferencie"
      : "Ďalšie preferencie"}
  </Text>
</Pressable>

        {showAdditionalPreferences &&
  ADDITIONAL_PREFERENCES.map(section => (
    <View
      key={section.category}
      style={styles.additionalPreferencesSection}
    >
      <Text style={styles.additionalPreferencesCategory}>
        {section.category}
      </Text>

      <View style={styles.additionalPreferencesWrap}>
        {section.items
          .filter(
            pref =>
              !selectedPreferences.some(sel => sel.id === pref.id)
          )
          .map(pref => (
            <Pressable
              key={pref.id}
              onPress={() =>
                setSelectedPreferences(prev => [...prev, pref])
              }
              style={styles.availablePreferenceChip}
            >
              <Text>{pref.label}</Text>
            </Pressable>
          ))}
      </View>
    </View>
  ))}

        {/* FITNESS GOAL a PANTRY ITEMS */}
        <View >
          {/* FITNESS GOAL */}
<View>
  <View style={styles.switchRow}>
    <Switch
      trackColor={{ false: "#ccc", true: "#4ade80" }}
      thumbColor="#fff"
      ios_backgroundColor="#ccc"
      value={useFitnessGoal}
      onValueChange={setUseFitnessGoal}
    />
    <Text style={styles.switchLabel}>
      Generovať recepty podľa fitness cieľa
    </Text>
  </View>
</View>

          <View>
  {/* Hlavný switch pre použitie špajze */}
<View style={styles.switchRow}>
  <Switch
    trackColor={{ false: "#ccc", true: "#4ade80" }}
    thumbColor="#fff"
    ios_backgroundColor="#ccc"
    value={usePantryItems}
    onValueChange={(value) => {
      setUsePantryItems(value);
      if (!value) setSelectedPantryItems([]);
    }}
  />
  <Text style={styles.switchLabel}>
    Použiť produkty zo špajze
  </Text>
</View>

  {/* Zoznam položiek zo špajze */}
{usePantryItems && pantryItems.length > 0 && (
  <View style={styles.pantryListContainer}>
    {pantryItems.map((item) => (
      <View key={item.productId} style={styles.pantryItemRow}>
        <Switch
          style={styles.pantrySwitch}
          trackColor={{ false: "#ccc", true: "#4ade80" }}
          thumbColor="#fff"
          ios_backgroundColor="#ccc"
          value={selectedPantryItems.includes(item.name)}
          onValueChange={(checked) => {
            if (checked) {
              setSelectedPantryItems(prev => [...prev, item.name]);
            } else {
              setSelectedPantryItems(prev =>
                prev.filter(name => name !== item.name)
              );
            }
          }}
        />
        <Text style={styles.pantryItemText}>{item.name}</Text>
      </View>
    ))}

    {/* SWITCH NA VYBRAT VSETKY */}
    <View style={{flexDirection: "row", alignItems: "center", marginTop: 10 }}>
      <Switch
        trackColor={{ false: "#ccc", true: "#4ade80" }}
        thumbColor="#fff"
        ios_backgroundColor="#ccc"
        value={selectedPantryItems.length === pantryItems.length}
        onValueChange={(checked) => {
          if (checked) {
            // vyber všetky produkty
            setSelectedPantryItems(pantryItems.map(p => p.name));
          } else {
            // zruš všetky výbery
            setSelectedPantryItems([]);
          }
        }}
      />
      <Text style={styles.selectAllText}>Vybrať všetky produkty</Text>
    </View>
  </View>
)}
</View>
        </View>

        {/* Čas receptu */}
<View style={styles.cookingTimeContainer}>
  <Text style={styles.cookingTimeLabel}>
    Maximálny čas varenia: {maxCookingTime} min
  </Text>

  <Slider
    minimumValue={15}
    maximumValue={180}
    step={5}
    value={maxCookingTime}
    onValueChange={setMaxCookingTime}
    minimumTrackTintColor="#4ade80"
    maximumTrackTintColor="#ccc"
    thumbTintColor="#4ade80"
  />
</View>

     {/* RESET BUTTON */}
<Pressable
  onPress={() => {
    resetState();
  }}
  style={styles.resetButton}
>
  <Text style={styles.resetButtonText}>
    Resetovať všetko
  </Text>
</Pressable>

{/* INFO TEXT  */}
<Text style={styles.infoText}>
  ⚠️ Pri alergiách odporúčame vždy kontrolovať presné zloženie potravín!
</Text>

<View style={styles.modalButtonRow}>
  <Pressable
    onPress={() => {
      setGenerateModalVisible(false);
      setSelectedRecept(null);
      setGeneratedRecipeModal(null);
      resetState();
    }}
    style={styles.cancelButton}
  >
    <Text style={styles.cancelButtonText}>Zrušiť</Text>
  </Pressable>

  <Pressable
    onPress={async () => {
      setGenerateModalVisible(false);
      await generateRecipe();
      resetState();
    }}
    style={styles.generateButton}
  >
    <Text style={styles.generateButtonText}>Generovať recept</Text>
  </Pressable>
</View>
      </ScrollView>
    </View>
  </View>
</Modal>

     <Text style={styles.sectionTitle}>
  Overené klasické recepty
</Text>

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
      <Text style={styles.sectionTitle}>
  Uložené recepty
</Text>

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
    <View style={[styles.modalContainer, { padding: 20 }]}>
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
  style={styles.recipeModalImage}
  resizeMode="center"
/>

{/* TITLE */}
<Text style={styles.recipeModalTitle}>
  {selectedRecept?.nazov || selectedRecept?.name || generatedRecipeModal?.name}
</Text>


        {/* STATIC RECEPT */}
{selectedRecept?.type === "static" && (
  <>
    {selectedRecept?.ingrediencie && (
      <Text style={styles.staticText}>
        <Text style={{ fontWeight: "bold" }}>Ingrediencie:{"\n"}</Text>
        {selectedRecept.ingrediencie}
      </Text>
    )}
    {selectedRecept?.postup && (
      <Text style={styles.staticText}>
        <Text style={{ fontWeight: "bold" }}>Postup:{"\n"}</Text>
        {selectedRecept.postup}
      </Text>
    )}
    {selectedRecept?.obsah && (
      <Text style={styles.staticText}>{selectedRecept.obsah}</Text>
    )}
  </>
)}
       {/* AI / GENERATED RECEPT */}
{(selectedRecept?.type === "ai" || generatedRecipeModal) && (
  <>
    {/* CATEGORY & TIME */}
    <Text style={styles.aiSectionTitle}>Kategória:</Text>
    <Text style={styles.aiSectionText}>
      {selectedRecept?.category || generatedRecipeModal?.category}
    </Text>

    <Text style={styles.aiSectionTitle}>Čas prípravy:</Text>
    <Text style={styles.aiSectionText}>
      {selectedRecept?.estimatedCookingTime || generatedRecipeModal?.estimatedCookingTime}
    </Text>

            {/* --- NUTRITION TABLE --- */}
<Text style={styles.nutritionTitle}>Nutričné hodnoty:</Text>

<View style={styles.nutritionContainer}>
  {(() => {
    const nutrition = selectedRecept?.nutrition || generatedRecipeModal?.nutrition || {};
    const values = [
      { label: "Kalórie", value: nutrition.calories, unit: "kcal" },
      { label: "Bielkoviny", value: nutrition.proteins, unit: "g" },
      { label: "Sacharidy", value: nutrition.carbohydrates, unit: "g" },
      { label: "Tuky", value: nutrition.fats, unit: "g" },
      { label: "Vláknina", value: nutrition.fiber, unit: "g" },
      { label: "Soľ", value: nutrition.salt, unit: "g" },
      { label: "Cukry", value: nutrition.sugars, unit: "g" },
    ];

    return values.map((item, idx) => (
      <View
        key={idx}
        style={[styles.nutritionRow, { backgroundColor: idx % 2 === 0 ? "#e6f4ea" : "#f0fdf4" }]}
      >
        <Text style={styles.nutritionLabel}>{item.label}:</Text>
        <Text style={styles.nutritionValue}>
          {item.value ?? "-"} {item.unit}
        </Text>
      </View>
    ));
  })()}
</View>
            {/* INGREDIENTS */}
<View style={styles.ingredientsHeader}>
  <Text style={styles.ingredientsTitle}>Ingrediencie</Text>
  {/* Info button */}
  <Pressable
    onPress={() => setShowUnitInfo(true)}
    style={styles.ingredientsInfoButton}
  >
    <Text style={styles.ingredientsInfoButtonText}>i</Text>
  </Pressable>
</View>

{/* Zoznam ingrediencií */}
{(selectedRecept?.ingredients || generatedRecipeModal?.ingredients)?.map((ing, idx) => (
  <Text key={idx} style={styles.ingredientText}>
    • {ing.name}: {ing.amountGrams} g
  </Text>
))}


{/* INFO MODAL PRE JEDNOTKY */}
<Modal
  visible={showUnitInfo}
  transparent
  animationType="fade"
  onRequestClose={() => setShowUnitInfo(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, styles.unitInfoModal]}>
      <Text style={styles.unitInfoTitle}>Jednotky surovín</Text>
      <Text style={styles.unitInfoText}>• 1 polievková lyžica = cca 15 g</Text>
      <Text style={styles.unitInfoText}>• 1 malá čajová lyžica = cca 5 g</Text>
      <Text style={styles.unitInfoText}>• 1 pohár = cca 250 ml / 240 g tekutiny</Text>

      <Pressable
        onPress={() => setShowUnitInfo(false)}
        style={styles.unitInfoCloseButton}
      >
        <Text style={styles.unitInfoCloseButtonText}>Zavrieť</Text>
      </Pressable>
    </View>
  </View>
</Modal>
            {/* STEPS */}
<Text style={styles.stepsTitle}>Postup:</Text>
{(selectedRecept?.steps || generatedRecipeModal?.steps)?.map((step, idx) => (
  <View key={idx} style={styles.stepContainer}>
    <Text style={styles.stepText}>{step}</Text>
  </View>
))}
          </>
        )}
      </ScrollView>

      {/* BUTTONS */}
<View style={styles.modalButtonsContainer}>
  <Pressable
    onPress={() => {
      setSelectedRecept(null);
      setGeneratedRecipeModal(null);
    }}
    style={styles.modalButtonClose}
  >
    <Text style={styles.modalButtonText}>Zavrieť</Text>
  </Pressable>

        {(generatedRecipeModal || selectedRecept?.type === "ai") && (
  <>
    <Pressable
      onPress={consumeRecipe}
      style={styles.modalButtonEat}
    >
      <Text style={styles.modalButtonText}>🍽️ Zjesť recept</Text>
    </Pressable>
  </>
)}

        {generatedRecipeModal && (
  <Pressable
    onPress={saveGeneratedRecipe}
    style={styles.modalButtonSave}
  >
    <Text style={styles.modalButtonText}>Uložiť</Text>
  </Pressable>
)}

{selectedRecept?.type === "ai" && (
  <Pressable
    onPress={deleteRecipe}
    style={styles.modalButtonDelete}
  >
    <Text style={styles.modalButtonText}>🗑️ Zmazať recept</Text>
  </Pressable>
)}

      </View>
    </View>
  </View>
</Modal>
<Modal
  visible={isGenerating}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlay}>
    <View style={styles.generatingModalContainer}>
      <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />

      <Text style={styles.generatingModalTitle}>
        Vytváram recept…
      </Text>

      <Text style={styles.generatingModalSubtitle}>
        Môže to trvať niekoľko sekúnd
      </Text>
    </View>
  </View>
</Modal>

<Modal
  visible={showPreferenceInfo}
  transparent
  animationType="fade"
  onRequestClose={() => setShowPreferenceInfo(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, styles.preferenceInfoModalContainer]}>
      <ScrollView>

        <Text style={styles.preferenceInfoTitle}>
          Vysvetlenie preferencií
        </Text>

        {/* ZÁKLADNÉ PREFERENCIE */}
        <Text style={styles.preferenceCategoryTitle}>
          Základné
        </Text>

        {ALL_PREFERENCES.map(pref => (
          <View key={pref.id} style={styles.preferenceItem}>
            <Text style={styles.preferenceItemLabel}>
              {pref.label}
            </Text>
            <Text style={styles.preferenceItemDescription}>
              {pref.description}
            </Text>
          </View>
        ))}
        {/* KATEGORIZOVANÉ PREFERENCIE */}
{ADDITIONAL_PREFERENCES.map(section => (
  <View key={section.category} style={styles.preferenceSection}>
    <Text style={styles.preferenceCategoryTitle}>
      {section.category}
    </Text>

    {section.items.map(item => (
      <View key={item.id} style={styles.preferenceItem}>
        <Text style={styles.preferenceItemLabel}>
          {item.label}
        </Text>
        <Text style={styles.preferenceItemDescription}>
          {item.description}
        </Text>
      </View>
    ))}
  </View>
))}

<Pressable
  onPress={() => setShowPreferenceInfo(false)}
  style={styles.preferenceCloseButton}
>
  <Text style={styles.preferenceCloseButtonText}>
    Zavrieť
  </Text>
</Pressable>
      </ScrollView>
    </View>
  </View>
</Modal>
        </>)}
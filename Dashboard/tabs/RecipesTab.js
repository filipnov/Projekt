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
  Switch
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles";
import { ActivityIndicator } from "react-native";
import Slider from '@react-native-community/slider';


export default function RecipesTab() {
  const [recipe, setRecipe] = useState("");
  const [selectedRecept, setSelectedRecept] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [generatedRecipeModal, setGeneratedRecipeModal] = useState(null);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [useFitnessGoal, setUseFitnessGoal] = useState(false);
  const [usePantryItems, setUsePantryItems] = useState(false);
  const [cookingTime, setCookingTime] = useState(null); 
  const [isGenerating, setIsGenerating] = useState(false);
const [showAdditionalPreferences, setShowAdditionalPreferences] = useState(false);
  const [showUnitInfo, setShowUnitInfo] = useState(false);
const [pantryItems, setPantryItems] = useState([]); // všetky produkty zo špajze
const [selectedPantryItems, setSelectedPantryItems] = useState([]); // vybrané produkty
const [requireAllSelected, setRequireAllSelected] = useState(true); // toggle "všetky vs niektoré"
const [maxCookingTime, setMaxCookingTime] = useState(60); // predvolená hodnota 60 min
const [showPreferenceInfo, setShowPreferenceInfo] = useState(false);

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

 useEffect(() => {
  if (!userEmail || !usePantryItems) return;

  const fetchPantryItems = async () => {
    try {
      const res = await fetch(`http://10.0.2.2:3000/api/getProducts?email=${userEmail}`);
      const data = await res.json();
      if (data.success) {
        setPantryItems(data.products);
        // Nepredvolené – necháme všetky vypnuté
        setSelectedPantryItems([]);
      }
    } catch (err) {
      console.error("Failed to load pantry items:", err);
    }
  };

  fetchPantryItems();
}, [userEmail, usePantryItems]);
  // Funkcia na generovanie receptu z AI
  const generateRecipe = async () => {
  if (!userEmail) return;

  setIsGenerating(true);
  const preferencesText =
  selectedPreferences.length > 0
    ? selectedPreferences
        .map(p => p.label.replace(/^[^\w\s]+ /, "")) // odstráni emoji na začiatku
        .join(", ")
    : "žiadne špecifické preferencie";

  const fitnessText = useFitnessGoal
    ? "Použiť fitness cieľ používateľa pri generovaní receptu."
    : "";

  const timeText = maxCookingTime
  ? `Celkový čas varenia nesmie byť viac ako ${maxCookingTime} minút.`
  : "";

  const userPrompt = `
Vygeneruj recept podľa týchto kritérií:
- Preferencie: ${preferencesText}
${fitnessText ? `- ${fitnessText}` : ""}
${timeText ? `- ${timeText}` : ""}
Dodrž všetky predchádzajúce pravidlá (jazyk, formát JSON, ingrediencie, kroky, realistický čas, originálny recept).
`;

  try {
    const response = await fetch("http://10.0.2.2:3000/api/generateRecipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrompt,
        email: userEmail,
        usePantryItems,
        useFitnessGoal,
        maxCookingTime
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
  if (!generatedRecipeModal || !userEmail) return;
  try {
    const res = await fetch(`http://10.0.2.2:3000/api/addRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        recipe: generatedRecipeModal,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Recept uložený!");
      setGeneratedRecipeModal(null);
      // refresh receptov
      fetchSavedRecipes();
    }
  } catch (err) {
    console.error(err);
  }
};

// Načítanie receptov
const fetchSavedRecipes = async () => {
  if (!userEmail) return;
  try {
    const res = await fetch(`http://10.0.2.2:3000/api/getRecipes?email=${userEmail}`);
    const data = await res.json();
    if (data.success) {
      setSavedRecipes(data.recipes); // každý recept má teraz aj nutrition
    }
  } catch (err) {
    console.error(err);
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

  const resetState = () => {
  setSelectedPreferences([]);
  setUseFitnessGoal(false);
  setUsePantryItems(false);
  setSelectedPantryItems([]);
  setRequireAllSelected(true);
  setMaxCookingTime(60);
  setShowAdditionalPreferences(false);
};


  // Hardcoded recepty
  const recepty = [
    {
      id: 1,
      nazov: "Bryndzové halušky",
      ingrediencie: "zemiaky, polohrubá múka, soľ, bryndza, slanina a pažitka",
      postup: "",
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
  },
];

const ADDITIONAL_PREFERENCES = [
 {
  category: "Druh jedla",
  items: [
    {
      id: "breakfast",
      label: "🍳 Raňajky",
      description: "Jedlá vhodné na ráno – rýchle, výživné a ľahké na trávenie."
    },
    {
      id: "lunch",
      label: "🥪 Obed",
      description: "Plnohodnotné jedlá vhodné na obed."
    },
    {
      id: "dinner",
      label: "🍽️ Večera",
      description: "Jedlá vhodné na večer, často ľahšie alebo sýte podľa preferencie."
    },
    {
      id: "snack",
      label: "🍿 Snack",
      description: "Malé jedlá medzi hlavnými chodmi."
    },
  ],
},
  {
  category: "Nutričné / diétne",
  items: [
    {
      id: "low_carb",
      label: "🥖 Nízkosacharidové",
      description: "Jedlá s obmedzeným množstvom sacharidov."
    },
    {
      id: "high_protein",
      label: "💪 Vysokoproteínové",
      description: "Recepty s vysokým obsahom bielkovín."
    },
    {
      id: "gluten_free",
      label: "🌾 Bezlepkové",
      description: "Jedlá bez lepku, vhodné pre celiatikov."
    },
    {
      id: "dairy_free",
      label: "🥛 Bez laktózy",
      description: "Recepty bez mliečnych výrobkov."
    },
  ],
},
 {
  category: "Pre koho",
  items: [
    {
      id: "kids",
      label: "👶 Pre deti",
      description: "Jedlá prispôsobené chutiam a potrebám detí."
    },
    {
      id: "seniors",
      label: "👵 Pre seniorov",
      description: "Ľahko stráviteľné a výživné jedlá."
    },
    {
      id: "pregnancy",
      label: "🤰 Pre tehotné",
      description: "Jedlá s dôrazom na bezpečné a výživné suroviny."
    },
    {
      id: "beginner",
      label: "🧑‍🍳 Pre začiatočníkov",
      description: "Jednoduché recepty bez zložitých postupov."
    },
    {
      id: "meal_prep",
      label: "🏋️ Meal prep (na viac dní)",
      description: "Jedlá vhodné na prípravu dopredu."
    },
  ],
},

  {
  category: "Zdravotné & citlivé",
  items: [
    {
      id: "low_salt",
      label: "🧂 Nízky obsah soli",
      description: "Jedlá s obmedzeným množstvom soli."
    },
    {
      id: "no_added_sugar",
      label: "🍬 Bez pridaného cukru",
      description: "Recepty bez pridaného cukru."
    },
    {
      id: "nut_free",
      label: "🥜 Bez orechov",
      description: "Jedlá bez orechov, vhodné pre alergikov."
    },
    {
      id: "no_alcohol",
      label: "🍷 Bez alkoholu",
      description: "Recepty neobsahujúce alkohol."
    },
    {
      id: "not_spicy",
      label: "🌶️ Bez štipľavosti",
      description: "Jemné jedlá bez pálivých ingrediencií."
    },
  ],
},

  {
  category: "Štýl",
  items: [
    {
      id: "plant_based",
      label: "🌱 Plant-based",
      description: "Jedlá založené prevažne na rastlinných surovinách."
    },
    {
      id: "traditional",
      label: "🍽️ Tradičný recept",
      description: "Klasické recepty podľa tradičných postupov."
    },
    {
      id: "modern_fitness",
      label: "🧠 Moderná / fitness kuchyňa",
      description: "Moderné recepty zamerané na zdravý životný štýl."
    },
    {
      id: "street_food",
      label: "🌍 Street food štýl",
      description: "Jedlá inšpirované pouličnou kuchyňou."
    },
    {
      id: "comfort_food",
      label: "🍲 Comfort food",
      description: "Sýte a upokojujúce jedlá."
    },
    {
      id: "slow_cooking",
      label: "🧘 Pomalé varenie / comfort food",
      description: "Jedlá pripravované pomaly pre plnú chuť."
    },
    {
      id: "one_pot",
      label: "🥘 One-pot recept",
      description: "Jedlá pripravované v jednom hrnci."
    },
    {
      id: "no_oven",
      label: "🍳 Bez rúry",
      description: "Recepty, ktoré nevyžadujú rúru."
    },
    {
      id: "few_steps",
      label: "🔢 Minimum krokov",
      description: "Rýchle recepty s minimom krokov."
    },
  ],
},

  {
  category: "Funkčné ciele",
  items: [
    {
      id: "pre_workout",
      label: "🏃 Pred tréningom",
      description: "Jedlá vhodné pred fyzickou aktivitou."
    },
    {
      id: "post_workout",
      label: "💪 Po tréningu",
      description: "Jedlá podporujúce regeneráciu po tréningu."
    },
    {
      id: "focus_support",
      label: "🧠 Podpora sústredenia",
      description: "Jedlá podporujúce mentálnu výkonnosť."
    },
  ],
},
{
  category: "Alergici",
  items: [
    {
      id: "no-gluten",
      label: "🌾 Bez lepku",
      description: "Vylúči všetky potraviny obsahujúce lepok (pšenica, jačmeň, raž). Vhodné pre celiatikov."
    },
    {
      id: "no-lactose",
      label: "🥛 Bez laktózy",
      description: "Vylúči mlieko a mliečne výrobky obsahujúce laktózu."
    },
    {
      id: "no-milk-protein",
      label: "🍼 Bez mliečnej bielkoviny",
      description: "Vylúči všetky mliečne produkty vrátane bezlaktózových."
    },
    {
      id: "no-eggs",
      label: "🥚 Bez vajec",
      description: "Vylúči vajcia a potraviny, ktoré ich obsahujú."
    },
    {
      id: "no-peanuts",
      label: "🥜 Bez arašidov",
      description: "Vylúči arašidy a produkty, ktoré ich môžu obsahovať."
    },
    {
      id: "no-tree-nuts",
      label: "🌰 Bez orechov",
      description: "Vylúči všetky stromové orechy (vlašské, lieskové, mandle, kešu atď.)."
    },
    {
      id: "no-soy",
      label: "🫘 Bez sóje",
      description: "Vylúči sóju a výrobky zo sóje."
    },
    {
      id: "no-fish",
      label: "🐟 Bez rýb",
      description: "Vylúči ryby a produkty z nich."
    },
    {
      id: "no-shellfish",
      label: "🦐 Bez kôrovcov a mäkkýšov",
      description: "Vylúči krevety, kraby, mušle, ustrice a podobné morské plody."
    },
    {
      id: "no-sesame",
      label: "🌿 Bez sezamu",
      description: "Vylúči sezamové semienka a sezamové produkty."
    },
    {
      id: "no-mustard",
      label: "🌱 Bez horčice",
      description: "Vylúči horčicu a výrobky, ktoré ju obsahujú."
    },
    {
      id: "no-celery",
      label: "🥬 Bez zeleru",
      description: "Vylúči zeler a jedlá, kde sa používa ako prísada."
    },
    {
      id: "no-sulfites",
      label: "⚗️ Bez siričitanov",
      description: "Vylúči potraviny a nápoje obsahujúce siričitany."
    }
  ]
}
,
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
  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
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
    <View style={[styles.modalContainer, { flex: 1, maxHeight: "90%", padding: 16 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
        <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
          Generovanie receptu
        </Text>

        {/* Vybrané preferencie */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 10,
            padding: 10,
            backgroundColor: "#f5f5f5",
            marginBottom: 15,
            minHeight: 50,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <Text style={{ fontSize: 16, fontWeight: "bold", marginRight: 6 }}>
    Preferencie
  </Text>

  <Pressable
    onPress={() => setShowPreferenceInfo(true)}
    style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#4ade80",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>i</Text>
  </Pressable>
</View>
          {selectedPreferences.length === 0 ? (
            <Text style={{ color: "#999" }}>Vybrané preferencie sa zobrazia tu…</Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {selectedPreferences.map(pref => (
                <View
                  key={pref.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#e0e0e0",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    margin: 4,
                  }}
                >
                  <Text style={{ marginRight: 6 }}>{pref.label}</Text>
                  <Pressable
                    onPress={() =>
                      setSelectedPreferences(prev =>
                        prev.filter(p => p.id !== pref.id)
                      )
                    }
                  >
                    <Text style={{ fontWeight: "bold" }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Dostupné preferencie */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
          {availablePreferences.map(pref => (
            <Pressable
              key={pref.id}
              onPress={() => setSelectedPreferences(prev => [...prev, pref])}
              style={{
                backgroundColor: "#d1fae5",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                margin: 4,
              }}
            >
              <Text>{pref.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Ďalšie preferencie */}
        <Pressable
          onPress={() => setShowAdditionalPreferences(prev => !prev)}
          style={{
            backgroundColor: "#a5f3fc",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            marginBottom: 10,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ fontWeight: "bold" }}>
            {showAdditionalPreferences ? "Skryť ďalšie preferencie" : "Ďalšie preferencie"}
          </Text>
        </Pressable>

        {showAdditionalPreferences && ADDITIONAL_PREFERENCES.map(section => (
  <View key={section.category} style={{ marginBottom: 12 }}>
    <Text style={{ fontWeight: "bold", marginBottom: 6 }}>{section.category}</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {section.items
        .filter(pref => !selectedPreferences.some(sel => sel.id === pref.id))
        .map(pref => (
          <Pressable
            key={pref.id}
            onPress={() => setSelectedPreferences(prev => [...prev, pref])}
            style={{
              backgroundColor: "#d1fae5",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              margin: 4,
            }}
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
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
    <Switch
      trackColor={{ false: "#ccc", true: "#4ade80" }}
      thumbColor="#fff"
      ios_backgroundColor="#ccc"
      value={useFitnessGoal}
      onValueChange={setUseFitnessGoal}
    />
    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: "500", color: "#333" }}>
      Generovať recepty podľa fitness cieľa
    </Text>
  </View>
</View>

          <View>
  {/* Hlavný switch pre použitie špajze */}
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
    <Switch
      trackColor={{ false: "#ccc", true: "#4ade80" }}
      thumbColor="#fff"
      ios_backgroundColor="#ccc"
      value={usePantryItems}
      onValueChange={(value) => {
  setUsePantryItems(value);
  if (!value) setSelectedPantryItems([]); // reset
}}
    />
    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: "500", color: "#333" }}>
      Použiť produkty zo špajze
    </Text>
  </View>

  {/* Zoznam položiek zo špajze */}
  {usePantryItems && pantryItems.length > 0 && (
    <View style={{ paddingLeft: 5 }}>
      {pantryItems.map((item) => (
        <View
          key={item.productId}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
            backgroundColor: "#f5f5f5",
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 8,
          }}
        >
          <Switch
            style={{ transform: [{ scale: 0.8 }] }}
            trackColor={{ false: "#ccc", true: "#4ade80" }}
            thumbColor="#fff"
            ios_backgroundColor="#ccc"
            value={selectedPantryItems.includes(item.name)}
            onValueChange={(checked) => {
              if (checked) {
                setSelectedPantryItems(prev => [...prev, item.name]);
              } else {
                setSelectedPantryItems(prev => prev.filter(name => name !== item.name));
              }
            }}
          />
          <Text style={{ marginLeft: 8, fontSize: 14, color: "#333" }}>{item.name}</Text>
        </View>
      ))}

      {/* Toggle: Všetky vs len niektoré */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: "#333", marginRight: 8 }}>Použiť všetky položky</Text>
        <Switch
          trackColor={{ false: "#ccc", true: "#4ade80" }}
          thumbColor="#fff"
          ios_backgroundColor="#ccc"
          value={requireAllSelected}
          onValueChange={setRequireAllSelected}
        />
      </View>
    </View>
  )}
</View>
        </View>

        {/* Čas receptu */}
<View style={{ marginBottom: 20 }}>
  <Text style={{ marginBottom: 10, fontWeight: "bold", fontSize: 16 }}>
    Maximálny čas varenia: {maxCookingTime} min
  </Text>
  
  <Slider
    minimumValue={5}
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
  style={{
    backgroundColor: "#f87171", // červené tlačidlo
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 15,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
    Resetovať všetko
  </Text>
</Pressable>

{/* INFO TEXT  */}
<Text style={{ textAlign: "center", marginBottom: 20, fontSize: 20 }}>
  ⚠️ Pri alergiách odporúčame vždy kontrolovať presné zloženie potravín!
</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => {setGenerateModalVisible(false),
              setSelectedRecept(null),
    setGeneratedRecipeModal(null),
    resetState()}}
            style={{
              flex: 1,
              marginRight: 5,
              backgroundColor: "grey",
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Zrušiť</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
    setGenerateModalVisible(false);
    await generateRecipe();
    resetState(); 
  }}
            style={{
              flex: 1,
              marginLeft: 5,
              backgroundColor: "hsla(129, 56%, 43%, 1)",
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Generovať recept</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>


     <Text style={{ fontSize: 22, fontWeight: "bold", marginVertical: 10, marginLeft: 15 }}>
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

      <Text style={{ fontSize: 22, fontWeight: "bold", marginVertical: 10, marginLeft: 15 }}>
  Moje recepty
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
          style={{ width: "100%", height: 220, borderRadius: 16, marginBottom: 15 }}
          resizeMode="cover"
        />

        {/* TITLE */}
        <Text style={{ fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 15 }}>
          {selectedRecept?.nazov || selectedRecept?.name || generatedRecipeModal?.name}
        </Text>

        {/* STATIC RECEPT */}
        {selectedRecept?.type === "static" && (
          <>
            {selectedRecept?.ingrediencie && (
              <Text style={{ fontSize: 18, marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>Ingrediencie:{"\n"}</Text>
                {selectedRecept.ingrediencie}
              </Text>
            )}
            {selectedRecept?.postup && (
              <Text style={{ fontSize: 18, marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>Postup:{"\n"}</Text>
                {selectedRecept.postup}
              </Text>
            )}
            {selectedRecept?.obsah && <Text style={{ fontSize: 18 }}>{selectedRecept.obsah}</Text>}
          </>
        )}

        {/* AI / GENERATED RECEPT */}
        {(selectedRecept?.type === "ai" || generatedRecipeModal) && (
          <>
            {/* CATEGORY & TIME */}
            <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>Kategória:</Text>
            <Text style={{ fontSize: 18, marginBottom: 8 }}>
              {selectedRecept?.category || generatedRecipeModal?.category}
            </Text>

            <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 5 }}>Čas prípravy:</Text>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              {selectedRecept?.estimatedCookingTime || generatedRecipeModal?.estimatedCookingTime}
            </Text>

            {/* --- NUTRITION TABLE --- */}
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>Nutričné hodnoty:</Text>
            <View style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 12,
              padding: 12,
              backgroundColor: "#f0fdf4",
              marginBottom: 15,
            }}>
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
                  <View key={idx} style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 4,
                    backgroundColor: idx % 2 === 0 ? "#e6f4ea" : "#f0fdf4",
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    marginVertical: 2,
                  }}>
                    <Text style={{ fontSize: 18 }}>{item.label}:</Text>
                    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                      {item.value ?? "-"} {item.unit}
                    </Text>
                  </View>
                ));
              })()}
            </View>

            {/* INGREDIENTS */}
<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <Text style={{ fontSize: 20, fontWeight: "bold" }}>Ingrediencie</Text>
  {/* Info button */}
  <Pressable
    onPress={() => setShowUnitInfo(true)}
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#4ade80",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "bold" }}>i</Text>
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
    <View style={[styles.modalContainer, { maxHeight: 300 }]}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Jednotky surovín
      </Text>
      <Text>• 1 polievková lyžica = cca 15 g</Text>
      <Text>• 1 malá čajová lyžica = cca 5 g</Text>
      <Text>• 1 pohár = cca 250 ml / 240 g tekutiny</Text>

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
            <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10, marginBottom: 6 }}>Postup:</Text>
            {(selectedRecept?.steps || generatedRecipeModal?.steps)?.map((step, idx) => (
              <View key={idx} style={{
                backgroundColor: "#d1fae5",
                padding: 8,
                borderRadius: 10,
                marginBottom: 6,
              }}>
                <Text style={{ fontSize: 18 }}>{step}</Text>
              </View>
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
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>Zavrieť</Text>
        </Pressable>

        {generatedRecipeModal && (
          <Pressable
            onPress={saveGeneratedRecipe}
            style={{
              flex: 1,
              marginLeft: 5,
              backgroundColor: "hsla(129, 56%, 43%, 1)",
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>Uložiť</Text>
          </Pressable>
        )}

        {selectedRecept?.type === "ai" && (
          <Pressable
            onPress={deleteRecipe}
            style={{
              flex: 1,
              marginLeft: 5,
              backgroundColor: "#ff4d4d",
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>🗑️ Zmazať recept</Text>
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
    <View
      style={{
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 20,
        alignItems: "center",
        width: "80%",
      }}
    >
      <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />

      <Text
        style={{
          marginTop: 15,
          fontSize: 18,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        Vytváram recept…
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "#666",
          textAlign: "center",
        }}
      >
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
    <View style={[styles.modalContainer, { maxHeight: "85%" }]}>
      <ScrollView>

        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
          Vysvetlenie preferencií
        </Text>

        {/* ZÁKLADNÉ PREFERENCIE */}
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 6 }}>
          Základné
        </Text>

        {ALL_PREFERENCES.map(pref => (
          <View
            key={pref.id}
            style={{
              backgroundColor: "#f0fdf4",
              padding: 10,
              borderRadius: 10,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {pref.label}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", marginTop: 2 }}>
              {pref.description}
            </Text>
          </View>
        ))}

        {/* KATEGORIZOVANÉ PREFERENCIE */}
        {ADDITIONAL_PREFERENCES.map(section => (
          <View key={section.category} style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 6 }}>
              {section.category}
            </Text>

            {section.items.map(item => (
              <View
                key={item.id}
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 14, color: "#555", marginTop: 2 }}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Pressable
          onPress={() => setShowPreferenceInfo(false)}
          style={{
            marginTop: 16,
            backgroundColor: "#4ade80",
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
            Zavrieť
          </Text>
        </Pressable>

      </ScrollView>
    </View>
  </View>
</Modal>
        </>)}

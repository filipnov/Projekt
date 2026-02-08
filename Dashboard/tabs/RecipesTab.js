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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import styles from "../../styles";

const SERVER_URL = "https://app.bitewise.it.com";

//Získanie dnešného dátumu
const getTodayKey = (date = new Date()) => {
  // Predvolene pouzi aktualny datum, ak volajuci ziaden neposkytne.
  const yyyy = date.getFullYear(); // Vytiahni rok (YYYY) z datumu.
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Mesiac je 0-index, preto +1 a doplnenie na 2 cislice.
  const dd = String(date.getDate()).padStart(2, "0"); // Den v mesiaci, doplneny na 2 cislice.
  return `${yyyy}-${mm}-${dd}`; // Vrat formatovany kluc YYYY-MM-DD.
};

//Overené recepty vryté do kódu
const STATIC_RECIPES = [
  {
    id: 1,
    name: "Bryndzové halušky",
    category: "mäsité",
    estimatedCookingTime: "45 min",
    ingredients: [
      { name: "Zemiaky", amountGrams: 500 },
      { name: "Polohrubá múka", amountGrams: 200 },
      { name: "Soľ", amountGrams: 5 },
      { name: "Bryndza", amountGrams: 150 },
      { name: "Slanina", amountGrams: 80 },
      { name: "Pažitka", amountGrams: 5 },
    ],
    steps: [
      "1. Zemiaky ošúp, najemno nastrúhaj a jemne osoľ.",
      "2. Pridaj múku a vymiešaj husté cesto.",
      "3. Cesto pretláčaj cez haluškovač do vriacej osolenej vody a var 3–4 minúty.",
      "4. Scedené halušky premiešaj s bryndzou.",
      "5. Slaninu opeč do chrumkava a spolu s pažitkou nasyp na halušky.",
    ],
    nutrition: {
      calories: 650,
      proteins: 22,
      carbohydrates: 70,
      fats: 30,
      fiber: 5,
      salt: 2.5,
      sugars: 6,
    },
    obrazok: require("../../assets/bryndzove_halusky.jpg"),
  },
  {
    id: 2,
    name: "Kapustnica",
    category: "mäsité",
    estimatedCookingTime: "90 min",
    ingredients: [
      { name: "Kyslá kapusta", amountGrams: 400 },
      { name: "Klobása", amountGrams: 150 },
      { name: "Údené mäso", amountGrams: 200 },
      { name: "Cibuľa", amountGrams: 80 },
      { name: "Cesnak", amountGrams: 10 },
      { name: "Sušené huby", amountGrams: 15 },
      { name: "Smotana na varenie", amountGrams: 150 },
      { name: "Paprika mletá", amountGrams: 4 },
      { name: "Bobkový list", amountGrams: 1 },
      { name: "Soľ", amountGrams: 6 },
    ],
    steps: [
      "1. Údené mäso a huby zalej vodou a var 30 minút.",
      "2. Na cibuli opeč klobásu, pridaj cesnak a mletú papriku.",
      "3. Pridaj kyslú kapustu, bobkový list a vývar z mäsa.",
      "4. Var spolu 30–40 minút, podľa potreby dolej vodu.",
      "5. Na záver zjemni smotanou a dochuť soľou.",
    ],
    nutrition: {
      calories: 320,
      proteins: 15,
      carbohydrates: 20,
      fats: 18,
      fiber: 6,
      salt: 2.2,
      sugars: 7,
    },
    obrazok: require("../../assets/kapustnica.jpg"),
  },
  {
    id: 3,
    name: "Segedínsky guláš",
    category: "mäsité",
    estimatedCookingTime: "70 min",
    ingredients: [
      { name: "Bravčové mäso", amountGrams: 400 },
      { name: "Kyslá kapusta", amountGrams: 300 },
      { name: "Cibuľa", amountGrams: 120 },
      { name: "Mletá paprika", amountGrams: 5 },
      { name: "Rasca", amountGrams: 2 },
      { name: "Smotana na varenie", amountGrams: 150 },
      { name: "Soľ", amountGrams: 6 },
    ],
    steps: [
      "1. Na oleji opeč cibuľu do sklovita.",
      "2. Pridaj mäso, osoľ a opeč zo všetkých strán.",
      "3. Vmiešaj papriku, rascu a krátko opeč.",
      "4. Pridaj kapustu a podlej vodou, duste 40–45 minút.",
      "5. Na záver zjemni smotanou a krátko prevar.",
    ],
    nutrition: {
      calories: 420,
      proteins: 28,
      carbohydrates: 18,
      fats: 26,
      fiber: 5,
      salt: 2.3,
      sugars: 7,
    },
    obrazok: require("../../assets/segedin.jpg"),
  },
  {
    id: 4,
    name: "Zemiakové placky",
    category: "bezmäsité",
    estimatedCookingTime: "35 min",
    ingredients: [
      { name: "Zemiaky", amountGrams: 500 },
      { name: "Vajce", amountGrams: 50 },
      { name: "Múka", amountGrams: 60 },
      { name: "Cesnak", amountGrams: 8 },
      { name: "Soľ", amountGrams: 5 },
      { name: "Majorán", amountGrams: 2 },
      { name: "Olej na vyprážanie", amountGrams: 30 },
    ],
    steps: [
      "1. Zemiaky nastrúhaj a vyžmýkaj prebytočnú vodu.",
      "2. Pridaj vajce, múku, cesnak, soľ a majorán.",
      "3. Vymiešaj cesto a tvaruj tenké placky.",
      "4. Vyprážaj na rozpálenom oleji do zlatista z oboch strán.",
    ],
    nutrition: {
      calories: 380,
      proteins: 7,
      carbohydrates: 45,
      fats: 18,
      fiber: 5,
      salt: 1.5,
      sugars: 3,
    },
    obrazok: require("../../assets/placky.jpg"),
  },
  {
    id: 5,
    name: "Palacinky",
    category: "sladké",
    estimatedCookingTime: "25 min",
    ingredients: [
      { name: "Mlieko", amountGrams: 300 },
      { name: "Vajce", amountGrams: 100 },
      { name: "Hladká múka", amountGrams: 150 },
      { name: "Cukor", amountGrams: 15 },
      { name: "Soľ", amountGrams: 2 },
      { name: "Olej", amountGrams: 10 },
    ],
    steps: [
      "1. V miske rozšľahaj vajcia s mliekom.",
      "2. Prisyp múku, cukor a soľ, vymiešaj hladké cesto.",
      "3. Nechaj 10 minút odpočinúť.",
      "4. Palacinky peč na tenkej vrstve oleja z oboch strán.",
    ],
    nutrition: {
      calories: 320,
      proteins: 10,
      carbohydrates: 45,
      fats: 10,
      fiber: 2,
      salt: 0.8,
      sugars: 8,
    },
    obrazok: require("../../assets/palacinky.jpg"),
  },
];

//Základné preferencie ktoré si používateľ môže vybrať pri tvorení receptu.
const ALL_PREFERENCES = [
  {
    id: "sweet",
    label: "🍰 Sladké",
    description:
      "Recepty s dôrazom na sladkú chuť, vhodné ako dezerty alebo sladké jedlá.",
  },
  {
    id: "salty",
    label: "🧂 Slané",
    description:
      "Slané jedlá bez sladkého profilu, typicky hlavné jedlá alebo snacky.",
  },
  {
    id: "spicy",
    label: "🌶️ Štipľavé",
    description:
      "Jedlá so štipľavými ingredienciami ako chilli, paprika alebo korenie.",
  },
  {
    id: "vegan",
    label: "🥬 Vegánske",
    description:
      "Recepty bez živočíšnych produktov – žiadne mäso, mlieko, vajcia ani med.",
  },
  {
    id: "meat",
    label: "🥩 Mäsité",
    description: "Jedlá obsahujúce mäso ako hlavný zdroj bielkovín.",
  },
  {
    id: "fish",
    label: "🐟 Rybie",
    description: "Jedlá obsahujúce rybu ako hlavný zdroj bielkovín.",
  },
  {
    id: "no_meat",
    label: "🥕 Bezmäsité",
    description:
      "Recepty bez mäsa, môžu však obsahovať mliečne výrobky alebo vajcia.",
  },
  {
    id: "seafood",
    label: "🦐 Morské plody",
    description:
      "Jedlá z rýb alebo morských plodov ako krevety, losos či tuniak.",
  },
  {
    id: "dessert",
    label: "🍮 Dezert",
    description: "Sladké jedlá určené ako dezert po hlavnom jedle.",
  },
  {
    id: "healthy",
    label: "🥗 Zdravé",
    description: "Nutrične vyvážené jedlá s dôrazom na kvalitné suroviny.",
  },
  {
    id: "soup",
    label: "🍲 Polievka",
    description:
      "Tekuté alebo krémové jedlá vhodné ako predjedlo alebo ľahké hlavné jedlo.",
  },
];

//Ďalšie preferencie z ktorých si môže používateľ vybrať
const ADDITIONAL_PREFERENCES = [
  {
    category: "Druh jedla",
    items: [
      {
        id: "breakfast",
        label: "🍳 Raňajky",
        description:
          "Jedlá vhodné na ráno – rýchle, výživné a ľahké na trávenie.",
      },
      {
        id: "lunch",
        label: "🥪 Obed",
        description: "Plnohodnotné jedlá vhodné na obed.",
      },
      {
        id: "dinner",
        label: "🍽️ Večera",
        description:
          "Jedlá vhodné na večer, často ľahšie alebo sýte podľa preferencie.",
      },
      {
        id: "snack",
        label: "🍿 Snack",
        description: "Malé jedlá medzi hlavnými chodmi.",
      },
    ],
  },
  {
    category: "Pre koho",
    items: [
      {
        id: "kids",
        label: "👶 Pre deti",
        description: "Jedlá prispôsobené chutiam a potrebám detí.",
      },
      {
        id: "seniors",
        label: "👵 Pre seniorov",
        description: "Ľahko stráviteľné a výživné jedlá.",
      },
      {
        id: "pregnancy",
        label: "🤰 Pre tehotné",
        description: "Jedlá s dôrazom na bezpečné a výživné suroviny.",
      },
      {
        id: "beginner",
        label: "🧑‍🍳 Pre začiatočníkov",
        description: "Jednoduché recepty bez zložitých postupov.",
      },
      {
        id: "meal_prep",
        label: "🏋️ Meal prep (na viac dní)",
        description: "Jedlá vhodné na prípravu dopredu.",
      },
    ],
  },
  {
    category: "Zdravotné & citlivé",
    items: [
      {
        id: "low_salt",
        label: "🧂 Nízky obsah soli",
        description: "Jedlá s obmedzeným množstvom soli.",
      },
      {
        id: "no_added_sugar",
        label: "🍬 Bez pridaného cukru",
        description: "Recepty bez pridaného cukru.",
      },
      {
        id: "nut_free",
        label: "🥜 Bez orechov",
        description: "Jedlá bez orechov, vhodné pre alergikov.",
      },
      {
        id: "no_alcohol",
        label: "🍷 Bez alkoholu",
        description: "Recepty neobsahujúce alkohol.",
      },
      {
        id: "not_spicy",
        label: "🌶️ Bez štipľavosti",
        description: "Jemné jedlá bez pálivých ingrediencií.",
      },
    ],
  },
  {
    category: "Alergici",
    items: [
      {
        id: "no-gluten",
        label: "🌾 Bez lepku",
        description:
          "Vylúči všetky potraviny obsahujúce lepok. Vhodné pre celiatikov.",
      },
      {
        id: "no-lactose",
        label: "🥛 Bez laktózy",
        description: "Vylúči mlieko a mliečne výrobky obsahujúce laktózu.",
      },
      {
        id: "no-milk-protein",
        label: "🍼 Bez mliečnej bielkoviny",
        description: "Vylúči všetky mliečne produkty vrátane bezlaktózových.",
      },
      {
        id: "no-eggs",
        label: "🥚 Bez vajec",
        description: "Vylúči vajcia a potraviny, ktoré ich obsahujú.",
      },
      {
        id: "no-peanuts",
        label: "🥜 Bez arašidov",
        description: "Vylúči arašidy a produkty, ktoré ich môžu obsahovať.",
      },
      {
        id: "no-tree-nuts",
        label: "🌰 Bez orechov",
        description:
          "Vylúči všetky stromové orechy (vlašské, lieskové, mandle, kešu atď.).",
      },
      {
        id: "no-soy",
        label: "🫘 Bez sóje",
        description: "Vylúči sóju a výrobky zo sóje.",
      },
      {
        id: "no-fish",
        label: "🐟 Bez rýb",
        description: "Vylúči ryby a produkty z nich.",
      },
      {
        id: "no-shellfish",
        label: "🦐 Bez kôrovcov a mäkkýšov",
        description:
          "Vylúči krevety, kraby, mušle, ustrice a podobné morské plody.",
      },
      {
        id: "no-sesame",
        label: "🌿 Bez sezamu",
        description: "Vylúči sezamové semienka a sezamové produkty.",
      },
      {
        id: "no-mustard",
        label: "🌱 Bez horčice",
        description: "Vylúči horčicu a výrobky, ktoré ju obsahujú.",
      },
      {
        id: "no-celery",
        label: "🥬 Bez zeleru",
        description: "Vylúči zeler a jedlá, kde sa používa ako prísada.",
      },
      {
        id: "no-sulfites",
        label: "⚗️ Bez siričitanov",
        description: "Vylúči potraviny a nápoje obsahujúce siričitany.",
      },
    ],
  },
  {
    category: "Kuchyne sveta",
    items: [
      {
        id: "slovak",
        label: "🇸🇰 Slovenská kuchyňa",
        description:
          "Tradičné jedlá ako bryndzové halušky, kapustnica či pirohy.",
      },
      {
        id: "czech",
        label: "🇨🇿 Česká kuchyňa",
        description: "Sýte jedlá ako sviečková, knedle, guláš a vyprážaný syr.",
      },
      {
        id: "italian",
        label: "🇮🇹 Talianska kuchyňa",
        description:
          "Tradičné talianske jedlá ako pizza, cestoviny, rizoto a tiramisu.",
      },
      {
        id: "french",
        label: "🇫🇷 Francúzska kuchyňa",
        description: "Elegantné recepty, omáčky, syry, dezerty a pečivo.",
      },
      {
        id: "greek",
        label: "🇬🇷 Grécka kuchyňa",
        description:
          "Stredomorské jedlá s olivovým olejom, zeleninou, syrom feta a rybami.",
      },
      {
        id: "mexican",
        label: "🇲🇽 Mexická kuchyňa",
        description:
          "Výrazné chute, chilli, tacos, burritos, fazuľa a kukurica.",
      },
      {
        id: "american",
        label: "🇺🇸 Americká kuchyňa",
        description: "Burgery, BBQ, hranolky, pancakes a street food.",
      },
      {
        id: "japanese",
        label: "🇯🇵 Japonská kuchyňa",
        description: "Jedlá ako sushi, ramen, tempura a bento.",
      },
      {
        id: "chinese",
        label: "🇨🇳 Čínska kuchyňa",
        description: "Rezance, ryža, wok jedlá, sladkokyslé a pikantné chute.",
      },
      {
        id: "indian",
        label: "🇮🇳 Indická kuchyňa",
        description:
          "Korenisté kari, ryža, šošovica a množstvo vegetariánskych jedál.",
      },
      {
        id: "thai",
        label: "🇹🇭 Thajská kuchyňa",
        description: "Vyvážené chute, sladké, kyslé, slané a pikantné.",
      },
    ],
  },
];

export default function RecipesTab() {
  const [selectedRecept, setSelectedRecept] = useState(null);
  const [generatedRecipeModal, setGeneratedRecipeModal] = useState(null);
  const [showGenerateError, setShowGenerateError] = useState(false);
  const [generateErrorMessage, setGenerateErrorMessage] = useState("");
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

  //Obsahuje preferencie ktoré AI dostane ako dostupné na vytvorenie receptu.
  const availablePreferences = ALL_PREFERENCES.filter( //porovnáme každu položku
    ({ id }) => !selectedPreferences.some((selected) => selected.id === id),//necháme len preferencie ktoré nie su vybrané
  );

  const activeRecipe = selectedRecept || generatedRecipeModal;
  const canConsumeRecipe = Boolean(activeRecipe?.nutrition);

  const getRecipeImage = (category) => {
    if (!category) return require("../../assets/logo.png");
    const key = category.toLowerCase();
    switch (key) {
      case "mäsité":
        return require("./../../assets/meat.png");
      case "bezmäsité":
        return require("./../../assets/no_meat.png");
      case "vegánske":
        return require("./../../assets/lettuce.png");
      case "sladké":
        return require("./../../assets/cake.png");
      case "štipľavé":
        return require("./../../assets/chili.png");
      default:
        return require("../../assets/logo.png");
    }
  };

  const resetState = () => {
    setSelectedPreferences([]);
    setUseFitnessGoal(false);
    setUsePantryItems(false);
    setSelectedPantryItems([]);
    setMaxCookingTime(60);
    setShowAdditionalPreferences(false);
  };

  const isGeneratedRecipeValid = (recipe) => {
    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
      return false;
    }

    const hasText = (value) =>
      typeof value === "string" && value.trim().length > 0;

    const hasIngredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.some(
          (item) =>
            item &&
            hasText(item.name) &&
            Number.isFinite(Number(item.amountGrams)) &&
            Number(item.amountGrams) > 0,
        )
      : false;

    const hasSteps = Array.isArray(recipe.steps)
      ? recipe.steps.some((step) => hasText(step))
      : false;

    return (
      hasText(recipe.name) &&
      hasText(recipe.category) &&
      hasText(recipe.estimatedCookingTime) &&
      hasIngredients &&
      hasSteps
    );
  };

  const closeRecipeModal = () => {
    setSelectedRecept(null);
    setGeneratedRecipeModal(null);
  };

  const showGenerateErrorModal = () => {
    const base =
      "Recept sa nepodarilo vygenerovať. Skús to prosím ešte raz.";
    const reasons =
      "Možné dôvody:\n" +
      "• Použil si potravinu, ktorá sa bežne pri varení nepoužíva.\n" +
      "• Zadal si nejedlú alebo nesúvisiacu položku.\n" +
      "• Náš AI šéfkuchár je preťažený a potrebuje pauzu.";
    setGenerateErrorMessage(`${base}\n\n${reasons}`);
    setShowGenerateError(true);
  };

  const fetchSavedRecipes = async (email) => {
    const stored = await AsyncStorage.getItem("recipes");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedRecipes(parsed);
        return;
      }
    }

    const res = await fetch(`${SERVER_URL}/api/getRecipes?email=${email}`);
    const data = await res.json();
    if (data.success) {
      setSavedRecipes(data.recipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(data.recipes));
    }
  };

  const generateRecipe = async () => {
    setIsGenerating(true);

    const preferencesText = selectedPreferences.length
      ? selectedPreferences
          .map((p) => p.label.replace(/^[^\w\s]+ /, ""))
          .join(", ")
      : "žiadne špecifické preferencie";

    const pantryText = selectedPantryItems.length
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
          pantryItems: selectedPantryItems,
        }),
      });
      const data = await response.json();
      if (!data.success || !data.recipe || !isGeneratedRecipeValid(data.recipe)) {
        showGenerateErrorModal(data?.error);
        return;
      }
      setGeneratedRecipeModal(data.recipe);
    } catch {
      showGenerateErrorModal();
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedRecipe = async () => {
    if (!generatedRecipeModal || !userEmail) return;

    const res = await fetch(`${SERVER_URL}/api/addRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, recipe: generatedRecipeModal }),
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.recipes)) {
      setSavedRecipes(data.recipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(data.recipes));
      closeRecipeModal();
    }
  };

  const consumeRecipe = async () => {
    const nutrition = activeRecipe?.nutrition;
    if (!nutrition || !userEmail) return;

    const res = await fetch(`${SERVER_URL}/api/consumeRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        date: getTodayKey(),
        nutrition,
      }),
    });

    const data = await res.json();
    if (data.ok) closeRecipeModal();
  };

  const deleteRecipe = async () => {
    if (!selectedRecept?.recipeId || !userEmail) return;

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
        (r) => r.recipeId !== selectedRecept.recipeId,
      );
      setSavedRecipes(updatedRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));
      setSelectedRecept(null);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("userEmail").then(setUserEmail);
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetchSavedRecipes(userEmail);
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail || !usePantryItems) return;
    fetch(`${SERVER_URL}/api/getProducts?email=${userEmail}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPantryItems(data.products || []);
          setSelectedPantryItems([]);
        }
      });
  }, [userEmail, usePantryItems]);

  return (
    <>
      <View style={styles.recipesContainer}>
        <Pressable
          onPress={() => setGenerateModalVisible(true)}
          style={styles.recipeButton}
        >
          <Text style={styles.createRecipeText}>Vytvoriť recept</Text>
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
              <Text style={styles.generateTitle}>Generovanie receptu</Text>

              {/* Vybrané preferencie */}
              <View style={styles.selectedPreferencesBox}>
                <View style={styles.preferencesHeader}>
                  <Text style={styles.preferencesTitle}>Preferencie</Text>

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
                    {selectedPreferences.map((pref) => (
                      <View key={pref.id} style={styles.selectedPreferenceChip}>
                        <Text style={styles.selectedPreferenceText}>
                          {pref.label}
                        </Text>

                        <Pressable
                          onPress={() =>
                            setSelectedPreferences((prev) =>
                              prev.filter((p) => p.id !== pref.id),
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
                {availablePreferences.map((pref) => (
                  <Pressable
                    key={pref.id}
                    onPress={() =>
                      setSelectedPreferences((prev) => [...prev, pref])
                    }
                    style={styles.availablePreferenceChip}
                  >
                    <Text>{pref.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Ďalšie preferencie */}
              <Pressable
                onPress={() => setShowAdditionalPreferences((prev) => !prev)}
                style={styles.additionalPreferencesButton}
              >
                <Text style={styles.additionalPreferencesButtonText}>
                  {showAdditionalPreferences
                    ? "Skryť ďalšie preferencie"
                    : "Ďalšie preferencie"}
                </Text>
              </Pressable>

              {showAdditionalPreferences &&
                ADDITIONAL_PREFERENCES.map((section) => (
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
                          (pref) =>
                            !selectedPreferences.some(
                              (sel) => sel.id === pref.id,
                            ),
                        )
                        .map((pref) => (
                          <Pressable
                            key={pref.id}
                            onPress={() =>
                              setSelectedPreferences((prev) => [...prev, pref])
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
              <View>
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
                                setSelectedPantryItems((prev) => [
                                  ...prev,
                                  item.name,
                                ]);
                              } else {
                                setSelectedPantryItems((prev) =>
                                  prev.filter((name) => name !== item.name),
                                );
                              }
                            }}
                          />
                          <Text style={styles.pantryItemText}>{item.name}</Text>
                        </View>
                      ))}

                      {/* SWITCH NA VYBRAT VSETKY */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <Switch
                          trackColor={{ false: "#ccc", true: "#4ade80" }}
                          thumbColor="#fff"
                          ios_backgroundColor="#ccc"
                          value={
                            selectedPantryItems.length === pantryItems.length
                          }
                          onValueChange={(checked) => {
                            if (checked) {
                              // vyber všetky produkty
                              setSelectedPantryItems(
                                pantryItems.map((p) => p.name),
                              );
                            } else {
                              // zruš všetky výbery
                              setSelectedPantryItems([]);
                            }
                          }}
                        />
                        <Text style={styles.selectAllText}>
                          Vybrať všetky produkty
                        </Text>
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
                <Text style={styles.resetButtonText}>Resetovať všetko</Text>
              </Pressable>

              {/* INFO TEXT  */}
              <Text style={styles.infoText}>
                ⚠️ Pri alergiách odporúčame vždy kontrolovať presné zloženie
                potravín!
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
                  <Text style={styles.generateButtonText}>Generovať</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGenerateError}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenerateError(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.generateErrorContainer]}>
            <Text style={styles.generateErrorTitle}>
              Oops, niečo sa pokazilo
            </Text>
            <Text style={styles.generateErrorText}>{generateErrorMessage}</Text>

            <Pressable
              onPress={() => setShowGenerateError(false)}
              style={styles.generateErrorButton}
            >
              <Text style={styles.generateErrorButtonText}>Zavrieť</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Overené klasické recepty</Text>

      <View style={styles.grid}>
        {STATIC_RECIPES.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setSelectedRecept({ ...item, type: "static" })}
          >
            <ImageBackground
              source={item.obrazok}
              style={styles.imageBackground}
              imageStyle={styles.image}
            >
              <Text style={styles.cardText}>{item.name || item.nazov}</Text>
            </ImageBackground>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Uložené recepty</Text>

      {savedRecipes.length === 0 && (
        <Text style={styles.pantryEmptyMessage}>
          Nemáš uložené žiadne recepty.
        </Text>
      )}

      <View style={styles.grid}>
        {savedRecipes.map((item) => (
          <Pressable
            key={item.recipeId}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setSelectedRecept({ ...item, type: "ai" })}
          >
            <ImageBackground
              source={getRecipeImage(item.category)}
              style={styles.imageBackground}
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
          closeRecipeModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recipeModalCard}>
            <ScrollView contentContainerStyle={styles.recipeModalContent}>
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
                resizeMode="cover"
              />

              {/* TITLE */}
              <View style={styles.recipeModalHeader}>
                <Text style={styles.recipeModalTitle}>
                  {selectedRecept?.nazov ||
                    selectedRecept?.name ||
                    generatedRecipeModal?.name}
                </Text>
                <Text style={styles.recipeModalSubtitle}>Recept</Text>
              </View>

              {/* RECEPT (statický aj generovaný) */}
              {activeRecipe && (
                <>
                  {/* CATEGORY & TIME */}
                  <View style={styles.recipeMetaRow}>
                    <View style={styles.recipeMetaChip}>
                      <Text style={styles.recipeMetaLabel}>Kategória</Text>
                      <Text style={styles.recipeMetaValue}>
                        {activeRecipe?.category}
                      </Text>
                    </View>
                    <View style={styles.recipeMetaChip}>
                      <Text style={styles.recipeMetaLabel}>Čas prípravy</Text>
                      <Text style={styles.recipeMetaValue}>
                        {activeRecipe?.estimatedCookingTime}
                      </Text>
                    </View>
                  </View>

                  {/* --- NUTRITION TABLE --- */}
                  <View style={styles.recipeSectionCard}>
                    <Text style={styles.recipeSectionTitle}>
                      Nutričné hodnoty
                    </Text>
                    <View style={styles.nutritionContainer}>
                      {(() => {
                        const nutrition = activeRecipe?.nutrition || {};
                        const values = [
                          {
                            label: "Kalórie",
                            value: nutrition.calories,
                            unit: "kcal",
                          },
                          {
                            label: "Bielkoviny",
                            value: nutrition.proteins,
                            unit: "g",
                          },
                          {
                            label: "Sacharidy",
                            value: nutrition.carbohydrates,
                            unit: "g",
                          },
                          { label: "Tuky", value: nutrition.fats, unit: "g" },
                          {
                            label: "Vláknina",
                            value: nutrition.fiber,
                            unit: "g",
                          },
                          { label: "Soľ", value: nutrition.salt, unit: "g" },
                          {
                            label: "Cukry",
                            value: nutrition.sugars,
                            unit: "g",
                          },
                        ];

                        return values.map((item, idx) => (
                          <View key={idx} style={styles.nutritionRow}>
                            <Text style={styles.nutritionLabel}>
                              {item.label}:
                            </Text>
                            <Text style={styles.nutritionValue}>
                              {item.value ?? "-"} {item.unit}
                            </Text>
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                  {/* INGREDIENTS */}
                  <View style={styles.recipeSectionCard}>
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
                    {(activeRecipe?.ingredients || [])?.map((ing, idx) => (
                      <Text key={idx} style={styles.recipeIngredientItem}>
                        • {ing.name}: {ing.amountGrams} g
                      </Text>
                    ))}
                  </View>

                  {/* INFO MODAL PRE JEDNOTKY */}
                  <Modal
                    visible={showUnitInfo}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowUnitInfo(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View
                        style={[styles.modalContainer, styles.unitInfoModal]}
                      >
                        <Text style={styles.unitInfoTitle}>
                          Jednotky surovín
                        </Text>
                        <Text style={styles.unitInfoText}>
                          • 1 polievková lyžica = cca 15 g
                        </Text>
                        <Text style={styles.unitInfoText}>
                          • 1 malá čajová lyžica = cca 5 g
                        </Text>
                        <Text style={styles.unitInfoText}>
                          • 1 pohár = cca 250 ml / 240 g tekutiny
                        </Text>

                        <Pressable
                          onPress={() => setShowUnitInfo(false)}
                          style={styles.unitInfoCloseButton}
                        >
                          <Text style={styles.unitInfoCloseButtonText}>
                            Zavrieť
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Modal>
                  {/* STEPS */}
                  <View style={styles.recipeSectionCard}>
                    <Text style={styles.stepsTitle}>Postup</Text>
                    {(activeRecipe?.steps || [])?.map((step, idx) => (
                      <View key={idx} style={styles.stepContainer}>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* BUTTONS */}
            {canConsumeRecipe && (
              <View style={styles.modalButtonsContainer}>
                <Pressable
                  onPress={consumeRecipe}
                  style={styles.modalButtonEat}
                >
                  <Text style={styles.modalButtonText}>Zjesť recept</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.modalButtonsContainer}>
              <Pressable
                onPress={() => {
                  closeRecipeModal();
                }}
                style={styles.modalModalButtonClose}
              >
                <Text style={styles.modalButtonText}>Zavrieť</Text>
              </Pressable>

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
                  <Text style={styles.modalButtonText}>Vymazať</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={isGenerating} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.generatingModalContainer}>
            <ActivityIndicator size="large" color="hsla(129, 56%, 43%, 1)" />

            <Text style={styles.generatingModalTitle}>Vytváram recept…</Text>

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
          <View
            style={[styles.modalContainer, styles.preferenceInfoModalContainer]}
          >
            <ScrollView>
              <Text style={styles.preferenceInfoTitle}>
                Vysvetlenie preferencií
              </Text>

              {/* ZÁKLADNÉ PREFERENCIE */}
              <Text style={styles.preferenceCategoryTitle}>Základné</Text>

              {ALL_PREFERENCES.map((pref) => (
                <View key={pref.id} style={styles.preferenceItem}>
                  <Text style={styles.preferenceItemLabel}>{pref.label}</Text>
                  <Text style={styles.preferenceItemDescription}>
                    {pref.description}
                  </Text>
                </View>
              ))}
              {/* KATEGORIZOVANÉ PREFERENCIE */}
              {ADDITIONAL_PREFERENCES.map((section) => (
                <View key={section.category} style={styles.preferenceSection}>
                  <Text style={styles.preferenceCategoryTitle}>
                    {section.category}
                  </Text>

                  {section.items.map((item) => (
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
                <Text style={styles.preferenceCloseButtonText}>Zavrieť</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

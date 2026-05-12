const NUTRITION_FIELDS = [
  ["calories", "totalCalories", 0],
  ["proteins", "totalProteins", 1],
  ["carbs", "totalCarbs", 1],
  ["fat", "totalFat", 1],
  ["fiber", "totalFiber", 1],
  ["salt", "totalSalt", 1],
  ["sugar", "totalSugar", 1],
];

export const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundTo = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const getProductQuantity = (product) => {
  const remaining = toFiniteNumber(product?.remainingQuantity, 0);
  if (remaining > 0) return remaining;

  const quantity = toFiniteNumber(product?.quantity, 0);
  if (quantity > 0) return quantity;

  const caloriesPer100 = toFiniteNumber(product?.calories, 0);
  const totalCalories = toFiniteNumber(product?.totalCalories, 0);
  if (caloriesPer100 > 0 && totalCalories > 0) {
    return (totalCalories / caloriesPer100) * 100;
  }

  const nutrients = [
    ["proteins", "totalProteins"],
    ["carbs", "totalCarbs"],
    ["fat", "totalFat"],
    ["fiber", "totalFiber"],
    ["salt", "totalSalt"],
    ["sugar", "totalSugar"],
  ];

  for (const [per100Key, totalKey] of nutrients) {
    const per100Value = toFiniteNumber(product?.[per100Key], 0);
    const totalValue = toFiniteNumber(product?.[totalKey], 0);
    if (per100Value > 0 && totalValue > 0) {
      return (totalValue / per100Value) * 100;
    }
  }

  return 0;
};

export const getOriginalProductQuantity = (product) => {
  const original = toFiniteNumber(product?.originalQuantity, 0);
  if (original > 0) return original;

  return getProductQuantity(product);
};

export const calculateNutritionForGrams = (product, grams) => {
  const amount = Math.max(0, toFiniteNumber(grams, 0));

  return NUTRITION_FIELDS.reduce((totals, [per100Key, totalKey, decimals]) => {
    const per100Value = toFiniteNumber(product?.[per100Key], 0);
    totals[totalKey] = roundTo((per100Value / 100) * amount, decimals);
    return totals;
  }, {});
};

export const withProductQuantity = (product, remainingQuantity, originalQuantity) => {
  const remaining = Math.max(0, toFiniteNumber(remainingQuantity, 0));
  const original =
    originalQuantity !== undefined
      ? Math.max(remaining, toFiniteNumber(originalQuantity, remaining))
      : Math.max(remaining, getOriginalProductQuantity(product));

  if (remaining <= 0) {
    return {
      ...product,
      quantity: 0,
      originalQuantity: original,
      remainingQuantity: 0,
    };
  }

  return {
    ...product,
    quantity: remaining,
    originalQuantity: original,
    remainingQuantity: remaining,
    ...calculateNutritionForGrams(product, remaining),
  };
};

export const normalizeProductQuantity = (product) => {
  if (!product) return product;
  return withProductQuantity(
    product,
    getProductQuantity(product),
    getOriginalProductQuantity(product),
  );
};

export const buildConsumedProductTotals = (product, grams) => {
  const totals = calculateNutritionForGrams(product, grams);

  return {
    calories: totals.totalCalories || 0,
    proteins: totals.totalProteins || 0,
    carbs: totals.totalCarbs || 0,
    fat: totals.totalFat || 0,
    fiber: totals.totalFiber || 0,
    sugar: totals.totalSugar || 0,
    salt: totals.totalSalt || 0,
  };
};

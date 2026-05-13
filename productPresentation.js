export function normalizePresentationText(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveProductCategory(product) {
  const directCategory =
    product?.category ||
    product?.productCategory ||
    product?.foodCategory ||
    product?.categoryName ||
    product?.categories ||
    "";

  const normalizedDirect = normalizePresentationText(Array.isArray(directCategory) ? directCategory.join(" ") : directCategory);
  if (normalizedDirect) return normalizedDirect;

  const normalizedName = normalizePresentationText(
    product?.name || product?.product_name || product?.brands || "",
  );

  if (/\b(ro[zž]ok|chlieb|b[eu]lka|bageta|pecivo|pečivo|toast|rohlik|rohlik)\b/.test(normalizedName)) {
    return "pastry";
  }
  if (/\b(kurac|kuracie|bravc|hovadz|maso|mäso|salama|slanina|steak|mäs)\b/.test(normalizedName)) {
    return "meat";
  }
  if (/\b(jablko|banan|pomaranc|hrozno|ovoc|fruit|fruity)\b/.test(normalizedName)) {
    return "fruits";
  }
  if (/\b(mrkva|zemiak|zelenina|salat|paprika|uhorka|brokolica|cibula|cesnak)\b/.test(normalizedName)) {
    return "vegetables";
  }

  return "";
}

export function getCategoryEmoji(categoryOrProduct) {
  const category =
    typeof categoryOrProduct === "object"
      ? resolveProductCategory(categoryOrProduct)
      : normalizePresentationText(categoryOrProduct);

  if (!category) return "🍽️";

  if (category.includes("pastry") || category.includes("peciv") || category.includes("pecivo")) return "🥐";
  if (category.includes("meat") || category.includes("maso")) return "🥩";
  if (category.includes("vegetable") || category.includes("zelenina")) return "🥦";
  if (category.includes("fruit") || category.includes("ovoc")) return "🍎";
  return "🍽️";
}

export function buildProductListKey(product, index = 0, fallbackSource = "database") {
  const source = product?.source || fallbackSource || "database";
  const sourceId =
    product?.productId || product?.id || product?._id || product?.code || product?.searchKey || normalizePresentationText(product?.name);

  return `${source}-${String(sourceId || "product")}-${index}`;
}

export function getExpirationLabel(value) {
  if (!value) return "Nezadané";
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return "Nezadané";
  return dateValue.toLocaleDateString("sk-SK");
}

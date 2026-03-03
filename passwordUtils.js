import * as Crypto from "expo-crypto";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

export async function hashPassword(rawPassword) {
  if (typeof rawPassword !== "string") {
    return "";
  }

  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawPassword,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

export async function ensurePasswordHash(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (SHA256_HEX_REGEX.test(value)) {
    return value.toLowerCase();
  }

  return hashPassword(value);
}

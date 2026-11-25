const crypto = require("crypto");

// Unambiguous alphabet (no I, L, O, 0, 1) so codes are easy to read aloud/type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 symbols
const CODE_LENGTH = 12; // 31^12 ≈ 7.9e17 (~59 bits of entropy)

/** Cryptographically random room code, normalized form (no dashes). */
const generateRoomCode = () => {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return out;
};

/** Accepts user input like "abcd-efgh-jkmn" and returns the normalized code, or null. */
const normalizeRoomCode = (input) => {
  if (typeof input !== "string") return null;
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== CODE_LENGTH) return null;
  for (const ch of cleaned) {
    if (!CODE_ALPHABET.includes(ch)) return null;
  }
  return cleaned;
};

/** "ABCDEFGHJKMN" -> "ABCD-EFGH-JKMN" */
const formatRoomCode = (code) => (code ? code.match(/.{1,4}/g).join("-") : "");

/**
 * Long, unpredictable external meeting name (160 random bits).
 * Deliberately contains no room name, client name or user data.
 */
const generateMeetingName = () => `Sorted${crypto.randomBytes(20).toString("hex")}`;

module.exports = {
  generateRoomCode,
  normalizeRoomCode,
  formatRoomCode,
  generateMeetingName,
  CODE_LENGTH,
};

// Search that works with Malayalam OR English (Manglish) typing.
//
// Idea: reduce both the stored name and what the user typed to the same loose
// "consonant skeleton", then do a substring match. Manglish spelling is very
// inconsistent (Sreedharan / Sridharan, Thomas / Thoomas, Joseph / Josef), and
// vowels vary the most, so vowels are ignored and similar-sounding consonants
// are merged.

// Malayalam consonants -> rough Latin sound. Vowel letters/signs are not needed
// because vowels are dropped from the skeleton anyway.
const CONSONANTS = {
  ക: "k",
  ഖ: "kh",
  ഗ: "g",
  ഘ: "gh",
  ങ: "ng",
  ച: "ch",
  ഛ: "chh",
  ജ: "j",
  ഝ: "jh",
  ഞ: "nj",
  ട: "t",
  ഠ: "th",
  ഡ: "d",
  ഢ: "dh",
  ണ: "n",
  ത: "th",
  ഥ: "th",
  ദ: "d",
  ധ: "dh",
  ന: "n",
  പ: "p",
  ഫ: "f",
  ബ: "b",
  ഭ: "bh",
  മ: "m",
  യ: "y",
  ര: "r",
  ല: "l",
  വ: "v",
  ശ: "sh",
  ഷ: "sh",
  സ: "s",
  ഹ: "h",
  ള: "l",
  ഴ: "zh",
  റ: "r",
  // chillu letters and anusvara
  ൺ: "n",
  ൻ: "n",
  ർ: "r",
  ൽ: "l",
  ൾ: "l",
  ൿ: "k",
  "ം": "m",
  "ഃ": "h",
};

function romanizeMalayalam(text) {
  let out = "";
  for (const ch of text) out += CONSONANTS[ch] ?? ch;
  return out;
}

// Latin text -> consonant skeleton.
function normalizeLatin(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z]/g, "") // drops spaces, digits, leftover Malayalam vowel signs
    .replace(/zh/g, "l") // ഴ is written "zh" but sounds like l/r
    .replace(/h/g, "") // th, dh, sh, kh, ch, bh, gh... -> t, d, s, k, c, b, g
    .replace(/[aeiouy]/g, "") // vowels (and y) vary too much in Manglish
    .replace(/w/g, "v")
    .replace(/[cq]/g, "k")
    .replace(/x/g, "ks")
    .replace(/f/g, "p")
    .replace(/z/g, "s")
    .replace(/m(?=[bdgjkpt])/g, "n") // anusvara-style m: Sangeetha = സംഗീത
    .replace(/n[gj]/g, "n") // ng / nj sound like n
    .replace(/(.)\1+/g, "$1"); // collapse doubles: kk, tt, nn...
}

const cache = new Map();

export function toSkeleton(text) {
  const key = String(text ?? "");
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = normalizeLatin(romanizeMalayalam(key));
    if (cache.size > 5000) cache.clear();
    cache.set(key, hit);
  }
  return hit;
}

// True when `name` matches what the user typed, in Malayalam or English.
export function matchesSearch(name, query) {
  const q = String(query ?? "").trim();
  if (!q) return true;
  const n = String(name ?? "");

  // 1. Exact substring (covers Malayalam typed against Malayalam names).
  if (n.toLowerCase().includes(q.toLowerCase())) return true;

  // 2. Sound-alike match (covers English typed against Malayalam names).
  const qs = toSkeleton(q);
  return qs.length > 0 && toSkeleton(n).includes(qs);
}

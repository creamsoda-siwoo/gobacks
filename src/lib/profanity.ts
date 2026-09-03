// Minimal curated Korean/English banned-word list for basic filtering.
// Not exhaustive by design — intended as a first line of defense; final
// judgment still happens via admin review of the pending queue.
const BANNED_WORDS = [
  "씨발", "시발", "씨팔", "시팔", "개새끼", "개새기", "새끼", "병신", "븅신",
  "지랄", "존나", "졸라", "좆", "미친놈", "미친년", "닥쳐", "꺼져버려",
  "걸레년", "창녀", "화냥년", "느금마", "느그애비", "니미", "썅", "개년",
  "개자식", "썩을년", "쌍놈", "쌍년", "년아", "놈아", "정신병자",
  "fuck", "fucker", "shit", "bitch", "asshole", "motherfucker", "cunt",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s.,!?~\-_*'"()[\]]/g, "");
}

export function findProfanity(text: string): string | null {
  const normalized = normalize(text);
  for (const word of BANNED_WORDS) {
    if (normalized.includes(word)) return word;
  }
  return null;
}

export function containsProfanity(text: string): boolean {
  return findProfanity(text) !== null;
}

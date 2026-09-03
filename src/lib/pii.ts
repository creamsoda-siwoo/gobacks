export interface PiiPattern {
  label: string;
  regex: RegExp;
}

// Heuristic patterns for content that likely identifies a real person.
// These *warn*, they don't block — false positives are common in Korean text.
export const PII_PATTERNS: PiiPattern[] = [
  { label: "전화번호", regex: /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/ },
  { label: "이메일", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  {
    label: "카카오톡 아이디",
    regex: /(카카오\s?톡?|카톡)\s*(아이디|id)?\s*[:\-]?\s*[a-zA-Z0-9_.]{3,}/i,
  },
  {
    label: "인스타그램 아이디",
    regex: /(인스타\s?그?램?|insta(gram)?)\s*(아이디|id)?\s*[:\-]?\s*@?[a-zA-Z0-9_.]{3,}/i,
  },
  {
    label: "학년/반/번호",
    regex: /[1-3]\s?학년\s?\d{1,2}\s?반\s?\d{1,2}\s?번/,
  },
];

export function detectPii(text: string): string[] {
  const hits: string[] = [];
  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(text)) hits.push(pattern.label);
  }
  return hits;
}

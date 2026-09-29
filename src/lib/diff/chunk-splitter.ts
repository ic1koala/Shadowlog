/**
 * Natural English Chunk (Sense Group) Splitter for Shadowing
 * Determines word indices after which a visual chunk slash (/) should be displayed.
 * Crucially, this only returns indices and never mutates the word array or layout.
 */

// Clause-starting conjunctions & relative pronouns (split if current chunk >= 2 words)
const CLAUSE_STARTERS = new Set([
  "that",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "while",
  "because",
  "although",
  "though",
  "since",
  "if",
  "unless",
  "until",
  "before",
  "after",
  "whether",
  "whereas",
  "whenever",
  "wherever",
]);

// Coordinating conjunctions (split if current chunk >= 3 words and remaining >= 2 words)
const COORD_CONJUNCTIONS = new Set(["and", "but", "or", "so", "yet"]);

// Prepositions and infinitive "to" (split if current chunk >= 3 words)
const PREPOSITIONS = new Set([
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "by",
  "about",
  "through",
  "during",
  "without",
  "between",
  "among",
  "against",
  "toward",
  "towards",
  "into",
  "upon",
  "within",
  "across",
  "beyond",
  "under",
  "over",
  "to",
]);

// Collocations ending with "to" that must NOT be split before "to"
const PROTECTED_BEFORE_TO = new Set([
  "want",
  "wants",
  "wanted",
  "need",
  "needs",
  "needed",
  "have",
  "has",
  "had",
  "try",
  "tries",
  "tried",
  "going",
  "able",
  "unable",
  "used",
  "ought",
  "due",
  "according",
  "prior",
  "thanks",
  "compared",
  "related",
  "lead",
  "leads",
  "led",
  "refer",
  "refers",
  "referred",
  "contribute",
  "contributes",
  "contributed",
  "adapt",
  "adapts",
  "adapted",
  "respond",
  "responds",
  "responded",
  "listen",
  "listens",
  "listening",
  "look",
  "looks",
  "looking",
  "forward",
  "expected",
  "expect",
  "expects",
  "decide",
  "decided",
  "decides",
  "plan",
  "plans",
  "planned",
  "tend",
  "tends",
  "tended",
  "continue",
  "continues",
  "continued",
  "begin",
  "begins",
  "began",
  "start",
  "starts",
  "started",
]);

// Compound conjunction prefixes that should not be split right before the second word (e.g., "even though", "so that", "as if")
const COMPOUND_CONJ_FIRST = new Set(["even", "so", "as", "in", "now"]);

// Common abbreviations ending with a period that do not mark a clause end
const ABBREVIATIONS = new Set([
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
  "sr.",
  "jr.",
  "st.",
  "vs.",
  "etc.",
  "e.g.",
  "i.e.",
  "u.s.",
  "u.k.",
  "inc.",
  "ltd.",
  "co.",
]);

function normalizeToken(word: string): string {
  return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").toLowerCase();
}

function hasPunctuationBreak(word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;
  if (ABBREVIATIONS.has(trimmed.toLowerCase())) return false;
  return /[,;:—.?!]["'”’)]*$/.test(trimmed);
}

/**
 * Returns a Set of word indices (0-based) after which a chunk slash (/) should be rendered.
 * @param words Array of whitespace-split word strings from a sentence
 */
export function getChunkSlashIndices(words: string[]): Set<number> {
  const slashIndices = new Set<number>();
  if (!words || words.length <= 3) {
    return slashIndices;
  }

  let currentChunkLength = 0;

  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    currentChunkLength += 1;

    // 1. Always break after punctuation (comma, semicolon, period in multi-sentence passage, etc.)
    if (hasPunctuationBreak(word)) {
      slashIndices.add(i);
      currentChunkLength = 0;
      continue;
    }

    const remainingWords = words.length - 1 - i;
    // Avoid leaving a single isolated word at the very end of the sentence
    if (remainingWords <= 1) {
      continue;
    }

    const currClean = normalizeToken(word);
    const nextClean = normalizeToken(nextWord);

    if (!nextClean) continue;

    // 2. Check compound conjunctions like "even though", "as if", "so that"
    // If current word is "even" and next is "though", don't split between them
    if (COMPOUND_CONJ_FIRST.has(currClean) && (nextClean === "though" || nextClean === "if" || nextClean === "that")) {
      continue;
    }

    // Check if the next two words form "even though", "even if", "so that", "as if"
    if (
      currentChunkLength >= 2 &&
      COMPOUND_CONJ_FIRST.has(nextClean) &&
      i + 2 < words.length
    ) {
      const afterNextClean = normalizeToken(words[i + 2]);
      if (afterNextClean === "though" || afterNextClean === "if" || afterNextClean === "that") {
        slashIndices.add(i);
        currentChunkLength = 0;
        continue;
      }
    }

    // 3. Clause starters (relative pronouns, subordinating conjunctions)
    if (CLAUSE_STARTERS.has(nextClean) && currentChunkLength >= 2) {
      slashIndices.add(i);
      currentChunkLength = 0;
      continue;
    }

    // 4. Coordinating conjunctions (and, but, or, so, yet) when chunk has at least 3 words
    if (COORD_CONJUNCTIONS.has(nextClean) && currentChunkLength >= 3 && remainingWords >= 2) {
      slashIndices.add(i);
      currentChunkLength = 0;
      continue;
    }

    // 5. Prepositions & infinitive "to" when current chunk has at least 3 words
    if (PREPOSITIONS.has(nextClean) && currentChunkLength >= 3) {
      if (nextClean === "to" && PROTECTED_BEFORE_TO.has(currClean)) {
        continue;
      }
      slashIndices.add(i);
      currentChunkLength = 0;
      continue;
    }
  }

  return slashIndices;
}

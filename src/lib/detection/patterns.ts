// ---------------------------------------------------------------------------
// Regex patterns for detecting section headings inside extracted page text.
//
// Supported heading families (case-insensitive, tolerant of punctuation
// and whitespace variance commonly seen in scanned/typed lab manuals):
//
//   Experiment No. 1 / Experiment 1 / Experiment-1 / Experiment:1 / EXPERIMENT 1
//   Assignment 1
//   Practical 1
//   Chapter 1
//   Unit 1
//   Section 1
//   Viva (no number expected, treated as a standalone marker)
// ---------------------------------------------------------------------------

export interface HeadingMatch {
  category: string;
  number: string;
  matchedText: string;
  index: number; // character offset within the page text
  confidence: number;
}

interface CategoryPattern {
  category: string;
  /** Regex must have a capture group named `num` for the section number, unless numberless */
  regex: RegExp;
  numberless?: boolean;
  baseConfidence: number;
}

// Numeric token: digits, optionally with a trailing letter (e.g. "3A"), or
// spelled out roman numerals I-XX as a fallback.
const NUM = String.raw`(?<num>\d{1,3}[A-Za-z]?|[IVXLCDM]{1,6})`;

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'Experiment',
    // Matches: "Experiment No. 1", "Experiment No 1", "Experiment 1",
    // "Experiment-1", "Experiment:1", "EXPERIMENT – 1"
    regex: new RegExp(
      String.raw`\bExperiment\b[\s.:\-–—]*?(?:No\.?|Number)?[\s.:\-–—]*${NUM}\b`,
      'i',
    ),
    baseConfidence: 0.95,
  },
  {
    category: 'Assignment',
    regex: new RegExp(String.raw`\bAssignment\b[\s.:\-–—]*?(?:No\.?)?[\s.:\-–—]*${NUM}\b`, 'i'),
    baseConfidence: 0.9,
  },
  {
    category: 'Practical',
    regex: new RegExp(String.raw`\bPractical\b[\s.:\-–—]*?(?:No\.?)?[\s.:\-–—]*${NUM}\b`, 'i'),
    baseConfidence: 0.9,
  },
  {
    category: 'Chapter',
    regex: new RegExp(String.raw`\bChapter\b[\s.:\-–—]*${NUM}\b`, 'i'),
    baseConfidence: 0.85,
  },
  {
    category: 'Unit',
    regex: new RegExp(String.raw`\bUnit\b[\s.:\-–—]*${NUM}\b`, 'i'),
    baseConfidence: 0.8,
  },
  {
    category: 'Section',
    regex: new RegExp(String.raw`\bSection\b[\s.:\-–—]*${NUM}\b`, 'i'),
    baseConfidence: 0.7,
  },
  {
    category: 'Viva',
    regex: /\bViva([\s-]?Voce)?\b/i,
    numberless: true,
    baseConfidence: 0.75,
  },
];

/**
 * Heuristic: a heading is far more likely to be a real section title (as
 * opposed to a stray in-body mention like "as seen in Experiment 1 above")
 * if it appears near the start of a line/page and the line is short.
 */
function contextBoost(pageText: string, matchIndex: number, matchedText: string): number {
  const lineStart = pageText.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = pageText.indexOf('\n', matchIndex);
  const line = pageText.slice(lineStart, lineEnd === -1 ? pageText.length : lineEnd);
  const trimmedLine = line.trim();

  let boost = 0;

  // Heading is (close to) the entire line -> strong signal
  if (trimmedLine.length <= matchedText.length + 20) boost += 0.15;

  // Heading appears within first ~120 characters of the page -> likely top-of-page title
  if (matchIndex < 120) boost += 0.1;

  // ALL CAPS lines are common for headings in scanned manuals
  if (trimmedLine === trimmedLine.toUpperCase() && /[A-Z]/.test(trimmedLine)) boost += 0.05;

  return boost;
}

let counter = 0;
export function findHeadingsOnPage(pageText: string): HeadingMatch[] {
  const matches: HeadingMatch[] = [];

  for (const pattern of CATEGORY_PATTERNS) {
    const re = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(pageText)) !== null) {
      const number = pattern.numberless ? String(++counter) : (m.groups?.num ?? '').toUpperCase();
      const boost = contextBoost(pageText, m.index, m[0]);
      matches.push({
        category: pattern.category,
        number,
        matchedText: m[0].trim(),
        index: m.index,
        confidence: Math.min(1, pattern.baseConfidence + boost),
      });
      // Avoid infinite loops on zero-width matches
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  // Sort by position on page
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

export const SUPPORTED_CATEGORIES = CATEGORY_PATTERNS.map((p) => p.category);

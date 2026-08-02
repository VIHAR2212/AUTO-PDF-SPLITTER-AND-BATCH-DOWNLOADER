import { findHeadingsOnPage } from './patterns';
import type { PageText } from '../pdf/extractText';
import type { PdfBookmark } from '../pdf/extractText';
import type { DetectedSection, DuplicateWarning, MissingWarning } from '@/types';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `sec-${Date.now()}-${idCounter}`;
}

export interface RawHeadingHit {
  pageNumber: number;
  category: string;
  number: string;
  matchedText: string;
  confidence: number;
}

/** Step 1: run regex detection across every page's text. */
export function detectHeadings(pages: PageText[]): RawHeadingHit[] {
  const hits: RawHeadingHit[] = [];
  for (const page of pages) {
    const matches = findHeadingsOnPage(page.text);
    for (const m of matches) {
      hits.push({
        pageNumber: page.pageNumber,
        category: m.category,
        number: m.number,
        matchedText: m.matchedText,
        confidence: m.confidence,
      });
    }
  }
  return hits;
}

/**
 * Step 2: collapse raw hits into sections with page ranges.
 * Each heading marks the *start* of a section; the section ends the page
 * before the next heading begins (or at the document's last page).
 *
 * Multiple hits on the exact same page for the exact same category+number
 * are deduplicated (common with headers repeated in running titles).
 */
export function buildSectionsFromHeadings(
  hits: RawHeadingHit[],
  totalPages: number,
): DetectedSection[] {
  // Dedup identical (page, category, number) triples, keep highest confidence
  const seen = new Map<string, RawHeadingHit>();
  for (const hit of hits) {
    const key = `${hit.pageNumber}|${hit.category}|${hit.number}`;
    const existing = seen.get(key);
    if (!existing || hit.confidence > existing.confidence) seen.set(key, hit);
  }
  const deduped = Array.from(seen.values()).sort((a, b) => a.pageNumber - b.pageNumber);

  // Further collapse: if the *same* category+number repeats on consecutive/
  // nearby pages (e.g. a heading printed again as a running header), treat
  // only the first occurrence as the true section start.
  const startHits: RawHeadingHit[] = [];
  const lastSeenPageForKey = new Map<string, number>();
  for (const hit of deduped) {
    const key = `${hit.category}|${hit.number}`;
    const lastPage = lastSeenPageForKey.get(key);
    if (lastPage === undefined) {
      startHits.push(hit);
    }
    lastSeenPageForKey.set(key, hit.pageNumber);
  }

  const sections: DetectedSection[] = startHits.map((hit, i) => {
    const nextHit = startHits[i + 1];
    const endPage = nextHit ? Math.max(hit.pageNumber, nextHit.pageNumber - 1) : totalPages;
    return {
      id: nextId(),
      category: hit.category,
      number: hit.number,
      title: `${hit.category} ${hit.number}`,
      startPage: hit.pageNumber,
      endPage,
      source: 'regex',
      matchedText: hit.matchedText,
      confidence: hit.confidence,
    };
  });

  return sections;
}

/** Alternative source: build sections directly from a PDF's bookmark/outline tree. */
export function buildSectionsFromBookmarks(
  bookmarks: PdfBookmark[],
  totalPages: number,
): DetectedSection[] {
  const flat: { title: string; pageNumber: number }[] = [];
  function walk(items: PdfBookmark[]) {
    for (const item of items) {
      flat.push({ title: item.title, pageNumber: item.pageNumber });
      if (item.children.length) walk(item.children);
    }
  }
  walk(bookmarks);
  flat.sort((a, b) => a.pageNumber - b.pageNumber);

  return flat.map((entry, i) => {
    const next = flat[i + 1];
    const endPage = next ? Math.max(entry.pageNumber, next.pageNumber - 1) : totalPages;
    // Try to pull a category/number out of the bookmark title for naming purposes
    const m = entry.title.match(/([A-Za-z]+)\D*(\d+[A-Za-z]?)/);
    return {
      id: nextId(),
      category: m?.[1] ?? 'Section',
      number: m?.[2] ?? String(i + 1),
      title: entry.title,
      startPage: entry.pageNumber,
      endPage,
      source: 'bookmark' as const,
      matchedText: entry.title,
      confidence: 0.9,
    };
  });
}

/** Detects duplicate section numbers within the same category. */
export function findDuplicates(sections: DetectedSection[]): DuplicateWarning[] {
  const groups = new Map<string, string[]>();
  for (const s of sections) {
    const key = `${s.category}|${s.number}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s.id);
  }
  const dups: DuplicateWarning[] = [];
  for (const [key, ids] of groups) {
    if (ids.length > 1) {
      dups.push({ number: key.split('|')[1], sectionIds: ids });
    }
  }
  return dups;
}

/** Detects gaps in a numeric sequence per category, e.g. Experiment 1,2,4 -> missing 3. */
export function findMissingSequence(sections: DetectedSection[]): MissingWarning[] {
  const byCategory = new Map<string, DetectedSection[]>();
  for (const s of sections) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  const warnings: MissingWarning[] = [];
  for (const [, list] of byCategory) {
    const numeric = list
      .map((s) => ({ s, n: parseInt(s.number, 10) }))
      .filter((x) => !Number.isNaN(x.n))
      .sort((a, b) => a.n - b.n);

    for (let i = 0; i < numeric.length - 1; i++) {
      const gap = numeric[i + 1].n - numeric[i].n;
      if (gap > 1) {
        warnings.push({
          message: `${numeric[i].s.category} ${numeric[i].n + 1} appears to be missing between ${numeric[i].s.number} and ${numeric[i + 1].s.number}`,
          afterNumber: numeric[i].s.number,
          beforeNumber: numeric[i + 1].s.number,
        });
      }
    }
  }
  return warnings;
}

export function createManualSection(startPage: number, endPage: number, totalPages: number): DetectedSection {
  return {
    id: nextId(),
    category: 'Custom',
    number: '1',
    title: `Custom Section`,
    startPage: Math.max(1, Math.min(startPage, totalPages)),
    endPage: Math.max(1, Math.min(endPage, totalPages)),
    source: 'manual',
    matchedText: '',
    confidence: 1,
    manuallyEdited: true,
  };
}

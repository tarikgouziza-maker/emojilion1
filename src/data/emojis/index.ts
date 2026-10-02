import { EmojiItem } from '../../types/emoji';
import { SMILEYS_EMOJIS } from './smileys';
import { PEOPLE_EMOJIS } from './people';
import { ANIMALS_EMOJIS } from './animals';
import { FOOD_EMOJIS } from './food';
import { TRAVEL_EMOJIS } from './travel';
import { ACTIVITIES_EMOJIS } from './activities';
import { OBJECTS_EMOJIS } from './objects';
import { SYMBOLS_EMOJIS } from './symbols';
import { FLAGS_EMOJIS } from './flags';
import { OFFICIAL_CATEGORIES } from '../unicodeCategories';

export const ALL_EMOJIS: EmojiItem[] = [
  ...SMILEYS_EMOJIS,
  ...PEOPLE_EMOJIS,
  ...ANIMALS_EMOJIS,
  ...FOOD_EMOJIS,
  ...TRAVEL_EMOJIS,
  ...ACTIVITIES_EMOJIS,
  ...OBJECTS_EMOJIS,
  ...SYMBOLS_EMOJIS,
  ...FLAGS_EMOJIS,
];

// Slugs map
export const EMOJI_BY_SLUG = new Map<string, EmojiItem>();
export const EMOJI_BY_CHAR = new Map<string, EmojiItem>();

ALL_EMOJIS.forEach(emoji => {
  EMOJI_BY_SLUG.set(emoji.slug, emoji);
  EMOJI_BY_CHAR.set(emoji.emoji, emoji);
});

// Category counts
export function getCategoriesWithCounts() {
  const counts = new Map<string, number>();
  const subCounts = new Map<string, number>();

  ALL_EMOJIS.forEach(e => {
    counts.set(e.category, (counts.get(e.category) || 0) + 1);
    subCounts.set(e.subcategory, (subCounts.get(e.subcategory) || 0) + 1);
  });

  return OFFICIAL_CATEGORIES.map(cat => ({
    ...cat,
    emojiCount: counts.get(cat.id) || 0,
    subcategories: cat.subcategories.map(sub => ({
      ...sub,
      emojiCount: subCounts.get(sub.id) || 0,
    }))
  }));
}

// Search helper with relevance scoring
export function searchEmojis(query: string, limit = 100): EmojiItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_EMOJIS.slice(0, limit);

  // Exact emoji character match
  const directMatch = EMOJI_BY_CHAR.get(q);
  if (directMatch) return [directMatch];

  // Code point search (e.g. U+1F600 or 1f600)
  const cleanCp = q.replace(/^u\+/i, '').toLowerCase();

  const scored: Array<{ emoji: EmojiItem; score: number }> = [];

  for (const e of ALL_EMOJIS) {
    let score = 0;
    const nameLower = e.name.toLowerCase();
    const slugLower = e.slug.toLowerCase();

    // 1. Direct character match
    if (e.emoji === q) {
      score += 2000;
    }

    // 2. Name matches
    if (nameLower === q) {
      score += 1500;
    } else if (nameLower.startsWith(q + ' ') || nameLower.startsWith(q)) {
      score += 900;
    } else if (nameLower.includes(' ' + q + ' ') || nameLower.endsWith(' ' + q)) {
      score += 600;
    } else if (nameLower.includes(q)) {
      score += 350;
    }

    // 3. Slug matches
    if (slugLower === q) {
      score += 800;
    } else if (slugLower.startsWith(q + '-')) {
      score += 500;
    } else if (slugLower.includes(q)) {
      score += 200;
    }

    // 4. Keyword matches
    if (e.keywords) {
      for (const k of e.keywords) {
        const kl = k.toLowerCase();
        if (kl === q) {
          score += 700;
        } else if (kl.startsWith(q + ' ') || kl.startsWith(q)) {
          score += 300;
        } else if (kl.includes(q)) {
          score += 100;
        }
      }
    }

    // 5. Code point match
    if (e.codePointHex) {
      const hexLower = e.codePointHex.toLowerCase();
      if (hexLower === cleanCp || hexLower === q) {
        score += 1000;
      } else if (hexLower.includes(cleanCp)) {
        score += 250;
      }
    }

    // 6. Category / subcategory match
    if (e.subcategory && e.subcategory.toLowerCase() === q) {
      score += 200;
    } else if (e.category && e.category.toLowerCase() === q) {
      score += 150;
    }

    // 7. Deprioritize skin tone variants if searching for base concepts
    if (nameLower.includes('skin tone') && !q.includes('skin') && !q.includes('tone')) {
      score -= 80;
    }

    // 8. Boost popular/featured emojis substantially if they matched
    if (score > 0 && e.isFeatured) {
      score += 350;
    }

    // 9. Iconic canonical matches (e.g. 'heart' / 'love' -> Red Heart ❤️, 'fire' -> Fire 🔥)
    if ((q === 'heart' || q === 'love') && (e.slug === 'red-heart' || e.emoji === '❤️')) {
      score += 2500;
    }
    if (q === 'fire' && (e.slug === 'fire' || e.emoji === '🔥')) {
      score += 2500;
    }

    if (score > 0) {
      scored.push({ emoji: e, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.emoji);
}

// Related emojis finder
export function getRelatedEmojis(emoji: EmojiItem, limit = 12): EmojiItem[] {
  const sameSub = ALL_EMOJIS.filter(e => e.id !== emoji.id && e.subcategory === emoji.subcategory);
  if (sameSub.length >= limit) {
    return sameSub.slice(0, limit);
  }
  const sameCat = ALL_EMOJIS.filter(e => e.id !== emoji.id && e.category === emoji.category && e.subcategory !== emoji.subcategory);
  const combined = [...sameSub, ...sameCat];
  return combined.slice(0, limit);
}

// Featured / popular emojis
export const FEATURED_EMOJIS = ALL_EMOJIS.filter(e => e.isFeatured);
export const NEW_EMOJIS = ALL_EMOJIS.filter(e => e.isNew);

// Gender collection
export const GENDER_EMOJIS = ALL_EMOJIS.filter(e => 
  e.hasGenderVariants || 
  e.gender !== undefined || 
  e.subcategory === 'gender' ||
  (e.keywords && (e.keywords.includes('woman') || e.keywords.includes('man') || e.keywords.includes('gender')))
);

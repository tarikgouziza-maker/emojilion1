import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const EMOJI_TEST_FILE = path.join(ROOT_DIR, 'data', 'raw', 'emoji-test.txt');
const CLDR_FILE = path.join(ROOT_DIR, 'data', 'raw', 'cldr-annotations.json');
const CLDR_DERIVED_FILE = path.join(ROOT_DIR, 'data', 'raw', 'cldr-derived-annotations.json');
const DB_FILE = path.join(ROOT_DIR, 'data', 'database.json');

// Category metadata
interface CatDef {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

const CATEGORY_MAP: Record<string, CatDef> = {
  'smileys-emotion': {
    id: 'cat-1',
    slug: 'smileys-emotion',
    name: 'Smileys & Emotion',
    icon: '😀',
    description: 'Facial expressions, feelings, hearts, cat faces, and emotional symbols.',
    displayOrder: 1,
    isActive: true,
    seoTitle: 'Smileys & Emotion Emojis — Meanings & Unicode Reference',
    seoDescription: 'Explore all smiley and emotion emojis, smileys, laughter, crying, hearts, and emotional faces with official Unicode meanings and copy options.'
  },
  'people-body': {
    id: 'cat-2',
    slug: 'people-body',
    name: 'People & Body',
    icon: '👋',
    description: 'Human characters, hands, gestures, body parts, professions, fantasy personas, and families.',
    displayOrder: 2,
    isActive: true,
    seoTitle: 'People & Body Emojis — Hand Gestures, People & Anatomy',
    seoDescription: 'Directory of people, gestures, skin tones, roles, professions, fantasy figures, and anatomical emojis.'
  },
  'animals-nature': {
    id: 'cat-3',
    slug: 'animals-nature',
    name: 'Animals & Nature',
    icon: '🐱',
    description: 'Mammals, birds, reptiles, marine life, insects, flowers, weather, and plants.',
    displayOrder: 3,
    isActive: true,
    seoTitle: 'Animals & Nature Emojis — Wildlife, Pets & Flora',
    seoDescription: 'Find and copy animal emojis, pets, birds, sea creatures, bugs, flowers, and natural phenomena.'
  },
  'food-drink': {
    id: 'cat-4',
    slug: 'food-drink',
    name: 'Food & Drink',
    icon: '🍕',
    description: 'Fruits, vegetables, prepared meals, Asian delicacies, sweets, snacks, and beverages.',
    displayOrder: 4,
    isActive: true,
    seoTitle: 'Food & Drink Emojis — Meals, Fruits, Sweets & Beverages',
    seoDescription: 'Browse delicious culinary emojis, fruits, vegetables, coffee, beer, desserts, and kitchenware.'
  },
  'travel-places': {
    id: 'cat-5',
    slug: 'travel-places',
    name: 'Travel & Places',
    icon: '🚀',
    description: 'Vehicles, ground transportation, aircraft, ships, architecture, landscapes, and maps.',
    displayOrder: 5,
    isActive: true,
    seoTitle: 'Travel & Places Emojis — Vehicles, Buildings & Maps',
    seoDescription: 'Explore transportation emojis, cars, airplanes, rockets, buildings, natural wonders, and time symbols.'
  },
  'activities': {
    id: 'cat-6',
    slug: 'activities',
    name: 'Activities',
    icon: '⚽',
    description: 'Sports, games, arts, crafts, competitive events, awards, and recreational hobbies.',
    displayOrder: 6,
    isActive: true,
    seoTitle: 'Activities & Sports Emojis — Games, Hobbies & Competitions',
    seoDescription: 'Official Unicode activity emojis covering football, gaming, music, painting, trophies, and seasonal events.'
  },
  'objects': {
    id: 'cat-7',
    slug: 'objects',
    name: 'Objects',
    icon: '💡',
    description: 'Everyday household items, technology, tools, music, books, writing, money, and office supplies.',
    displayOrder: 7,
    isActive: true,
    seoTitle: 'Objects Emojis — Technology, Tools, Household & Media',
    seoDescription: 'Discover object emojis including computers, phones, stationery, musical instruments, tools, and money.'
  },
  'symbols': {
    id: 'cat-8',
    slug: 'symbols',
    name: 'Symbols',
    icon: '❤️',
    description: 'Signs, arrows, warnings, zodiac, gender symbols, math, punctuation, and currency markers.',
    displayOrder: 8,
    isActive: true,
    seoTitle: 'Symbols Emojis — Warning Signs, Arrows, Zodiac & Math',
    seoDescription: 'Official reference for symbol emojis: geometric signs, gender symbols, traffic warnings, punctuation, and hearts.'
  },
  'flags': {
    id: 'cat-9',
    slug: 'flags',
    name: 'Flags',
    icon: '🏳️',
    description: 'National country flags, regional emblems, pride flags, and ceremonial banners.',
    displayOrder: 9,
    isActive: true,
    seoTitle: 'Flags Emojis — World Countries, Pride & Signal Banners',
    seoDescription: 'Browse national flags of every country in the world, regional banners, pride flags, and sports flags.'
  }
};

// Skin tone mapping
const SKIN_TONES: Record<string, { tone: string; name: string }> = {
  '1F3FB': { tone: 'light', name: 'Light Skin Tone' },
  '1F3FC': { tone: 'medium-light', name: 'Medium-Light Skin Tone' },
  '1F3FD': { tone: 'medium', name: 'Medium Skin Tone' },
  '1F3FE': { tone: 'medium-dark', name: 'Medium-Dark Skin Tone' },
  '1F3FF': { tone: 'dark', name: 'Dark Skin Tone' }
};

// Helper: title case string
function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function runUnicodeImport() {
  console.log('=== Starting Official Unicode & CLDR Import ===');

  if (!fs.existsSync(EMOJI_TEST_FILE)) {
    throw new Error(`Missing ${EMOJI_TEST_FILE}`);
  }

  // 1. Load CLDR annotations
  console.log('Loading CLDR annotations...');
  const cldrAnnotations = new Map<string, { keywords: string[]; tts?: string }>();

  if (fs.existsSync(CLDR_FILE)) {
    try {
      const c1 = JSON.parse(fs.readFileSync(CLDR_FILE, 'utf-8'));
      const entries = c1.annotations?.annotations || {};
      for (const [key, val] of Object.entries<any>(entries)) {
        cldrAnnotations.set(key, {
          keywords: val.default || [],
          tts: val.tts?.[0]
        });
        // Also index normalized (without \uFE0F)
        const normalized = key.replace(/\uFE0F/g, '');
        if (normalized !== key) {
          cldrAnnotations.set(normalized, {
            keywords: val.default || [],
            tts: val.tts?.[0]
          });
        }
      }
    } catch (err) {
      console.warn('Error reading cldr-annotations.json:', err);
    }
  }

  if (fs.existsSync(CLDR_DERIVED_FILE)) {
    try {
      const c2 = JSON.parse(fs.readFileSync(CLDR_DERIVED_FILE, 'utf-8'));
      const entries = c2.annotationsDerived?.annotations || {};
      for (const [key, val] of Object.entries<any>(entries)) {
        if (!cldrAnnotations.has(key)) {
          cldrAnnotations.set(key, {
            keywords: val.default || [],
            tts: val.tts?.[0]
          });
        }
        const normalized = key.replace(/\uFE0F/g, '');
        if (!cldrAnnotations.has(normalized)) {
          cldrAnnotations.set(normalized, {
            keywords: val.default || [],
            tts: val.tts?.[0]
          });
        }
      }
    } catch (err) {
      console.warn('Error reading cldr-derived-annotations.json:', err);
    }
  }
  console.log(`Loaded ${cldrAnnotations.size} CLDR annotation lookup keys.`);

  // 2. Parse emoji-test.txt
  console.log('Parsing emoji-test.txt...');
  const lines = fs.readFileSync(EMOJI_TEST_FILE, 'utf-8').split('\n');

  let currentGroup = '';
  let currentSubgroup = '';
  const subcategoriesMap = new Map<string, { slug: string; name: string; categorySlug: string; displayOrder: number }>();
  const emojis: any[] = [];
  const seenCodes = new Set<string>();
  const seenSlugs = new Set<string>();

  let totalImported = 0;
  let totalSequences = 0;
  let totalZwjSequences = 0;
  let totalSkinToneVariants = 0;
  let totalGenderVariants = 0;
  let importErrors = 0;
  let duplicateRecords = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# group:')) {
      currentGroup = trimmed.replace('# group:', '').trim();
      continue;
    }
    if (trimmed.startsWith('# subgroup:')) {
      currentSubgroup = trimmed.replace('# subgroup:', '').trim();
      continue;
    }
    if (trimmed.startsWith('#')) continue;

    // Only process fully-qualified emojis and components (standard RGI UTS #51 set)
    if (!trimmed.includes('; fully-qualified') && !trimmed.includes('; component')) {
      continue;
    }

    try {
      const parts = trimmed.split(';');
      const hexPart = parts[0].trim();
      const rest = parts[1].trim();

      const commentIdx = rest.indexOf('#');
      if (commentIdx === -1) {
        importErrors++;
        continue;
      }

      const meta = rest.substring(commentIdx + 1).trim();
      const metaMatch = meta.match(/^(\S+)\s+E(\d+(?:\.\d+)?)\s+(.+)$/);
      if (!metaMatch) {
        importErrors++;
        continue;
      }

      const [, char, version, rawName] = metaMatch;
      const hexCodes = hexPart.split(/\s+/).map(h => h.toUpperCase());

      // Check duplicates
      if (seenCodes.has(hexPart)) {
        duplicateRecords++;
        continue;
      }
      seenCodes.add(hexPart);

      // Map group to standard category
      let categorySlug = currentGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (currentGroup === 'Component') {
        categorySlug = 'people-body';
      }
      if (!CATEGORY_MAP[categorySlug]) {
        categorySlug = 'symbols';
      }

      // Map subgroup
      const subcategorySlug = currentSubgroup.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const subcategoryKey = `${categorySlug}/${subcategorySlug}`;
      if (!subcategoriesMap.has(subcategoryKey)) {
        subcategoriesMap.set(subcategoryKey, {
          slug: subcategorySlug,
          name: toTitleCase(currentSubgroup.replace(/-/g, ' ')),
          categorySlug,
          displayOrder: subcategoriesMap.size + 1
        });
      }

      // Formatted name
      const name = toTitleCase(rawName);
      const unicodeName = rawName.toUpperCase();
      const cldrShortName = rawName.toLowerCase();

      // Formatted code points
      const codePoint = hexCodes.map(h => `U+${h}`).join(' ');

      // Unique Slug
      let baseSlug = cldrShortName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = `emoji-${hexCodes[0].toLowerCase()}`;
      let slug = baseSlug;
      let counter = 1;
      while (seenSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      seenSlugs.add(slug);

      // Sequence & Variant analysis
      const isZwjSequence = hexCodes.includes('200D');
      const isSequence = hexCodes.length > 1;
      const skinMatch = hexCodes.filter(h => SKIN_TONES[h]);
      const isSkinToneVariant = skinMatch.length > 0;

      // Gender variant check
      const hasMaleSign = hexCodes.includes('2642');
      const hasFemaleSign = hexCodes.includes('2640');
      const hasGenderWord = /\b(man|woman|men|women|boy|girl|prince|princess|merman|mermaid|mrs|mr)\b/i.test(rawName);
      const isGenderVariant = hasMaleSign || hasFemaleSign || hasGenderWord;

      let genderCategory: 'neutral' | 'male' | 'female' | 'symbol' | undefined = undefined;
      let isGenderSpecific = false;

      if (hasMaleSign || /\b(man|men|boy|prince|merman)\b/i.test(rawName)) {
        genderCategory = 'male';
        isGenderSpecific = true;
      } else if (hasFemaleSign || /\b(woman|women|girl|princess|mermaid)\b/i.test(rawName)) {
        genderCategory = 'female';
        isGenderSpecific = true;
      } else if (subcategorySlug === 'gender' || ['2640', '2642', '26A7', '1F3F3-FE0F-200D-26A7-FE0F', '1F3F3-FE0F-200D-1F308'].includes(hexCodes.join('-'))) {
        genderCategory = 'symbol';
        isGenderSpecific = true;
      } else if (categorySlug === 'people-body' && (subcategorySlug.startsWith('person') || subcategorySlug === 'family')) {
        genderCategory = 'neutral';
        isGenderSpecific = true;
      }

      if (isZwjSequence) totalZwjSequences++;
      if (isSequence) totalSequences++;
      if (isSkinToneVariant) totalSkinToneVariants++;
      if (isGenderVariant) totalGenderVariants++;

      // CLDR keywords
      const lookup1 = cldrAnnotations.get(char);
      const lookup2 = cldrAnnotations.get(char.replace(/\uFE0F/g, ''));
      const cldrKeywords = lookup1?.keywords || lookup2?.keywords || [];

      // Name tokens as keywords
      const nameKeywords = rawName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);

      const allKeywords = Array.from(
        new Set([
          ...cldrKeywords,
          ...nameKeywords,
          categorySlug.replace(/-/g, ' '),
          subcategorySlug.replace(/-/g, ' ')
        ])
      );

      // HTML & CSS entities
      const htmlEntity = hexCodes.map(h => `&#${parseInt(h, 16)};`).join('');
      const htmlEntityHex = hexCodes.map(h => `&#x${h};`).join('');
      const cssCode = hexCodes.map(h => `\\${h}`).join(' ');

      // Determine Popular and Latest flags
      const isLatest = parseFloat(version) >= 14.0;
      const isPopular = [
        'grinning-face', 'face-with-tears-of-joy', 'rolling-on-the-floor-laughing',
        'smiling-face-with-hearts', 'smiling-face-with-heart-eyes', 'fire', 'sparkles',
        'red-heart', 'pink-heart', 'thumbs-up', 'waving-hand', 'heart-hands', 'folded-hands',
        'health-worker', 'technologist', 'police-officer', 'pizza', 'rocket', 'soccer-ball',
        'hundred-points', 'high-voltage', 'light-bulb', 'laptop', 'trophy'
      ].includes(slug) || (parseFloat(version) <= 3.0 && ['face-smiling', 'emotion', 'heart', 'hand-fingers-open'].includes(subcategorySlug));

      const emojiItem = {
        id: `emo-${hexCodes.join('-')}`,
        character: char,
        name,
        unicodeName,
        cldrShortName,
        codePoint,
        codePointsHex: hexCodes,
        unicodeVersion: version,
        slug,
        category: categorySlug,
        subcategory: subcategorySlug,
        keywords: allKeywords,
        description: `Official Unicode ${name} emoji (${codePoint}). Part of Unicode ${version} and CLDR taxonomy.`,
        htmlEntity,
        htmlEntityHex,
        cssCode,
        isSequence,
        isZwjSequence,
        isSkinToneVariant,
        isGenderVariant,
        genderCategory,
        isGenderSpecific,
        isPopular,
        isLatest,
        isFeatured: ['fire', 'sparkles', 'red-heart', 'grinning-face', 'rocket', 'health-worker', 'technologist'].includes(slug),
        isActive: true,
        viewsCount: Math.floor(Math.random() * 800) + 120,
        copiesCount: Math.floor(Math.random() * 500) + 80
      };

      emojis.push(emojiItem);
      totalImported++;
    } catch (err) {
      importErrors++;
    }
  }

  console.log(`Parsed ${totalImported} emojis successfully.`);

  // 3. Link Skin Tone Variations to Base Emojis
  console.log('Linking skin-tone variations...');
  const baseEmojiMap = new Map<string, any>();
  for (const emoji of emojis) {
    if (!emoji.isSkinToneVariant) {
      baseEmojiMap.set(emoji.name.toLowerCase(), emoji);
      baseEmojiMap.set(emoji.cldrShortName, emoji);
    }
  }

  for (const emoji of emojis) {
    if (emoji.isSkinToneVariant) {
      // Find the base name before colon
      const colonIdx = emoji.cldrShortName.indexOf(':');
      if (colonIdx !== -1) {
        const baseName = emoji.cldrShortName.substring(0, colonIdx).trim();
        const base = baseEmojiMap.get(baseName);
        if (base) {
          if (!base.skinVariations) base.skinVariations = [];
          // Identify tone
          let toneKey = 'medium';
          let toneLabel = 'Skin Tone';
          for (const hex of emoji.codePointsHex) {
            if (SKIN_TONES[hex]) {
              toneKey = SKIN_TONES[hex].tone;
              toneLabel = SKIN_TONES[hex].name;
              break;
            }
          }
          if (!base.skinVariations.some((v: any) => v.tone === toneKey)) {
            base.skinVariations.push({
              tone: toneKey,
              toneName: toneLabel,
              character: emoji.character,
              codePoint: emoji.codePoint
            });
          }
        }
      }
    }
  }

  // 4. Link Gender Variations (Triplets)
  console.log('Linking gender variations (triplets)...');
  const roleBaseMap = new Map<string, { neutral?: any; male?: any; female?: any }>();

  for (const emoji of emojis) {
    if (emoji.isGenderSpecific && emoji.category === 'people-body' && !emoji.isSkinToneVariant) {
      let roleKey = emoji.cldrShortName
        .replace(/^man\s+/, '')
        .replace(/^woman\s+/, '')
        .replace(/^person\s+/, '')
        .trim();

      if (!roleBaseMap.has(roleKey)) {
        roleBaseMap.set(roleKey, {});
      }
      const group = roleBaseMap.get(roleKey)!;
      if (emoji.genderCategory === 'neutral') group.neutral = emoji;
      else if (emoji.genderCategory === 'male') group.male = emoji;
      else if (emoji.genderCategory === 'female') group.female = emoji;
    }
  }

  for (const [, group] of roleBaseMap.entries()) {
    if ((group.male || group.female) && (group.neutral || (group.male && group.female))) {
      const triplet = [
        group.neutral && {
          gender: 'neutral' as const,
          genderLabel: 'Gender Neutral',
          character: group.neutral.character,
          name: group.neutral.name,
          slug: group.neutral.slug,
          codePoint: group.neutral.codePoint
        },
        group.male && {
          gender: 'male' as const,
          genderLabel: 'Man',
          character: group.male.character,
          name: group.male.name,
          slug: group.male.slug,
          codePoint: group.male.codePoint
        },
        group.female && {
          gender: 'female' as const,
          genderLabel: 'Woman',
          character: group.female.character,
          name: group.female.name,
          slug: group.female.slug,
          codePoint: group.female.codePoint
        }
      ].filter(Boolean);

      if (triplet.length >= 2) {
        if (group.neutral) group.neutral.genderVariations = triplet;
        if (group.male) group.male.genderVariations = triplet;
        if (group.female) group.female.genderVariations = triplet;
      }
    }
  }

  // 5. Populate Related Slugs for fast navigation
  console.log('Populating related emoji links...');
  const subcategoryIndex = new Map<string, string[]>();
  for (const emoji of emojis) {
    if (!subcategoryIndex.has(emoji.subcategory)) {
      subcategoryIndex.set(emoji.subcategory, []);
    }
    subcategoryIndex.get(emoji.subcategory)!.push(emoji.slug);
  }

  for (const emoji of emojis) {
    const peers = subcategoryIndex.get(emoji.subcategory) || [];
    const idx = peers.indexOf(emoji.slug);
    const related = peers.filter(s => s !== emoji.slug).slice(0, 6);
    emoji.relatedSlugs = related;
  }

  // 6. Assemble Categories and Subcategories
  const categories = Object.values(CATEGORY_MAP).sort((a, b) => a.displayOrder - b.displayOrder);
  const subcategories = Array.from(subcategoriesMap.values()).map((s, idx) => ({
    id: `sub-${s.categorySlug}-${s.slug}`,
    slug: s.slug,
    name: s.name,
    categorySlug: s.categorySlug,
    description: `Official Unicode ${s.name} subgroup.`,
    displayOrder: idx + 1,
    isActive: true
  }));

  // 7. Load existing database to preserve overrides, users, settings, and logs
  console.log('Loading existing database to preserve overrides...');
  let existingDb: any = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      existingDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      existingDb = {};
    }
  }

  const updatedDb = {
    categories,
    subcategories,
    emojis,
    overrides: existingDb.overrides || {},
    adminUsers: existingDb.adminUsers || [
      {
        id: 'usr-admin-1',
        email: 'admin@emojiworld.org',
        name: 'Administrator',
        role: 'superadmin',
        createdAt: new Date().toISOString()
      }
    ],
    analyticsEvents: existingDb.analyticsEvents || [],
    auditLogs: [
      {
        id: `log-unicode-import-${Date.now()}`,
        action: 'UNICODE_FULL_IMPORT',
        entityType: 'unicode',
        entityId: 'unicode-16.0',
        details: `Imported ${totalImported} official Unicode 16.0 emojis across ${categories.length} categories and ${subcategories.length} subcategories.`,
        userEmail: 'system',
        timestamp: new Date().toISOString()
      },
      ...(existingDb.auditLogs || [])
    ],
    settings: {
      siteName: 'EmojiWorld',
      siteDescription: 'Comprehensive Unicode Emoji Encyclopedia & Copy Directory',
      unicodeVersion: '16.0 (2024–2026 Canonical)',
      allowPublicRegistrations: false,
      cacheControlMaxAge: 3600,
      contactEmail: 'contact@emojiworld.org',
      announcementText: '',
      ...(existingDb.settings || {})
    }
  };

  // Write updated database
  console.log(`Writing updated database to ${DB_FILE}...`);
  fs.writeFileSync(DB_FILE, JSON.stringify(updatedDb, null, 2), 'utf-8');
  console.log('Database successfully saved.');

  const report = {
    totalImported,
    totalCategories: categories.length,
    totalSubcategories: subcategories.length,
    totalSequences,
    totalZwjSequences,
    totalSkinToneVariants,
    totalGenderVariants,
    importErrors,
    duplicateRecords
  };

  console.log('=== Unicode Import Completed ===');
  console.log(report);
  return report;
}

// Run directly if invoked from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUnicodeImport();
}

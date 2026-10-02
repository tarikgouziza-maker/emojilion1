// ============================================================================
// D1 Seed Generator
// Generates scripts/seed-data.sql containing all 3,790 emojis, categories & admin
// ============================================================================

import fs from 'fs';
import path from 'path';
import { ALL_EMOJIS } from '../src/data/emojis/index.ts';
import { OFFICIAL_CATEGORIES } from '../src/data/unicodeCategories.ts';
import { hashPassword } from '../core/crypto.ts';

function escapeSql(str: string | undefined | null): string {
  if (str === undefined || str === null) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function generateSeed() {
  console.log(`Processing ${ALL_EMOJIS.length} emojis and ${OFFICIAL_CATEGORIES.length} categories...`);

  const lines: string[] = [
    '-- ============================================================================',
    '-- EmojiLion D1 Database Initial Seed Data',
    `-- Total Emojis: ${ALL_EMOJIS.length}`,
    '-- ============================================================================',
    ''
  ];

  // 1. Seed Categories
  lines.push('-- Categories Seed');
  for (const cat of OFFICIAL_CATEGORIES) {
    const subJson = JSON.stringify(cat.subcategories || []);
    lines.push(
      `INSERT OR IGNORE INTO categories (id, name, slug, description, icon, sort_order, emoji_count, subcategories_json) VALUES (${escapeSql(cat.id)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description)}, ${escapeSql(cat.icon)}, ${cat.order || 0}, ${cat.emojiCount || 0}, ${escapeSql(subJson)});`
    );
  }
  lines.push('');

  // 2. Seed Default Admin Account
  const defaultPass = 'AdminPass2026!';
  const { hash, salt } = await hashPassword(defaultPass);
  lines.push('-- Default Admin Account (admin@emojiworld.com / AdminPass2026!)');
  lines.push(
    `INSERT OR IGNORE INTO admins (id, email, name, password_hash, password_salt, role, created_at) VALUES ('admin-1', 'admin@emojiworld.com', 'EmojiLion SuperAdmin', '${hash}', '${salt}', 'superadmin', '${new Date().toISOString()}');`
  );
  lines.push('');

  // 3. Seed Default Site Settings
  const settingsJson = JSON.stringify({
    siteName: 'EmojiLion',
    siteDescription: 'The modern, authoritative emoji encyclopedia and search reference.',
    contactEmail: 'contact@emojilion.com',
    enableAnalytics: true,
    enableLiveUnicodeSync: true,
    featuredCategorySlugs: ['smileys-emotion', 'animals-nature', 'food-drink', 'activities']
  });
  lines.push('-- Global Site Settings');
  lines.push(
    `INSERT OR REPLACE INTO site_settings (key, value) VALUES ('global', ${escapeSql(settingsJson)});`
  );
  lines.push('');

  // 4. Seed All 3,790 Emojis
  lines.push('-- Emojis Seed');
  for (const e of ALL_EMOJIS) {
    const keywordsJson = JSON.stringify(e.keywords || []);
    const id = e.id || e.slug;
    const char = e.emoji || (e as any).character;
    const isFeatured = e.isFeatured ? 1 : 0;
    const isNew = e.isNew ? 1 : 0;
    const isPopular = (e as any).isPopular ? 1 : 0;
    const status = e.status || 'active';
    const views = (e as any).viewsCount || e.viewCount || 0;
    const copies = (e as any).copiesCount || e.copyCount || 0;

    lines.push(
      `INSERT OR IGNORE INTO emojis (id, character, name, unicode_name, cldr_short_name, code_point, code_point_hex, slug, category, subcategory, keywords_json, description, custom_description, seo_title, is_featured, is_new, is_popular, status, views_count, copies_count, sort_order, created_at) VALUES (${escapeSql(id)}, ${escapeSql(char)}, ${escapeSql(e.name)}, ${escapeSql((e as any).unicodeName)}, ${escapeSql((e as any).cldrShortName)}, ${escapeSql(e.codePoint)}, ${escapeSql(e.codePointHex)}, ${escapeSql(e.slug)}, ${escapeSql(e.category)}, ${escapeSql(e.subcategory)}, ${escapeSql(keywordsJson)}, ${escapeSql(e.description)}, ${escapeSql(e.customDescription)}, ${escapeSql(e.seoTitle)}, ${isFeatured}, ${isNew}, ${isPopular}, ${escapeSql(status)}, ${views}, ${copies}, 0, '${new Date().toISOString()}');`
    );
  }

  const outPath = path.resolve('scripts/seed-data.sql');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`Successfully generated ${outPath} (${lines.length} lines)`);
}

generateSeed().catch(console.error);

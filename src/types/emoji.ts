export type EmojiCategory =
  | 'smileys-emotion'
  | 'people-body'
  | 'animals-nature'
  | 'food-drink'
  | 'travel-places'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags';

export interface CategoryInfo {
  id: EmojiCategory;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  subcategories: SubcategoryInfo[];
  emojiCount?: number;
}

export interface SubcategoryInfo {
  id: string;
  name: string;
  slug: string;
  categorySlug: EmojiCategory;
  description: string;
  order: number;
  emojiCount?: number;
}

export type SkinTone = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
export type GenderType = 'male' | 'female' | 'neutral';

export interface EmojiVariation {
  type: 'skin_tone' | 'gender' | 'hair_style' | 'combination';
  emoji: string;
  label: string;
  skinTone?: SkinTone;
  gender?: GenderType;
  codePoint: string;
}

export interface EmojiSequencePart {
  codePoint: string;
  name: string;
  char: string;
}

export interface EmojiItem {
  id: string; // usually slug or hex code
  emoji: string;
  character?: string;
  name: string;
  cldrName: string;
  slug: string;
  category: EmojiCategory;
  subcategory: string; // subcategory slug
  codePoint: string; // e.g. "U+1F600" or sequence "U+1F468 U+200D U+1F4BB"
  codePointHex: string; // e.g. "1f600"
  keywords: string[];
  version: string; // e.g. "1.0", "13.0", "15.0", "16.0"
  isFeatured?: boolean;
  isNew?: boolean;
  gender?: GenderType;
  hasSkinTones?: boolean;
  hasGenderVariants?: boolean;
  variations?: EmojiVariation[];
  sequenceParts?: EmojiSequencePart[];
  description?: string;
  customDescription?: string;
  viewCount?: number;
  copyCount?: number;
  updatedAt?: string;
  status?: 'active' | 'hidden';
  seoTitle?: string;
  seoDescription?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entityType: 'emoji' | 'category' | 'subcategory' | 'seo' | 'unicode_sync' | 'settings';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SearchLog {
  query: string;
  count: number;
  lastSearched: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  defaultOgImage: string;
  enableAnalytics: boolean;
  enableLiveUnicodeSync: boolean;
  maintenanceMode: boolean;
  featuredCategorySlugs: string[];
  unicodeVersion: string;
}

export interface UnicodeSyncReport {
  lastSyncDate: string;
  unicodeVersion: string;
  totalParsed: number;
  addedCount: number;
  updatedCount: number;
  deprecatedCount: number;
  warnings: string[];
  status: 'synced' | 'pending' | 'in_progress' | 'error';
}

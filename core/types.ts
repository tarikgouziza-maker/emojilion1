// ============================================================================
// Core Domain Types for EmojiLion
// Portable across Cloudflare (D1/Workers/Pages) and Node.js VPS (Postgres/MySQL)
// ============================================================================

export interface EmojiRecord {
  id: string;
  character: string;
  name: string;
  unicodeName?: string;
  cldrShortName?: string;
  codePoint: string;
  codePointHex?: string;
  slug: string;
  category: string;
  subcategory: string;
  keywords: string[];
  description?: string;
  customDescription?: string;
  seoTitle?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  status: 'active' | 'hidden';
  viewsCount: number;
  copiesCount: number;
  sortOrder?: number;
  createdAt?: string;
}

export interface SubcategoryRecord {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  order: number;
  emojiCount?: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  emojiCount?: number;
  subcategories: SubcategoryRecord[];
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'superadmin' | 'editor';
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  adminId: string;
  email: string;
  role: string;
  name: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminEmail: string;
  action: string;
  entityType: 'emoji' | 'category' | 'settings' | 'auth';
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface SiteSettingsRecord {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  enableAnalytics: boolean;
  enableLiveUnicodeSync: boolean;
  featuredCategorySlugs: string[];
}

export interface DailyStatsRecord {
  date: string;
  views: number;
  copies: number;
  searches: number;
}

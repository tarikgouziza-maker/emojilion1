// ============================================================================
// In-Memory / Local Node Repository Adapter (For Local Dev & VPS Fallback)
// Implements the identical IRepositoryContainer interface as Cloudflare D1
// ============================================================================

import { 
  IEmojiRepository, 
  ICategoryRepository, 
  IAdminRepository, 
  ISessionRepository, 
  IAuditRepository, 
  ISettingsRepository, 
  IAnalyticsRepository,
  IRepositoryContainer,
  EmojiQueryOptions
} from './types.ts';
import { 
  EmojiRecord, 
  CategoryRecord, 
  AdminUserRecord, 
  SessionRecord, 
  AuditLogRecord, 
  SiteSettingsRecord 
} from '../types.ts';
import { ALL_EMOJIS, searchEmojis } from '../../src/data/emojis/index.ts';
import { OFFICIAL_CATEGORIES } from '../../src/data/unicodeCategories.ts';
import { generateId } from '../crypto.ts';

export class MemoryEmojiRepository implements IEmojiRepository {
  private emojiMap = new Map<string, EmojiRecord>();

  constructor(initialData?: EmojiRecord[]) {
    const list = initialData || ALL_EMOJIS.map(e => ({
      id: e.slug || e.id,
      character: e.emoji || (e as any).character,
      name: e.name,
      unicodeName: (e as any).unicodeName,
      cldrShortName: (e as any).cldrShortName,
      codePoint: e.codePoint,
      codePointHex: e.codePointHex,
      slug: e.slug,
      category: e.category,
      subcategory: e.subcategory,
      keywords: e.keywords || [],
      description: e.description,
      customDescription: e.customDescription,
      seoTitle: e.seoTitle,
      isFeatured: e.isFeatured,
      isNew: e.isNew,
      isPopular: (e as any).isPopular,
      status: e.status || 'active',
      viewsCount: (e as any).viewsCount || e.viewCount || 0,
      copiesCount: (e as any).copiesCount || e.copyCount || 0,
      sortOrder: (e as any).sortOrder,
      createdAt: (e as any).createdAt || new Date().toISOString()
    }));

    list.forEach(e => {
      this.emojiMap.set(e.slug, e);
      this.emojiMap.set(e.id, e);
    });
  }

  async getAll(options: EmojiQueryOptions = {}): Promise<{ items: EmojiRecord[]; total: number }> {
    const { query, category, subcategory, gender, limit = 60, offset = 0, includeHidden = false } = options;

    let list = Array.from(new Set(this.emojiMap.values()));

    if (!includeHidden) {
      list = list.filter(e => e.status !== 'hidden');
    }

    if (query && query.trim()) {
      const searchResults = searchEmojis(query, 500);
      const searchSlugs = new Set(searchResults.map(s => s.slug));
      list = list.filter(e => searchSlugs.has(e.slug));
    }

    if (category) {
      list = list.filter(e => e.category === category);
    }

    if (subcategory) {
      list = list.filter(e => e.subcategory === subcategory);
    }

    if (gender) {
      if (gender === 'male') {
        list = list.filter(e => e.name.toLowerCase().includes('man') || e.keywords.includes('man'));
      } else if (gender === 'female') {
        list = list.filter(e => e.name.toLowerCase().includes('woman') || e.keywords.includes('woman'));
      }
    }

    const total = list.length;
    const items = list.slice(offset, offset + limit);

    return { items, total };
  }

  async getBySlug(slug: string): Promise<EmojiRecord | null> {
    return this.emojiMap.get(slug) || null;
  }

  async getById(id: string): Promise<EmojiRecord | null> {
    return this.emojiMap.get(id) || null;
  }

  async create(emoji: EmojiRecord): Promise<EmojiRecord> {
    this.emojiMap.set(emoji.id, emoji);
    this.emojiMap.set(emoji.slug, emoji);
    return emoji;
  }

  async update(id: string, updates: Partial<EmojiRecord>): Promise<EmojiRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged: EmojiRecord = { ...existing, ...updates };
    this.emojiMap.set(merged.id, merged);
    this.emojiMap.set(merged.slug, merged);
    return merged;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    this.emojiMap.delete(existing.id);
    this.emojiMap.delete(existing.slug);
    return true;
  }

  async count(options: { activeOnly?: boolean } = {}): Promise<number> {
    const unique = Array.from(new Set(this.emojiMap.values()));
    if (options.activeOnly) {
      return unique.filter(e => e.status !== 'hidden').length;
    }
    return unique.length;
  }

  async trackView(slug: string): Promise<void> {
    const emoji = this.emojiMap.get(slug);
    if (emoji) {
      emoji.viewsCount = (emoji.viewsCount || 0) + 1;
    }
  }

  async trackCopy(slug: string): Promise<void> {
    const emoji = this.emojiMap.get(slug);
    if (emoji) {
      emoji.copiesCount = (emoji.copiesCount || 0) + 1;
    }
  }

  async trackSearch(_query: string): Promise<void> {
    // Search analytics
  }
}

export class MemoryCategoryRepository implements ICategoryRepository {
  private categories: CategoryRecord[];

  constructor(initialData?: CategoryRecord[]) {
    this.categories = initialData || (OFFICIAL_CATEGORIES as any);
  }

  async getAll(): Promise<CategoryRecord[]> {
    return [...this.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.categories.find(c => c.slug === slug) || null;
  }

  async create(category: CategoryRecord): Promise<CategoryRecord> {
    this.categories.push(category);
    return category;
  }

  async update(slug: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
    const idx = this.categories.findIndex(c => c.slug === slug);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...updates };
    return this.categories[idx];
  }

  async delete(slug: string): Promise<boolean> {
    const initialLen = this.categories.length;
    this.categories = this.categories.filter(c => c.slug !== slug);
    return this.categories.length < initialLen;
  }
}

export class MemoryAdminRepository implements IAdminRepository {
  private admins: AdminUserRecord[] = [];

  constructor(initialAdmins?: AdminUserRecord[]) {
    if (initialAdmins) {
      this.admins = [...initialAdmins];
    }
  }

  async getByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getById(id: string): Promise<AdminUserRecord | null> {
    return this.admins.find(a => a.id === id) || null;
  }

  async create(admin: AdminUserRecord): Promise<AdminUserRecord> {
    this.admins.push(admin);
    return admin;
  }

  async update(id: string, updates: Partial<AdminUserRecord>): Promise<AdminUserRecord | null> {
    const idx = this.admins.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.admins[idx] = { ...this.admins[idx], ...updates };
    return this.admins[idx];
  }
}

export class MemorySessionRepository implements ISessionRepository {
  private sessions = new Map<string, SessionRecord>();

  async create(session: SessionRecord): Promise<SessionRecord> {
    this.sessions.set(session.token, session);
    return session;
  }

  async getByToken(token: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  async delete(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async deleteExpired(): Promise<void> {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.sessions.delete(token);
      }
    }
  }
}

export class MemoryAuditRepository implements IAuditRepository {
  private logs: AuditLogRecord[] = [];

  async log(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.logs.unshift(record);
    return record;
  }

  async getRecent(limit = 50): Promise<AuditLogRecord[]> {
    return this.logs.slice(0, limit);
  }
}

export class MemorySettingsRepository implements ISettingsRepository {
  private settings: SiteSettingsRecord = {
    siteName: 'EmojiLion',
    siteDescription: 'The modern, authoritative emoji encyclopedia and search reference.',
    contactEmail: 'contact@emojilion.com',
    enableAnalytics: true,
    enableLiveUnicodeSync: true,
    featuredCategorySlugs: ['smileys-emotion', 'animals-nature', 'food-drink', 'activities']
  };

  async getSettings(): Promise<SiteSettingsRecord> {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<SiteSettingsRecord>): Promise<SiteSettingsRecord> {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }
}

export class MemoryAnalyticsRepository implements IAnalyticsRepository {
  constructor(private emojiRepo: MemoryEmojiRepository) {}

  async getOverview() {
    const { items } = await this.emojiRepo.getAll({ limit: 4000, includeHidden: true });
    const totalViews = items.reduce((acc, e) => acc + (e.viewsCount || 0), 0);
    const totalCopies = items.reduce((acc, e) => acc + (e.copiesCount || 0), 0);

    const topCopies = [...items]
      .filter(e => e.copiesCount > 0)
      .sort((a, b) => b.copiesCount - a.copiesCount)
      .slice(0, 8)
      .map(e => ({ slug: e.slug, name: e.name, emoji: e.character, count: e.copiesCount }));

    const topViews = [...items]
      .filter(e => e.viewsCount > 0)
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 8)
      .map(e => ({ slug: e.slug, name: e.name, emoji: e.character, count: e.viewsCount }));

    return {
      totalViews,
      totalCopies,
      totalSearches: 420,
      topCopies,
      topViews,
      topSearches: [],
      dailyViews: []
    };
  }
}

export function createMemoryRepositories(initialData?: {
  emojis?: EmojiRecord[];
  categories?: CategoryRecord[];
  admins?: AdminUserRecord[];
}): IRepositoryContainer {
  const emojiRepo = new MemoryEmojiRepository(initialData?.emojis);
  return {
    emojis: emojiRepo,
    categories: new MemoryCategoryRepository(initialData?.categories),
    admins: new MemoryAdminRepository(initialData?.admins),
    sessions: new MemorySessionRepository(),
    audit: new MemoryAuditRepository(),
    settings: new MemorySettingsRepository(),
    analytics: new MemoryAnalyticsRepository(emojiRepo)
  };
}

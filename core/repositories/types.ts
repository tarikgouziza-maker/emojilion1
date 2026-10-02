// ============================================================================
// Portable Database Repository Contracts
// Enables seamless switching between Cloudflare D1 and PostgreSQL / MySQL / SQLite
// ============================================================================

import { 
  EmojiRecord, 
  CategoryRecord, 
  AdminUserRecord, 
  SessionRecord, 
  AuditLogRecord, 
  SiteSettingsRecord 
} from '../types.ts';

export interface EmojiQueryOptions {
  query?: string;
  category?: string;
  subcategory?: string;
  gender?: string;
  limit?: number;
  offset?: number;
  includeHidden?: boolean;
}

export interface IEmojiRepository {
  getAll(options?: EmojiQueryOptions): Promise<{ items: EmojiRecord[]; total: number }>;
  getBySlug(slug: string): Promise<EmojiRecord | null>;
  getById(id: string): Promise<EmojiRecord | null>;
  create(emoji: EmojiRecord): Promise<EmojiRecord>;
  update(id: string, updates: Partial<EmojiRecord>): Promise<EmojiRecord | null>;
  delete(id: string): Promise<boolean>;
  count(options?: { activeOnly?: boolean }): Promise<number>;
  trackView(slug: string): Promise<void>;
  trackCopy(slug: string): Promise<void>;
  trackSearch(query: string): Promise<void>;
}

export interface ICategoryRepository {
  getAll(): Promise<CategoryRecord[]>;
  getBySlug(slug: string): Promise<CategoryRecord | null>;
  create(category: CategoryRecord): Promise<CategoryRecord>;
  update(slug: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null>;
  delete(slug: string): Promise<boolean>;
}

export interface IAdminRepository {
  getByEmail(email: string): Promise<AdminUserRecord | null>;
  getById(id: string): Promise<AdminUserRecord | null>;
  create(admin: AdminUserRecord): Promise<AdminUserRecord>;
  update(id: string, updates: Partial<AdminUserRecord>): Promise<AdminUserRecord | null>;
}

export interface ISessionRepository {
  create(session: SessionRecord): Promise<SessionRecord>;
  getByToken(token: string): Promise<SessionRecord | null>;
  delete(token: string): Promise<boolean>;
  deleteExpired(): Promise<void>;
}

export interface IAuditRepository {
  log(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<AuditLogRecord>;
  getRecent(limit?: number): Promise<AuditLogRecord[]>;
}

export interface ISettingsRepository {
  getSettings(): Promise<SiteSettingsRecord>;
  updateSettings(updates: Partial<SiteSettingsRecord>): Promise<SiteSettingsRecord>;
}

export interface IAnalyticsRepository {
  getOverview(): Promise<{
    totalViews: number;
    totalCopies: number;
    totalSearches: number;
    topCopies: Array<{ slug: string; name: string; emoji: string; count: number }>;
    topViews: Array<{ slug: string; name: string; emoji: string; count: number }>;
    topSearches: Array<{ query: string; count: number }>;
    dailyViews: Array<{ date: string; views: number; copies: number }>;
  }>;
}

export interface IRepositoryContainer {
  emojis: IEmojiRepository;
  categories: ICategoryRepository;
  admins: IAdminRepository;
  sessions: ISessionRepository;
  audit: IAuditRepository;
  settings: ISettingsRepository;
  analytics: IAnalyticsRepository;
}

// ============================================================================
// Cloudflare D1 Database Repository Implementation
// Runs directly inside Cloudflare Workers / Pages Functions
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
import { generateId } from '../crypto.ts';

// Minimal Cloudflare D1 interface
export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<{ success: boolean; meta: any }>;
  all<T = unknown>(): Promise<{ results?: T[]; success: boolean }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

// ----------------------------------------------------------------------------
// Emojis D1 Repository
// ----------------------------------------------------------------------------
export class D1EmojiRepository implements IEmojiRepository {
  constructor(private db: D1Database) {}

  private mapRow(row: any): EmojiRecord {
    return {
      id: row.id,
      character: row.character,
      name: row.name,
      unicodeName: row.unicode_name,
      cldrShortName: row.cldr_short_name,
      codePoint: row.code_point,
      codePointHex: row.code_point_hex,
      slug: row.slug,
      category: row.category,
      subcategory: row.subcategory,
      keywords: typeof row.keywords_json === 'string' ? JSON.parse(row.keywords_json || '[]') : (row.keywords || []),
      description: row.description,
      customDescription: row.custom_description,
      seoTitle: row.seo_title,
      isFeatured: Boolean(row.is_featured),
      isNew: Boolean(row.is_new),
      isPopular: Boolean(row.is_popular),
      status: row.status === 'hidden' ? 'hidden' : 'active',
      viewsCount: Number(row.views_count || 0),
      copiesCount: Number(row.copies_count || 0),
      sortOrder: row.sort_order ? Number(row.sort_order) : undefined,
      createdAt: row.created_at
    };
  }

  async getAll(options: EmojiQueryOptions = {}): Promise<{ items: EmojiRecord[]; total: number }> {
    const { query, category, subcategory, gender, limit = 60, offset = 0, includeHidden = false } = options;
    const conditions: string[] = [];
    const params: any[] = [];

    if (!includeHidden) {
      conditions.push("(status IS NULL OR status != 'hidden')");
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (subcategory) {
      conditions.push('subcategory = ?');
      params.push(subcategory);
    }

    if (gender) {
      if (gender === 'male') {
        conditions.push("(name LIKE '%Man%' OR keywords_json LIKE '%\"man\"%')");
      } else if (gender === 'female') {
        conditions.push("(name LIKE '%Woman%' OR keywords_json LIKE '%\"woman\"%')");
      }
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      conditions.push(`(
        character = ? OR 
        LOWER(name) LIKE ? OR 
        slug LIKE ? OR 
        LOWER(keywords_json) LIKE ? OR
        code_point_hex LIKE ?
      )`);
      params.push(q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) as count FROM emojis ${whereClause}`;
    const countStmt = this.db.prepare(countSql).bind(...params);
    const countRes = await countStmt.first<{ count: number }>();
    const total = countRes?.count || 0;

    // Items with relevance ordering
    let orderClause = 'ORDER BY is_featured DESC, views_count DESC, id ASC';
    if (query && query.trim()) {
      orderClause = `ORDER BY 
        CASE 
          WHEN character = ? THEN 1
          WHEN LOWER(name) = ? THEN 2
          WHEN slug = ? THEN 3
          WHEN LOWER(name) LIKE ? THEN 4
          ELSE 5
        END,
        is_featured DESC, views_count DESC`;
      const q = query.trim().toLowerCase();
      params.push(q, q, q, `${q}%`);
    }

    const selectSql = `SELECT * FROM emojis ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(selectSql).bind(...params);
    const res = await stmt.all<any>();
    const items = (res.results || []).map(row => this.mapRow(row));

    return { items, total };
  }

  async getBySlug(slug: string): Promise<EmojiRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM emojis WHERE slug = ? LIMIT 1').bind(slug);
    const row = await stmt.first<any>();
    return row ? this.mapRow(row) : null;
  }

  async getById(id: string): Promise<EmojiRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM emojis WHERE id = ? OR slug = ? LIMIT 1').bind(id, id);
    const row = await stmt.first<any>();
    return row ? this.mapRow(row) : null;
  }

  async create(emoji: EmojiRecord): Promise<EmojiRecord> {
    const sql = `
      INSERT INTO emojis (
        id, character, name, unicode_name, cldr_short_name, code_point, 
        code_point_hex, slug, category, subcategory, keywords_json, 
        description, custom_description, seo_title, is_featured, is_new, 
        is_popular, status, views_count, copies_count, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const createdAt = emoji.createdAt || new Date().toISOString();
    await this.db.prepare(sql).bind(
      emoji.id,
      emoji.character,
      emoji.name,
      emoji.unicodeName || emoji.name.toUpperCase(),
      emoji.cldrShortName || emoji.name.toLowerCase(),
      emoji.codePoint,
      emoji.codePointHex || '',
      emoji.slug,
      emoji.category,
      emoji.subcategory,
      JSON.stringify(emoji.keywords || []),
      emoji.description || '',
      emoji.customDescription || '',
      emoji.seoTitle || '',
      emoji.isFeatured ? 1 : 0,
      emoji.isNew ? 1 : 0,
      emoji.isPopular ? 1 : 0,
      emoji.status || 'active',
      emoji.viewsCount || 0,
      emoji.copiesCount || 0,
      emoji.sortOrder || 0,
      createdAt
    ).run();

    return { ...emoji, createdAt };
  }

  async update(id: string, updates: Partial<EmojiRecord>): Promise<EmojiRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged: EmojiRecord = { ...existing, ...updates };

    const sql = `
      UPDATE emojis SET 
        name = ?, slug = ?, category = ?, subcategory = ?, keywords_json = ?,
        custom_description = ?, seo_title = ?, is_featured = ?, status = ?
      WHERE id = ? OR slug = ?
    `;

    await this.db.prepare(sql).bind(
      merged.name,
      merged.slug,
      merged.category,
      merged.subcategory,
      JSON.stringify(merged.keywords || []),
      merged.customDescription || '',
      merged.seoTitle || '',
      merged.isFeatured ? 1 : 0,
      merged.status || 'active',
      id,
      id
    ).run();

    return merged;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM emojis WHERE id = ? OR slug = ?').bind(id, id).run();
    return res.success;
  }

  async count(options: { activeOnly?: boolean } = {}): Promise<number> {
    const sql = options.activeOnly 
      ? "SELECT COUNT(*) as count FROM emojis WHERE status != 'hidden'" 
      : 'SELECT COUNT(*) as count FROM emojis';
    const res = await this.db.prepare(sql).first<{ count: number }>();
    return res?.count || 0;
  }

  async trackView(slug: string): Promise<void> {
    await this.db.prepare('UPDATE emojis SET views_count = views_count + 1 WHERE slug = ?').bind(slug).run();
    const today = new Date().toISOString().split('T')[0];
    await this.db.prepare(`
      INSERT INTO daily_stats (date, views, copies, searches) VALUES (?, 1, 0, 0)
      ON CONFLICT(date) DO UPDATE SET views = views + 1
    `).bind(today).run();
  }

  async trackCopy(slug: string): Promise<void> {
    await this.db.prepare('UPDATE emojis SET copies_count = copies_count + 1 WHERE slug = ?').bind(slug).run();
    const today = new Date().toISOString().split('T')[0];
    await this.db.prepare(`
      INSERT INTO daily_stats (date, views, copies, searches) VALUES (?, 0, 1, 0)
      ON CONFLICT(date) DO UPDATE SET copies = copies + 1
    `).bind(today).run();
  }

  async trackSearch(query: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.db.prepare(`
      INSERT INTO daily_stats (date, views, copies, searches) VALUES (?, 0, 0, 1)
      ON CONFLICT(date) DO UPDATE SET searches = searches + 1
    `).bind(today).run();
  }
}

// ----------------------------------------------------------------------------
// Categories D1 Repository
// ----------------------------------------------------------------------------
export class D1CategoryRepository implements ICategoryRepository {
  constructor(private db: D1Database) {}

  private mapRow(row: any): CategoryRecord {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      order: Number(row.sort_order || 0),
      emojiCount: Number(row.emoji_count || 0),
      subcategories: typeof row.subcategories_json === 'string' ? JSON.parse(row.subcategories_json || '[]') : (row.subcategories || [])
    };
  }

  async getAll(): Promise<CategoryRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM categories ORDER BY sort_order ASC');
    const res = await stmt.all<any>();
    return (res.results || []).map(r => this.mapRow(r));
  }

  async getBySlug(slug: string): Promise<CategoryRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE slug = ? LIMIT 1').bind(slug);
    const row = await stmt.first<any>();
    return row ? this.mapRow(row) : null;
  }

  async create(category: CategoryRecord): Promise<CategoryRecord> {
    const sql = `
      INSERT INTO categories (id, name, slug, description, icon, sort_order, emoji_count, subcategories_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(sql).bind(
      category.id,
      category.name,
      category.slug,
      category.description || '',
      category.icon || '📁',
      category.order || 0,
      category.emojiCount || 0,
      JSON.stringify(category.subcategories || [])
    ).run();

    return category;
  }

  async update(slug: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
    const existing = await this.getBySlug(slug);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const sql = `
      UPDATE categories SET 
        name = ?, description = ?, icon = ?, sort_order = ?, subcategories_json = ?
      WHERE slug = ?
    `;
    await this.db.prepare(sql).bind(
      merged.name,
      merged.description || '',
      merged.icon || '📁',
      merged.order || 0,
      JSON.stringify(merged.subcategories || []),
      slug
    ).run();

    return merged;
  }

  async delete(slug: string): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM categories WHERE slug = ?').bind(slug).run();
    return res.success;
  }
}

// ----------------------------------------------------------------------------
// Admin User D1 Repository
// ----------------------------------------------------------------------------
export class D1AdminRepository implements IAdminRepository {
  constructor(private db: D1Database) {}

  async getByEmail(email: string): Promise<AdminUserRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?) LIMIT 1').bind(email);
    const row = await stmt.first<any>();
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      role: row.role || 'superadmin',
      createdAt: row.created_at
    };
  }

  async getById(id: string): Promise<AdminUserRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE id = ? LIMIT 1').bind(id);
    const row = await stmt.first<any>();
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      role: row.role || 'superadmin',
      createdAt: row.created_at
    };
  }

  async create(admin: AdminUserRecord): Promise<AdminUserRecord> {
    const sql = `
      INSERT INTO admins (id, email, name, password_hash, password_salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(sql).bind(
      admin.id,
      admin.email,
      admin.name,
      admin.passwordHash,
      admin.passwordSalt,
      admin.role,
      admin.createdAt
    ).run();
    return admin;
  }

  async update(id: string, updates: Partial<AdminUserRecord>): Promise<AdminUserRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const sql = `
      UPDATE admins SET email = ?, name = ?, password_hash = ?, password_salt = ?, role = ?
      WHERE id = ?
    `;
    await this.db.prepare(sql).bind(
      merged.email,
      merged.name,
      merged.passwordHash,
      merged.passwordSalt,
      merged.role,
      id
    ).run();
    return merged;
  }
}

// ----------------------------------------------------------------------------
// Session D1 Repository
// ----------------------------------------------------------------------------
export class D1SessionRepository implements ISessionRepository {
  constructor(private db: D1Database) {}

  async create(session: SessionRecord): Promise<SessionRecord> {
    const sql = `
      INSERT INTO sessions (token, admin_id, email, role, name, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(sql).bind(
      session.token,
      session.adminId,
      session.email,
      session.role,
      session.name,
      session.expiresAt,
      session.createdAt
    ).run();
    return session;
  }

  async getByToken(token: string): Promise<SessionRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE token = ? LIMIT 1').bind(token);
    const row = await stmt.first<any>();
    if (!row) return null;

    // Check expiration
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await this.delete(token);
      return null;
    }

    return {
      token: row.token,
      adminId: row.admin_id,
      email: row.email,
      role: row.role,
      name: row.name,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  }

  async delete(token: string): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return res.success;
  }

  async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
  }
}

// ----------------------------------------------------------------------------
// Audit Logs D1 Repository
// ----------------------------------------------------------------------------
export class D1AuditRepository implements IAuditRepository {
  constructor(private db: D1Database) {}

  async log(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      ...entry
    };

    const sql = `
      INSERT INTO audit_logs (id, admin_email, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(sql).bind(
      record.id,
      record.adminEmail,
      record.action,
      record.entityType,
      record.entityId || '',
      record.details || '',
      record.timestamp
    ).run();

    return record;
  }

  async getRecent(limit = 50): Promise<AuditLogRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').bind(limit);
    const res = await stmt.all<any>();
    return (res.results || []).map(r => ({
      id: r.id,
      adminEmail: r.admin_email,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      details: r.details,
      timestamp: r.timestamp
    }));
  }
}

// ----------------------------------------------------------------------------
// Site Settings D1 Repository
// ----------------------------------------------------------------------------
export class D1SettingsRepository implements ISettingsRepository {
  constructor(private db: D1Database) {}

  private defaultSettings: SiteSettingsRecord = {
    siteName: 'EmojiLion',
    siteDescription: 'The modern, authoritative emoji encyclopedia and search reference.',
    contactEmail: 'contact@emojilion.com',
    enableAnalytics: true,
    enableLiveUnicodeSync: true,
    featuredCategorySlugs: ['smileys-emotion', 'animals-nature', 'food-drink', 'activities']
  };

  async getSettings(): Promise<SiteSettingsRecord> {
    const stmt = this.db.prepare('SELECT value FROM site_settings WHERE key = ? LIMIT 1').bind('global');
    const row = await stmt.first<any>();
    if (!row || !row.value) return this.defaultSettings;
    try {
      return { ...this.defaultSettings, ...JSON.parse(row.value) };
    } catch {
      return this.defaultSettings;
    }
  }

  async updateSettings(updates: Partial<SiteSettingsRecord>): Promise<SiteSettingsRecord> {
    const current = await this.getSettings();
    const merged = { ...current, ...updates };
    const sql = `
      INSERT INTO site_settings (key, value) VALUES ('global', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;
    await this.db.prepare(sql).bind(JSON.stringify(merged)).run();
    return merged;
  }
}

// ----------------------------------------------------------------------------
// Analytics D1 Repository
// ----------------------------------------------------------------------------
export class D1AnalyticsRepository implements IAnalyticsRepository {
  constructor(private db: D1Database) {}

  async getOverview() {
    const totals = await this.db.prepare(`
      SELECT 
        COALESCE(SUM(views), 0) as totalViews,
        COALESCE(SUM(copies), 0) as totalCopies,
        COALESCE(SUM(searches), 0) as totalSearches
      FROM daily_stats
    `).first<any>();

    const topCopiesRows = await this.db.prepare(`
      SELECT slug, name, character as emoji, copies_count as count
      FROM emojis 
      WHERE copies_count > 0 
      ORDER BY copies_count DESC LIMIT 8
    `).all<any>();

    const topViewsRows = await this.db.prepare(`
      SELECT slug, name, character as emoji, views_count as count
      FROM emojis 
      WHERE views_count > 0 
      ORDER BY views_count DESC LIMIT 8
    `).all<any>();

    const dailyRows = await this.db.prepare(`
      SELECT date, views, copies 
      FROM daily_stats 
      ORDER BY date DESC LIMIT 14
    `).all<any>();

    return {
      totalViews: totals?.totalViews || 0,
      totalCopies: totals?.totalCopies || 0,
      totalSearches: totals?.totalSearches || 0,
      topCopies: topCopiesRows.results || [],
      topViews: topViewsRows.results || [],
      topSearches: [],
      dailyViews: (dailyRows.results || []).reverse()
    };
  }
}

// Factory function to create D1 repository container
export function createD1Repositories(db: D1Database): IRepositoryContainer {
  return {
    emojis: new D1EmojiRepository(db),
    categories: new D1CategoryRepository(db),
    admins: new D1AdminRepository(db),
    sessions: new D1SessionRepository(db),
    audit: new D1AuditRepository(db),
    settings: new D1SettingsRepository(db),
    analytics: new D1AnalyticsRepository(db)
  };
}

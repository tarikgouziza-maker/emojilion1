import fs from 'fs';
import path from 'path';
import { EmojiItem, CategoryInfo, SiteSettings, AuditLog, SearchLog } from '../src/types/emoji';
import { ALL_EMOJIS, getCategoriesWithCounts } from '../src/data/emojis/index';
import { hashPassword } from './auth';

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: string;
}

export interface DatabaseState {
  emojis: Record<string, EmojiItem>;
  categories: CategoryInfo[];
  adminUsers: AdminUserRecord[];
  auditLogs: AuditLog[];
  searchLogs: Record<string, SearchLog>;
  copyStats: Record<string, number>;
  viewStats: Record<string, number>;
  settings: SiteSettings;
  unicodeSyncStatus: {
    lastSyncDate: string;
    version: string;
    totalEmojis: number;
    status: string;
  };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.initialize();
  }

  private initialize(): DatabaseState {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const defaultAdminHash = hashPassword('AdminPass2026!');
    const defaultAdmin: AdminUserRecord = {
      id: 'admin-1',
      email: 'admin@emojiworld.com',
      name: 'EmojiLion SuperAdmin',
      passwordHash: defaultAdminHash.hash,
      passwordSalt: defaultAdminHash.salt,
      role: 'superadmin',
      createdAt: new Date().toISOString()
    };

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // If parsed is already the DatabaseState with Record<string, EmojiItem>
        let emojiMap: Record<string, EmojiItem> = {};
        if (parsed.emojis) {
          if (Array.isArray(parsed.emojis)) {
            parsed.emojis.forEach((e: any) => {
              const char = e.emoji || e.character;
              emojiMap[e.id || e.slug] = {
                ...e,
                id: e.slug || e.id,
                emoji: char,
                status: e.status || (e.isActive !== false ? 'active' : 'hidden')
              };
            });
          } else {
            Object.values(parsed.emojis).forEach((e: any) => {
              const char = e.emoji || e.character;
              emojiMap[e.id || e.slug] = {
                ...e,
                id: e.slug || e.id,
                emoji: char,
                status: e.status || (e.isActive !== false ? 'active' : 'hidden')
              };
            });
          }
        } else {
          ALL_EMOJIS.forEach(e => {
            emojiMap[e.id] = { ...e, viewCount: 0, copyCount: 0, status: 'active' };
          });
        }

        // Check if admin user exists with valid credentials - only seed default if no valid admin exists
        let adminUsers: AdminUserRecord[] = Array.isArray(parsed.adminUsers)
          ? parsed.adminUsers.filter((a: any) => a.passwordHash && a.passwordSalt)
          : [];
        if (adminUsers.length === 0) {
          adminUsers.push(defaultAdmin);
        }

        const state: DatabaseState = {
          emojis: emojiMap,
          categories: getCategoriesWithCounts(),
          adminUsers,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
          searchLogs: parsed.searchLogs || {
            'heart': { query: 'heart', count: 42, lastSearched: new Date().toISOString() },
            'fire': { query: 'fire', count: 38, lastSearched: new Date().toISOString() },
            'smile': { query: 'smile', count: 31, lastSearched: new Date().toISOString() },
          },
          copyStats: parsed.copyStats || {
            'red-heart': 148,
            'fire': 124,
            'grinning-face': 92,
            'thumbs-up': 88,
          },
          viewStats: parsed.viewStats || {
            'red-heart': 420,
            'fire': 390,
            'grinning-face': 280,
          },
          settings: parsed.settings || {
            siteName: 'EmojiLion',
            siteDescription: 'The modern, fast, comprehensive emoji reference platform with official categories, variations, and quick copy.',
            contactEmail: 'contact@emojiworld.internal',
            defaultOgImage: '/og-image.png',
            enableAnalytics: true,
            enableLiveUnicodeSync: true,
            maintenanceMode: false,
            featuredCategorySlugs: ['smileys-emotion', 'people-body', 'animals-nature', 'food-drink'],
            unicodeVersion: '16.0'
          },
          unicodeSyncStatus: parsed.unicodeSyncStatus || {
            lastSyncDate: new Date().toISOString(),
            version: 'Unicode 16.0 / CLDR 44',
            totalEmojis: Object.keys(emojiMap).length,
            status: 'synced'
          }
        };

        return state;
      } catch (err) {
        console.error('Failed to read database file, initializing fresh database:', err);
      }
    }

    // Initialize initial state
    const emojiMap: Record<string, EmojiItem> = {};
    ALL_EMOJIS.forEach(e => {
      emojiMap[e.id] = { ...e, viewCount: 0, copyCount: 0, status: 'active' };
    });

    const initialState: DatabaseState = {
      emojis: emojiMap,
      categories: getCategoriesWithCounts(),
      adminUsers: [defaultAdmin],
      auditLogs: [
        {
          id: 'log-init',
          adminEmail: 'system',
          action: 'INITIALIZE_DATABASE',
          entityType: 'settings',
          entityId: 'system',
          details: `Imported ${ALL_EMOJIS.length} official emojis across 9 categories.`,
          timestamp: new Date().toISOString()
        }
      ],
      searchLogs: {
        'heart': { query: 'heart', count: 42, lastSearched: new Date().toISOString() },
        'fire': { query: 'fire', count: 38, lastSearched: new Date().toISOString() },
        'smile': { query: 'smile', count: 31, lastSearched: new Date().toISOString() },
      },
      copyStats: {
        'red-heart': 148,
        'fire': 124,
        'grinning-face': 92,
        'thumbs-up': 88,
      },
      viewStats: {
        'red-heart': 420,
        'fire': 390,
        'grinning-face': 280,
      },
      settings: {
        siteName: 'EmojiLion',
        siteDescription: 'The modern, fast, comprehensive emoji reference platform with official categories, variations, and quick copy.',
        contactEmail: 'contact@emojiworld.internal',
        defaultOgImage: '/og-image.png',
        enableAnalytics: true,
        enableLiveUnicodeSync: true,
        maintenanceMode: false,
        featuredCategorySlugs: ['smileys-emotion', 'people-body', 'animals-nature', 'food-drink'],
        unicodeVersion: '16.0'
      },
      unicodeSyncStatus: {
        lastSyncDate: new Date().toISOString(),
        version: 'Unicode 16.0 / CLDR 44',
        totalEmojis: ALL_EMOJIS.length,
        status: 'synced'
      }
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write initial database file:', err);
    }
    return initialState;
  }

  public save(): void {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  // Emojis API
  public getEmojis(): EmojiItem[] {
    return Object.values(this.state.emojis).filter(e => e.status !== 'hidden');
  }

  public getAllEmojisAdmin(): EmojiItem[] {
    return Object.values(this.state.emojis);
  }

  public getEmojiBySlug(slug: string): EmojiItem | undefined {
    return Object.values(this.state.emojis).find(e => e.slug === slug);
  }

  public updateEmoji(id: string, updates: Partial<EmojiItem>, adminEmail: string): EmojiItem | null {
    const emoji = this.state.emojis[id] || Object.values(this.state.emojis).find(e => e.slug === id);
    if (!emoji) return null;
    const realId = emoji.id;
    const updated = {
      ...emoji,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.state.emojis[realId] = updated;
    this.addAuditLog({
      adminEmail,
      action: 'UPDATE_EMOJI',
      entityType: 'emoji',
      entityId: realId,
      details: `Updated emoji ${emoji.emoji || (emoji as any).character} (${emoji.name})`
    });
    this.save();
    return updated;
  }

  // Categories API
  public getCategories(): CategoryInfo[] {
    return this.state.categories;
  }

  public updateCategory(slug: string, updates: Partial<CategoryInfo>, adminEmail: string): CategoryInfo | null {
    const catIndex = this.state.categories.findIndex(c => c.slug === slug);
    if (catIndex === -1) return null;
    this.state.categories[catIndex] = {
      ...this.state.categories[catIndex],
      ...updates
    };
    this.addAuditLog({
      adminEmail,
      action: 'UPDATE_CATEGORY',
      entityType: 'category',
      entityId: slug,
      details: `Updated category ${this.state.categories[catIndex].name}`
    });
    this.save();
    return this.state.categories[catIndex];
  }

  // Analytics API
  public trackView(slug: string): void {
    if (!this.state.settings.enableAnalytics) return;
    this.state.viewStats[slug] = (this.state.viewStats[slug] || 0) + 1;
    if (this.state.emojis[slug]) {
      this.state.emojis[slug].viewCount = (this.state.emojis[slug].viewCount || 0) + 1;
    }
  }

  public trackCopy(slug: string): void {
    if (!this.state.settings.enableAnalytics) return;
    this.state.copyStats[slug] = (this.state.copyStats[slug] || 0) + 1;
    if (this.state.emojis[slug]) {
      this.state.emojis[slug].copyCount = (this.state.emojis[slug].copyCount || 0) + 1;
    }
  }

  public trackSearch(query: string): void {
    if (!this.state.settings.enableAnalytics) return;
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return;
    if (!this.state.searchLogs[clean]) {
      this.state.searchLogs[clean] = { query: clean, count: 1, lastSearched: new Date().toISOString() };
    } else {
      this.state.searchLogs[clean].count += 1;
      this.state.searchLogs[clean].lastSearched = new Date().toISOString();
    }
  }

  public getAnalytics() {
    const topSearches = Object.values(this.state.searchLogs)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topCopies = Object.entries(this.state.copyStats)
      .map(([slug, count]) => {
        const emoji = this.getEmojiBySlug(slug);
        return { slug, count, emoji: emoji?.emoji || (emoji as any)?.character || '🔥', name: emoji?.name || slug };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topViews = Object.entries(this.state.viewStats)
      .map(([slug, count]) => {
        const emoji = this.getEmojiBySlug(slug);
        return { slug, count, emoji: emoji?.emoji || (emoji as any)?.character || '😃', name: emoji?.name || slug };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      topSearches,
      topCopies,
      topViews,
      totalSearches: Object.values(this.state.searchLogs).reduce((acc, s) => acc + s.count, 0),
      totalCopies: Object.values(this.state.copyStats).reduce((acc, c) => acc + c, 0),
      totalViews: Object.values(this.state.viewStats).reduce((acc, v) => acc + v, 0),
    };
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  // Settings
  public getSettings(): SiteSettings {
    return this.state.settings;
  }

  public updateSettings(updates: Partial<SiteSettings>, adminEmail: string): SiteSettings {
    this.state.settings = { ...this.state.settings, ...updates };
    this.addAuditLog({
      adminEmail,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      entityId: 'global',
      details: 'Updated global site settings'
    });
    this.save();
    return this.state.settings;
  }

  // Admin users
  public getAdminByEmail(email: string): AdminUserRecord | undefined {
    return this.state.adminUsers.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminById(id: string): AdminUserRecord | undefined {
    return this.state.adminUsers.find(a => a.id === id);
  }

  public updateAdminCredentials(
    id: string,
    updates: { email?: string; passwordHash?: string; passwordSalt?: string },
    adminEmail: string
  ): AdminUserRecord | null {
    const adminIndex = this.state.adminUsers.findIndex(a => a.id === id);
    if (adminIndex === -1) return null;

    const current = this.state.adminUsers[adminIndex];
    const updated: AdminUserRecord = {
      ...current,
      ...(updates.email ? { email: updates.email } : {}),
      ...(updates.passwordHash ? { passwordHash: updates.passwordHash } : {}),
      ...(updates.passwordSalt ? { passwordSalt: updates.passwordSalt } : {})
    };

    this.state.adminUsers[adminIndex] = updated;
    this.addAuditLog({
      adminEmail,
      action: 'UPDATE_ADMIN_ACCOUNT',
      entityType: 'settings',
      entityId: id,
      details: `Updated admin credentials for ${updated.email}`
    });
    this.save();
    return updated;
  }

  // Sync state
  public getSyncStatus() {
    return this.state.unicodeSyncStatus;
  }

  public updateSyncStatus(status: { version: string; totalEmojis: number; status: string }) {
    this.state.unicodeSyncStatus = {
      lastSyncDate: new Date().toISOString(),
      ...status
    };
    this.save();
  }
}

export const db = new Database();

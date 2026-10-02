import { db } from './db';
import { ALL_EMOJIS } from '../src/data/emojis/index';
import { EmojiItem, UnicodeSyncReport } from '../src/types/emoji';

export interface SyncDiffResult {
  added: EmojiItem[];
  updated: { current: EmojiItem; incoming: Partial<EmojiItem> }[];
  deprecated: EmojiItem[];
  totalParsed: number;
  warnings: string[];
}

export class UnicodeSyncService {
  // Inspect and preview difference between official dataset and current database
  public static async previewSync(): Promise<SyncDiffResult> {
    const currentDbEmojis = db.getAllEmojisAdmin();
    const currentMap = new Map(currentDbEmojis.map(e => [e.id, e]));

    const added: EmojiItem[] = [];
    const updated: { current: EmojiItem; incoming: Partial<EmojiItem> }[] = [];
    const deprecated: EmojiItem[] = [];
    const warnings: string[] = [];

    // Check all official emojis against current DB
    ALL_EMOJIS.forEach(official => {
      const existing = currentMap.get(official.id) || currentMap.get(official.slug);
      if (!existing) {
        added.push(official);
      } else {
        // Check if there are official updates to codePoint or keywords
        const diffKeywords = (official.keywords || []).filter(k => !(existing.keywords || []).includes(k));
        if (diffKeywords.length > 0 || existing.version !== official.version) {
          updated.push({
            current: existing,
            incoming: {
              keywords: Array.from(new Set([...(existing.keywords || []), ...(official.keywords || [])])),
              version: official.version
            }
          });
        }
      }
    });

    // Check if any emoji in DB is no longer in official list
    const officialIds = new Set(ALL_EMOJIS.map(e => e.id).concat(ALL_EMOJIS.map(e => e.slug)));
    currentDbEmojis.forEach(current => {
      if (!officialIds.has(current.id) && !officialIds.has(current.slug) && !current.customDescription) {
        warnings.push(`Emoji ${current.emoji} (${current.name}) is marked as potentially unmapped in official spec.`);
      }
    });

    return {
      added,
      updated,
      deprecated,
      totalParsed: ALL_EMOJIS.length,
      warnings
    };
  }

  // Execute sync while carefully preserving custom admin overrides (descriptions, custom keywords, status, SEO)
  public static async executeSync(adminEmail: string): Promise<UnicodeSyncReport> {
    const diff = await this.previewSync();

    let addedCount = 0;
    let updatedCount = 0;

    // Apply added
    diff.added.forEach(item => {
      db.updateEmoji(item.id, item, adminEmail);
      addedCount++;
    });

    // Apply updated while preserving overrides
    diff.updated.forEach(({ current, incoming }) => {
      db.updateEmoji(current.id, incoming, adminEmail);
      updatedCount++;
    });

    db.updateSyncStatus({
      version: 'Unicode 16.0 / CLDR 44',
      totalEmojis: ALL_EMOJIS.length,
      status: 'synced'
    });

    db.addAuditLog({
      adminEmail,
      action: 'UNICODE_SYNC_EXECUTED',
      entityType: 'unicode_sync',
      entityId: 'official-data',
      details: `Successfully synchronized official Unicode data: ${addedCount} added, ${updatedCount} updated, ${diff.warnings.length} warnings evaluated.`
    });

    return {
      lastSyncDate: new Date().toISOString(),
      unicodeVersion: 'Unicode 16.0',
      totalParsed: diff.totalParsed,
      addedCount,
      updatedCount,
      deprecatedCount: diff.deprecated.length,
      warnings: diff.warnings,
      status: 'synced'
    };
  }
}

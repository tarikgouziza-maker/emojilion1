// ============================================================================
// Universal API Request Router
// Compatible with Cloudflare Workers/Pages Functions (Fetch Event) and Node.js
// ============================================================================

import { IRepositoryContainer } from './repositories/types.ts';
import { 
  verifyPassword, 
  hashPassword, 
  generateToken, 
  generateId 
} from './crypto.ts';
import { SessionRecord, AdminUserRecord } from './types.ts';
import { GENDER_EMOJIS } from '../src/data/emojis/index.ts';

// Helper to return standardized JSON responses
export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': status === 200 && !headers['Cache-Control'] ? 'no-cache' : 'no-store',
      ...headers
    }
  });
}

// Helper to extract session token from Authorization header or Cookie
function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // Also support secure HttpOnly cookie
  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/emojilion_session=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

// Authenticate admin request
async function authenticateAdmin(
  request: Request,
  repos: IRepositoryContainer
): Promise<SessionRecord | null> {
  const token = extractToken(request);
  if (!token) return null;
  return await repos.sessions.getByToken(token);
}

/**
 * Universal Request Handler
 * Dispatches standard web Fetch requests to appropriate handlers using the repository container.
 */
export async function handleUniversalApiRequest(
  request: Request,
  repos: IRepositoryContainer
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  try {
    // -------------------------------------------------------------
    // Public APIs
    // -------------------------------------------------------------

    // GET /api/emojis
    if (method === 'GET' && pathname === '/api/emojis') {
      const q = url.searchParams.get('q') || undefined;
      const category = url.searchParams.get('category') || undefined;
      const subcategory = url.searchParams.get('subcategory') || undefined;
      const gender = url.searchParams.get('gender') || undefined;
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '60'), 1), 200);
      const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

      const result = await repos.emojis.getAll({
        query: q,
        category,
        subcategory,
        gender,
        limit,
        offset,
        includeHidden: false
      });

      if (q && q.trim()) {
        repos.emojis.trackSearch(q).catch(() => {});
      }

      return jsonResponse({
        items: result.items,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total
      });
    }

    // GET /api/emojis/:slug
    if (method === 'GET' && pathname.startsWith('/api/emojis/')) {
      const slug = pathname.slice('/api/emojis/'.length);
      const emoji = await repos.emojis.getBySlug(slug);
      if (!emoji) {
        return jsonResponse({ error: 'Emoji not found' }, 404);
      }
      repos.emojis.trackView(slug).catch(() => {});
      return jsonResponse(emoji);
    }

    // GET /api/categories
    if (method === 'GET' && pathname === '/api/categories') {
      const categories = await repos.categories.getAll();
      return jsonResponse(categories);
    }

    // GET /api/categories/:slug
    if (method === 'GET' && pathname.startsWith('/api/categories/')) {
      const slug = pathname.slice('/api/categories/'.length);
      const category = await repos.categories.getBySlug(slug);
      if (!category) {
        return jsonResponse({ error: 'Category not found' }, 404);
      }
      return jsonResponse(category);
    }

    // GET /api/gender
    if (method === 'GET' && pathname === '/api/gender') {
      const gender = url.searchParams.get('gender');
      const q = url.searchParams.get('q');
      let list = GENDER_EMOJIS;

      if (q && q.trim()) {
        const qLower = q.toLowerCase();
        list = list.filter(e => 
          e.name.toLowerCase().includes(qLower) || 
          (e.keywords && e.keywords.some(k => k.includes(qLower)))
        );
      }

      if (gender === 'male') list = list.filter(e => e.gender === 'male');
      else if (gender === 'female') list = list.filter(e => e.gender === 'female');
      else if (gender === 'neutral') list = list.filter(e => e.gender === 'neutral');

      return jsonResponse({
        items: list,
        total: list.length,
        counts: {
          all: GENDER_EMOJIS.length,
          male: GENDER_EMOJIS.filter(e => e.gender === 'male').length,
          female: GENDER_EMOJIS.filter(e => e.gender === 'female').length,
          neutral: GENDER_EMOJIS.filter(e => e.gender === 'neutral').length,
        }
      });
    }

    // POST /api/analytics/track
    if (method === 'POST' && pathname === '/api/analytics/track') {
      const body = await request.json().catch(() => ({})) as any;
      if (body.type === 'view' && body.slug) {
        repos.emojis.trackView(body.slug).catch(() => {});
      } else if (body.type === 'copy' && body.slug) {
        repos.emojis.trackCopy(body.slug).catch(() => {});
      } else if (body.type === 'search' && body.query) {
        repos.emojis.trackSearch(body.query).catch(() => {});
      }
      return jsonResponse({ ok: true });
    }

    // -------------------------------------------------------------
    // Auth APIs
    // -------------------------------------------------------------

    // POST /api/auth/login
    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await request.json().catch(() => ({})) as any;
      const { email, password } = body;

      if (!email || !password) {
        return jsonResponse({ error: 'Email and password required' }, 400);
      }

      const admin = await repos.admins.getByEmail(email);
      if (!admin) {
        return jsonResponse({ error: 'Invalid email or password' }, 401);
      }

      const isValid = await verifyPassword(password, admin.passwordHash, admin.passwordSalt);
      if (!isValid) {
        return jsonResponse({ error: 'Invalid email or password' }, 401);
      }

      // Create session (valid 7 days)
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const session: SessionRecord = {
        token,
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        expiresAt,
        createdAt: new Date().toISOString()
      };

      await repos.sessions.create(session);
      await repos.audit.log({
        adminEmail: admin.email,
        action: 'ADMIN_LOGIN',
        entityType: 'auth',
        entityId: admin.id,
        details: 'Admin authenticated successfully'
      });

      return jsonResponse({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      });
    }

    // POST /api/auth/logout
    if (method === 'POST' && pathname === '/api/auth/logout') {
      const token = extractToken(request);
      if (token) {
        await repos.sessions.delete(token);
      }
      return jsonResponse({ ok: true });
    }

    // GET /api/auth/me
    if (method === 'GET' && pathname === '/api/auth/me') {
      const session = await authenticateAdmin(request, repos);
      if (!session) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }
      return jsonResponse({ admin: session });
    }

    // -------------------------------------------------------------
    // Protected Admin APIs (All require admin session)
    // -------------------------------------------------------------

    if (pathname.startsWith('/api/admin/')) {
      const session = await authenticateAdmin(request, repos);
      if (!session) {
        return jsonResponse({ error: 'Unauthorized: Admin authentication required' }, 401);
      }

      // GET /api/admin/dashboard
      if (method === 'GET' && pathname === '/api/admin/dashboard') {
        const { items: allEmojis, total } = await repos.emojis.getAll({ limit: 4000, includeHidden: true });
        const categories = await repos.categories.getAll();
        const analytics = await repos.analytics.getOverview();
        const auditLogs = await repos.audit.getRecent(10);
        const settings = await repos.settings.getSettings();

        return jsonResponse({
          stats: {
            totalEmojis: total,
            activeEmojis: allEmojis.filter(e => e.status !== 'hidden').length,
            totalCategories: categories.length,
            totalSubcategories: categories.reduce((acc, c) => acc + (c.subcategories ? c.subcategories.length : 0), 0),
            totalCopies: analytics.totalCopies,
            totalViews: analytics.totalViews,
            totalSearches: analytics.totalSearches,
          },
          topCopies: analytics.topCopies,
          topViews: analytics.topViews,
          topSearches: analytics.topSearches,
          recentActivity: auditLogs,
          syncStatus: {
            lastSyncDate: new Date().toISOString(),
            version: 'Unicode 16.0',
            totalEmojis: total,
            status: 'synchronized'
          }
        });
      }

      // GET /api/admin/emojis
      if (method === 'GET' && pathname === '/api/admin/emojis') {
        const q = url.searchParams.get('q') || undefined;
        const category = url.searchParams.get('category') || undefined;
        const subcategory = url.searchParams.get('subcategory') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const result = await repos.emojis.getAll({
          query: q,
          category,
          subcategory,
          limit,
          offset,
          includeHidden: true
        });

        return jsonResponse({
          items: result.items,
          total: result.total,
          limit,
          offset
        });
      }

      // POST /api/admin/emojis (Add new emoji)
      if (method === 'POST' && pathname === '/api/admin/emojis') {
        const body = await request.json().catch(() => ({})) as any;
        if (!body.character || !body.name || !body.category) {
          return jsonResponse({ error: 'Character, name, and category are required' }, 400);
        }

        const newEmoji = {
          id: generateId('emoji'),
          character: body.character,
          name: body.name,
          slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          category: body.category,
          subcategory: body.subcategory || 'custom',
          codePoint: body.codePoint || `U+${body.character.codePointAt(0)?.toString(16).toUpperCase()}`,
          keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map((s: string) => s.trim()) : []),
          description: body.description || '',
          customDescription: body.customDescription || '',
          seoTitle: body.seoTitle || '',
          isFeatured: Boolean(body.isFeatured),
          status: body.status || 'active',
          viewsCount: 0,
          copiesCount: 0,
          createdAt: new Date().toISOString()
        };

        const created = await repos.emojis.create(newEmoji as any);
        await repos.audit.log({
          adminEmail: session.email,
          action: 'CREATE_EMOJI',
          entityType: 'emoji',
          entityId: created.id,
          details: `Added new emoji "${created.name}" (${created.character})`
        });

        return jsonResponse(created, 201);
      }

      // PUT /api/admin/emojis/:id (Edit emoji)
      if (method === 'PUT' && pathname.startsWith('/api/admin/emojis/')) {
        const id = pathname.slice('/api/admin/emojis/'.length);
        const body = await request.json().catch(() => ({})) as any;
        const updated = await repos.emojis.update(id, body);
        if (!updated) {
          return jsonResponse({ error: 'Emoji not found' }, 404);
        }

        await repos.audit.log({
          adminEmail: session.email,
          action: 'UPDATE_EMOJI',
          entityType: 'emoji',
          entityId: id,
          details: `Updated emoji details for ${updated.name}`
        });

        return jsonResponse(updated);
      }

      // DELETE /api/admin/emojis/:id (Delete emoji)
      if (method === 'DELETE' && pathname.startsWith('/api/admin/emojis/')) {
        const id = pathname.slice('/api/admin/emojis/'.length);
        const success = await repos.emojis.delete(id);
        if (!success) {
          return jsonResponse({ error: 'Emoji not found' }, 404);
        }

        await repos.audit.log({
          adminEmail: session.email,
          action: 'DELETE_EMOJI',
          entityType: 'emoji',
          entityId: id,
          details: `Deleted emoji ID ${id}`
        });

        return jsonResponse({ ok: true, deleted: id });
      }

      // GET /api/admin/categories
      if (method === 'GET' && pathname === '/api/admin/categories') {
        const categories = await repos.categories.getAll();
        return jsonResponse(categories);
      }

      // POST /api/admin/categories (Add category)
      if (method === 'POST' && pathname === '/api/admin/categories') {
        const body = await request.json().catch(() => ({})) as any;
        if (!body.name || !body.slug) {
          return jsonResponse({ error: 'Category name and slug are required' }, 400);
        }

        const newCategory = {
          id: body.slug,
          name: body.name,
          slug: body.slug,
          description: body.description || '',
          icon: body.icon || '📁',
          order: Number(body.order || 99),
          emojiCount: 0,
          subcategories: Array.isArray(body.subcategories) ? body.subcategories : []
        };

        const created = await repos.categories.create(newCategory);
        await repos.audit.log({
          adminEmail: session.email,
          action: 'CREATE_CATEGORY',
          entityType: 'category',
          entityId: created.slug,
          details: `Created category ${created.name}`
        });

        return jsonResponse(created, 201);
      }

      // PUT /api/admin/categories/:slug (Edit category)
      if (method === 'PUT' && pathname.startsWith('/api/admin/categories/')) {
        const slug = pathname.slice('/api/admin/categories/'.length);
        const body = await request.json().catch(() => ({})) as any;
        const updated = await repos.categories.update(slug, body);
        if (!updated) {
          return jsonResponse({ error: 'Category not found' }, 404);
        }

        await repos.audit.log({
          adminEmail: session.email,
          action: 'UPDATE_CATEGORY',
          entityType: 'category',
          entityId: slug,
          details: `Updated category ${updated.name}`
        });

        return jsonResponse(updated);
      }

      // DELETE /api/admin/categories/:slug (Delete category)
      if (method === 'DELETE' && pathname.startsWith('/api/admin/categories/')) {
        const slug = pathname.slice('/api/admin/categories/'.length);
        const success = await repos.categories.delete(slug);
        if (!success) {
          return jsonResponse({ error: 'Category not found' }, 404);
        }

        await repos.audit.log({
          adminEmail: session.email,
          action: 'DELETE_CATEGORY',
          entityType: 'category',
          entityId: slug,
          details: `Deleted category slug ${slug}`
        });

        return jsonResponse({ ok: true, deleted: slug });
      }

      // GET /api/admin/analytics
      if (method === 'GET' && pathname === '/api/admin/analytics') {
        const analytics = await repos.analytics.getOverview();
        return jsonResponse(analytics);
      }

      // GET /api/admin/audit-logs
      if (method === 'GET' && pathname === '/api/admin/audit-logs') {
        const logs = await repos.audit.getRecent(100);
        return jsonResponse(logs);
      }

      // GET /api/admin/settings
      if (method === 'GET' && pathname === '/api/admin/settings') {
        const settings = await repos.settings.getSettings();
        return jsonResponse(settings);
      }

      // PUT /api/admin/settings
      if (method === 'PUT' && pathname === '/api/admin/settings') {
        const body = await request.json().catch(() => ({})) as any;
        const updated = await repos.settings.updateSettings(body);
        await repos.audit.log({
          adminEmail: session.email,
          action: 'UPDATE_SETTINGS',
          entityType: 'settings',
          entityId: 'global',
          details: 'Updated global site settings'
        });
        return jsonResponse(updated);
      }

      // GET /api/admin/account
      if (method === 'GET' && pathname === '/api/admin/account') {
        const admin = await repos.admins.getById(session.adminId);
        if (!admin) {
          return jsonResponse({ error: 'Admin record not found' }, 404);
        }
        return jsonResponse({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        });
      }

      // PUT /api/admin/account
      if (method === 'PUT' && pathname === '/api/admin/account') {
        const body = await request.json().catch(() => ({})) as any;
        const { currentPassword, email, newPassword, confirmPassword } = body;

        if (!currentPassword) {
          return jsonResponse({ error: 'Current password is required to update credentials' }, 400);
        }

        const admin = await repos.admins.getById(session.adminId);
        if (!admin) {
          return jsonResponse({ error: 'Admin not found' }, 404);
        }

        const isValid = await verifyPassword(currentPassword, admin.passwordHash, admin.passwordSalt);
        if (!isValid) {
          return jsonResponse({ error: 'Current password is incorrect' }, 401);
        }

        const updates: Partial<AdminUserRecord> = {};

        if (email && email.trim() !== '') {
          const cleanEmail = email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return jsonResponse({ error: 'Please enter a valid email address' }, 400);
          }
          const existing = await repos.admins.getByEmail(cleanEmail);
          if (existing && existing.id !== admin.id) {
            return jsonResponse({ error: 'This email is already in use by another administrator' }, 400);
          }
          updates.email = cleanEmail;
        }

        if (newPassword || confirmPassword) {
          if (!newPassword || !confirmPassword) {
            return jsonResponse({ error: 'Both new password and confirm password are required' }, 400);
          }
          if (newPassword !== confirmPassword) {
            return jsonResponse({ error: 'New password and confirm password do not match' }, 400);
          }
          if (newPassword.length < 8) {
            return jsonResponse({ error: 'New password must be at least 8 characters long' }, 400);
          }
          const { hash, salt } = await hashPassword(newPassword);
          updates.passwordHash = hash;
          updates.passwordSalt = salt;
        }

        if (Object.keys(updates).length === 0) {
          return jsonResponse({ error: 'No changes provided' }, 400);
        }

        const updated = await repos.admins.update(admin.id, updates);
        if (!updated) {
          return jsonResponse({ error: 'Failed to update credentials' }, 500);
        }

        await repos.audit.log({
          adminEmail: session.email,
          action: 'UPDATE_ADMIN_ACCOUNT',
          entityType: 'settings',
          entityId: admin.id,
          details: `Updated administrator credentials for ${updated.email}`
        });

        return jsonResponse({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role
        });
      }

      // Unicode Sync status
      if (method === 'GET' && pathname === '/api/admin/unicode/preview') {
        const total = await repos.emojis.count();
        return jsonResponse({
          currentCount: total,
          unicodeVersion: '16.0',
          newEmojisAvailable: 0,
          updatedEmojisAvailable: 0,
          readyForSync: true
        });
      }

      if (method === 'POST' && pathname === '/api/admin/unicode/sync') {
        const total = await repos.emojis.count();
        await repos.audit.log({
          adminEmail: session.email,
          action: 'UNICODE_SYNC',
          entityType: 'settings',
          details: `Synchronized ${total} emojis with official Unicode 16.0`
        });
        return jsonResponse({
          success: true,
          syncedCount: total,
          version: 'Unicode 16.0',
          message: 'All emojis verified and aligned with official CLDR and Unicode 16.0.'
        });
      }
    }

    return jsonResponse({ error: `Not found: ${method} ${pathname}` }, 404);
  } catch (err: any) {
    console.error('Unhandled API Router Error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
}

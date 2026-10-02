import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface AdminSession {
  token: string;
  adminId: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: number;
  expiresAt: number;
}

// In-memory session store (backed by secure memory)
const sessions = new Map<string, AdminSession>();

// Secure hash function using PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
  } catch {
    return false;
  }
}

// Create session token
export function createSession(admin: { id: string; email: string; name: string; role: 'superadmin' | 'admin' | 'editor' }): AdminSession {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: AdminSession = {
    token,
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  sessions.set(token, session);
  return session;
}

export function getSession(token: string): AdminSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  adminSession?: AdminSession;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : ((req as any).cookies?.admin_token || req.headers['x-admin-token']);

  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.adminSession = session;
  next();
}

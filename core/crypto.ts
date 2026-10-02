// ============================================================================
// Universal Cryptography Module (Web Crypto API)
// Compatible with Cloudflare Workers/Pages Functions & Node.js 18+ / VPS
// ============================================================================

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * PBKDF2 SHA-512 Password Hasher using standard Web Crypto
 */
export async function hashPassword(
  password: string,
  saltStr?: string
): Promise<{ hash: string; salt: string }> {
  const salt = saltStr || bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 10000,
      hash: 'SHA-512'
    },
    keyMaterial,
    512 // 64 bytes = 128 hex chars
  );

  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt
  };
}

/**
 * Verify a plain password against stored PBKDF2 hash and salt
 */
export async function verifyPassword(
  password: string,
  storedHashHex: string,
  storedSaltHex: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, storedSaltHex);
    return timingSafeEqual(hash, storedHashHex);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Constant-time string equality check to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generates a cryptographically strong 256-bit random session token
 */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

/**
 * Generates a random UUID v4
 */
export function generateId(prefix = 'id'): string {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}-${bytesToHex(bytes)}`;
}

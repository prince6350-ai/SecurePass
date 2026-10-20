/**
 * SecurePass Cryptographic Derivation Engine (Version 1)
 * 
 * Algorithm: PBKDF2-HMAC-SHA-256
 * Standard Iteration Count: 100,000
 * Namespace Salt Prefix: SecurePass:v1:
 * 
 * Deterministic character selection & Fisher-Yates uniform shuffle.
 * Byte-for-byte identical with python/securepass.py and Android Kotlin implementation.
 */

export const ALGORITHM_VERSION = 'v1';
export const DEFAULT_ITERATIONS = 100_000;
export const SALT_NAMESPACE_PREFIX = 'SecurePass:v1:';
export const DEFAULT_ACCOUNT_IDENTIFIER = 'default';

export const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const CHARSET_DIGITS = '0123456789';
export const CHARSET_SYMBOLS_SAFE = '!@#$%^&*-_=+';
export const CHARSET_SYMBOLS_FULL = '!@#$%^&*()-_=+[]{}?';

export const CHARSET_FULL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_FULL; // 81 chars
export const CHARSET_SAFE = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_SAFE; // 74 chars
export const CHARSET_ALPHANUMERIC = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS; // 62 chars
export const CHARSET_PIN = CHARSET_DIGITS; // 10 chars

export type CharacterProfile = 'full' | 'symbols_safe' | 'alphanumeric' | 'pin';

export interface DerivationOptions {
  masterSecret: string;
  accountIdentifier?: string; // Optional: defaults to 'default'
  length?: number; // 8 to 64, default 16
  profile?: CharacterProfile; // default 'full'
  generation?: number; // default 1 (for rotating passwords)
  iterations?: number; // default 100,000
}

export interface DerivationResult {
  password: string;
  normalizedIdentifier: string;
  saltString: string;
  iterations: number;
  length: number;
  profile: CharacterProfile;
  generation: number;
  algorithm: string;
  isDefaultIdentifier: boolean;
}

/**
 * Normalizes website or account identifier.
 * If empty or whitespace, defaults to 'default'.
 * Strips protocol, trailing paths, query strings, and whitespace, lowercases.
 */
export function normalizeIdentifier(raw?: string): string {
  if (!raw || !raw.trim()) {
    return DEFAULT_ACCOUNT_IDENTIFIER;
  }
  let str = raw.trim().toLowerCase();
  
  // If user pasted a full URL like https://github.com/login, extract domain
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str);
      return url.hostname || DEFAULT_ACCOUNT_IDENTIFIER;
    } catch {
      // fallback to regex stripping
      str = str.replace(/^https?:\/\//, '').split('/')[0].split('?')[0];
    }
  } else if (str.includes('/')) {
    str = str.split('/')[0].split('?')[0];
  }

  return str.trim() || DEFAULT_ACCOUNT_IDENTIFIER;
}

/**
 * Derives a deterministic password using native Web Crypto PBKDF2-HMAC-SHA-256.
 */
export async function derivePassword(options: DerivationOptions): Promise<DerivationResult> {
  const masterSecret = options.masterSecret ?? '';
  if (!masterSecret) {
    throw new Error('Master secret is required.');
  }

  // If identifier is omitted or empty, normalizeIdentifier automatically returns DEFAULT_ACCOUNT_IDENTIFIER ('default')
  const isDefaultIdentifier = !options.accountIdentifier || !options.accountIdentifier.trim();
  const normalizedIdentifier = normalizeIdentifier(options.accountIdentifier);

  const length = Math.max(4, Math.min(64, options.length ?? 16));
  const profile = options.profile ?? 'full';
  const generation = Math.max(1, options.generation ?? 1);
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;

  // Domain-separated salt
  const saltString = generation === 1
    ? `${SALT_NAMESPACE_PREFIX}${normalizedIdentifier}`
    : `${SALT_NAMESPACE_PREFIX}${normalizedIdentifier}:c${generation}`;

  const enc = new TextEncoder();
  const secretBytes = enc.encode(masterSecret);
  const saltBytes = enc.encode(saltString);

  // We need enough bytes for picking characters (2*L) and shuffling (2*(L-1))
  const dklen = Math.max(64, length * 4);

  // Cross-environment Web Crypto reference
  const cryptoSubtle = (typeof window !== 'undefined' && window.crypto?.subtle)
    ? window.crypto.subtle
    : globalThis.crypto?.subtle;

  if (!cryptoSubtle) {
    throw new Error('Web Cryptography API (crypto.subtle) is not available.');
  }

  const keyMaterial = await cryptoSubtle.importKey(
    'raw',
    secretBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await cryptoSubtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    dklen * 8 // bits
  );

  const derivedBytes = new Uint8Array(derivedBits);

  const readU16 = (offset: number): number => {
    return (derivedBytes[offset] << 8) | derivedBytes[offset + 1];
  };

  const chars: string[] = [];

  if (profile === 'pin') {
    for (let i = 0; i < length; i++) {
      const idx = readU16(i * 2) % CHARSET_PIN.length;
      chars.push(CHARSET_PIN[idx]);
    }
  } else if (profile === 'alphanumeric') {
    // Reserve slot 0: lower, slot 1: upper, slot 2: digit
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    for (let i = 3; i < length; i++) {
      const idx = readU16(i * 2) % CHARSET_ALPHANUMERIC.length;
      chars.push(CHARSET_ALPHANUMERIC[idx]);
    }
  } else if (profile === 'symbols_safe') {
    // Reserve slot 0: lower, slot 1: upper, slot 2: digit, slot 3: safe symbol
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    chars.push(CHARSET_SYMBOLS_SAFE[readU16(6) % CHARSET_SYMBOLS_SAFE.length]);
    for (let i = 4; i < length; i++) {
      const idx = readU16(i * 2) % CHARSET_SAFE.length;
      chars.push(CHARSET_SAFE[idx]);
    }
  } else {
    // Default 'full'
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    chars.push(CHARSET_SYMBOLS_FULL[readU16(6) % CHARSET_SYMBOLS_FULL.length]);
    for (let i = 4; i < length; i++) {
      const idx = readU16(i * 2) % CHARSET_FULL.length;
      chars.push(CHARSET_FULL[idx]);
    }
  }

  // Deterministic Fisher-Yates uniform shuffle (if length > 1 and not PIN)
  if (length > 1 && profile !== 'pin') {
    let shuffleOffset = length * 2;
    for (let j = length - 1; j > 0; j--) {
      const swapIdx = readU16(shuffleOffset) % (j + 1);
      shuffleOffset += 2;
      const tmp = chars[j];
      chars[j] = chars[swapIdx];
      chars[swapIdx] = tmp;
    }
  }

  return {
    password: chars.join(''),
    normalizedIdentifier,
    saltString,
    iterations,
    length,
    profile,
    generation,
    algorithm: `PBKDF2-HMAC-SHA256 (100,000 iterations)`,
    isDefaultIdentifier,
  };
}

/**
 * Standard test vectors matching Python and Android reference implementations.
 */
export const SHARED_TEST_VECTORS = [
  {
    title: 'Empty Identifier (Uses fixed default "default")',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: '',
    length: 16,
    profile: 'full' as CharacterProfile,
    generation: 1,
    expectedPassword: 'fjZ+Y0*g^=70Z=x$',
  },
  {
    title: 'Standard GitHub 16-char Full',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'github.com',
    length: 16,
    profile: 'full' as CharacterProfile,
    generation: 1,
    expectedPassword: '}JzgK06+0i=7T^v9',
  },
  {
    title: 'Standard Example.com 16-char Full',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'example.com',
    length: 16,
    profile: 'full' as CharacterProfile,
    generation: 1,
    expectedPassword: '^0$Gi0+)0}%_KEPK',
  },
  {
    title: 'URL Normalization check (https://github.com/settings -> github.com)',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'https://github.com/settings',
    length: 16,
    profile: 'full' as CharacterProfile,
    generation: 1,
    expectedPassword: '}JzgK06+0i=7T^v9',
  },
  {
    title: '20-char Alphanumeric profile',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'aws.amazon.com',
    length: 20,
    profile: 'alphanumeric' as CharacterProfile,
    generation: 1,
    expectedPassword: 'tyrTv68FV1CY8Nj5TGZS',
  },
  {
    title: '6-digit Numeric PIN',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'atm-card',
    length: 6,
    profile: 'pin' as CharacterProfile,
    generation: 1,
    expectedPassword: '522979',
  },
  {
    title: '16-char Safe Symbols profile',
    masterSecret: 'MySuperSecretMasterKey2026!',
    identifier: 'github.com',
    length: 16,
    profile: 'symbols_safe' as CharacterProfile,
    generation: 1,
    expectedPassword: '$qMgK0=TOebc_u!#',
  },
];

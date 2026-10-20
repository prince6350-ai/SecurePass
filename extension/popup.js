// SecurePass Chrome Extension (Manifest V3)
// Developed by Mohit Prajapati
// Cryptographic Derivation matching Python and Web app

const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_DIGITS = '0123456789';
const CHARSET_SYMBOLS_SAFE = '!@#$%^&*-_=+';
const CHARSET_SYMBOLS_FULL = '!@#$%^&*()-_=+[]{}?';

const CHARSET_FULL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_FULL;
const CHARSET_SAFE = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_SAFE;
const CHARSET_ALPHANUMERIC = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS;

function normalize(raw) {
  if (!raw || !raw.trim()) return 'default';
  let str = raw.trim().toLowerCase();
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      return new URL(str).hostname || 'default';
    } catch {
      str = str.replace(/^https?:\/\//, '').split('/')[0];
    }
  } else if (str.includes('/')) {
    str = str.split('/')[0];
  }
  return str.trim() || 'default';
}

async function derivePassword(secret, site = 'default', length = 16, profile = 'full') {
  const norm = normalize(site);
  const salt = new TextEncoder().encode('SecurePass:v1:' + norm);
  const dklen = Math.max(64, length * 4);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    dklen * 8
  );

  const bytes = new Uint8Array(bits);
  const readU16 = (o) => (bytes[o] << 8) | bytes[o + 1];

  const chars = [];
  if (profile === 'pin') {
    for (let i = 0; i < length; i++) {
      chars.push(CHARSET_DIGITS[readU16(i * 2) % CHARSET_DIGITS.length]);
    }
  } else if (profile === 'alphanumeric') {
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    for (let i = 3; i < length; i++) {
      chars.push(CHARSET_ALPHANUMERIC[readU16(i * 2) % CHARSET_ALPHANUMERIC.length]);
    }
  } else if (profile === 'symbols_safe') {
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    chars.push(CHARSET_SYMBOLS_SAFE[readU16(6) % CHARSET_SYMBOLS_SAFE.length]);
    for (let i = 4; i < length; i++) {
      chars.push(CHARSET_SAFE[readU16(i * 2) % CHARSET_SAFE.length]);
    }
  } else {
    chars.push(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length]);
    chars.push(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length]);
    chars.push(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length]);
    chars.push(CHARSET_SYMBOLS_FULL[readU16(6) % CHARSET_SYMBOLS_FULL.length]);
    for (let i = 4; i < length; i++) {
      chars.push(CHARSET_FULL[readU16(i * 2) % CHARSET_FULL.length]);
    }
  }

  if (length > 1 && profile !== 'pin') {
    let offset = length * 2;
    for (let j = length - 1; j > 0; j--) {
      const swap = readU16(offset) % (j + 1);
      offset += 2;
      const tmp = chars[j];
      chars[j] = chars[swap];
      chars[swap] = tmp;
    }
  }

  return chars.join('');
}

document.getElementById('btn-generate').addEventListener('click', async () => {
  const secret = document.getElementById('secret').value;
  const site = document.getElementById('site').value;
  const length = parseInt(document.getElementById('length').value, 10);
  const profile = document.getElementById('profile').value;

  if (!secret) {
    alert('Please enter your master secret.');
    return;
  }

  const pwd = await derivePassword(secret, site, length, profile);
  const box = document.getElementById('output-box');
  const txt = document.getElementById('output-pass');
  txt.textContent = pwd;
  box.style.display = 'block';
});

document.getElementById('btn-copy').addEventListener('click', async () => {
  const pwd = document.getElementById('output-pass').textContent;
  if (!pwd) return;
  await navigator.clipboard.writeText(pwd);
  const btn = document.getElementById('btn-copy');
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
});

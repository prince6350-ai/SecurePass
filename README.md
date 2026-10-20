# SecurePass — Deterministic Password Generator
### Developed by Prince Kumar
**Zero Database • Zero Network Transmission • Local PBKDF2 Cryptographic Derivation**

[![Engine](https://img.shields.io/badge/Algorithm-PBKDF2--HMAC--SHA256-10b981.svg)]()
[![Privacy](https://img.shields.io/badge/Storage-Zero--Database-06b6d4.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Python%20%7C%20Extension%20%7C%20Android-8b5cf6.svg)]()

SecurePass is a deterministic password generator inspired by zero-storage cryptographic design. Instead of storing encrypted passwords in a cloud vault vulnerable to credential breaches, SecurePass uses a one-way mathematical function to deterministically derive identical passwords on demand from your **Master Secret** and **Account Identifier** (e.g. `github.com`).

---

## Key Features

- **Mathematical Determinism:** Identical inputs always yield the exact same password across Web, Python, and Android.
- **Zero Database & No History:** Secrets are never persisted to localStorage, IndexedDB, disk files, or remote servers.
- **Cross-Platform Test Parity:** TypeScript Web Crypto and Python implementations pass shared, automated test vectors.
- **Domain Separation:** Each service receives an isolated salt namespace (`SecurePass:v1:${domain}`) preventing cross-service correlation.
- **Master Secret Entropy Meter:** Real-time entropy scoring alerts you if your master secret is vulnerable to brute-force attacks.
- **Generation Counter:** Rotate passwords smoothly without changing your master secret by incrementing the generation counter.
- **Legibility Color-Coding:** Derived passwords distinguish numbers (emerald), uppercase letters (cyan), lowercase (slate), and symbols (violet).
- **Chrome Extension Ready:** Pre-built Manifest V3 extension in `/extension`.
- **Android Architecture:** Full Kotlin Jetpack Compose reference implementation in `/docs/ANDROID.md`.

---

## Cryptographic Specification

| Parameter | Value |
|---|---|
| **Algorithm** | PBKDF2-HMAC-SHA-256 (RFC 2898 / RFC 8018) |
| **Iteration Count** | 100,000 rounds |
| **Salt Format** | `SecurePass:v1:${normalized_domain}` (or `:c${generation}`) |
| **Mapping Mechanism** | 16-bit integer extraction with deterministic Fisher-Yates uniform shuffle |
| **Key Length** | Minimum 64 bytes derived per request |

See [`docs/ALGORITHM.md`](docs/ALGORITHM.md) for full mathematical proofs, byte mapping, and category enforcement specifications.

---

## Quickstart: Web Application

### Prerequisites
- Node.js 18+ (tested on Node 22)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
# Run TypeScript cryptographic tests
npm test

# Run Python shared parity tests
npm run test:python
```

### 4. Build for Production
```bash
npm run build
```

---

## Quickstart: Python CLI Reference

The Python implementation requires **zero external pip dependencies** and uses standard library `hashlib` and `getpass`.

```bash
# 1. Interactive mode with hidden master secret input:
python3 python/securepass.py

# 2. Automated derivation via flags:
python3 python/securepass.py --site github.com --length 16 --profile full

# 3. Rotating a password using generation counter:
python3 python/securepass.py --site github.com --length 16 --generation 2

# 4. Run automated test suite:
python3 python/test_securepass.py
```

---

## Personal Branding Customization

To personalize this project with your own photo and social media links:

1. Open `src/config/brand.ts`.
2. Add your profile photo to `/public/` (e.g. `public/mohit.jpg`) and set:
   ```ts
   avatarImageUrl: '/mohit.jpg',
   ```
3. Update your social URLs:
   ```ts
   socials: {
     linkedin: { url: 'https://www.linkedin.com/in/prince---kumar', isConfigured: true, ... }
   }
   ```
4. You can also test and preview your avatar directly in the live app using the **"Customize Identity"** button in the header.

---

## How to Publish to GitHub

```bash
# Initialize git if needed
git init
git add .
git commit -m "feat: SecurePass deterministic password generator by Prince Kumar"

# Add your GitHub remote repository
git remote add origin https://github.com/YOUR_USERNAME/securepass.git
git branch -M main
git push -u origin main
```

---

## Privacy Notice & Limitations

> **"Your privacy matters. Your master secret and generated passwords are processed locally by this application. The app does not store or transmit these values. No database or password history is maintained. Keep your master secret safe: it cannot be recovered by this app if lost."**

Please review [`SECURITY.md`](SECURITY.md) for our full threat model, client boundary explanations, and responsible disclosure policy.

---

## License

Created by **Prince Kumar**. Distributed under the Apache 2.0 License.

# Cryptographic Algorithm Specification: SecurePass v1
**Developer:** Mohit Prajapati  
**Classification:** Deterministic Password Derivation Function (DPDF)  
**Specification Version:** 1.0.0  

---

## 1. Cryptographic Primitive
- **Algorithm:** PBKDF2 (Password-Based Key Derivation Function 2)
- **Underlying PRF:** HMAC-SHA-256
- **Iteration Count:** 100,000 rounds
- **Standard Reference:** RFC 2898 / RFC 8018

### Threat Mitigation Rationale
100,000 iterations of HMAC-SHA-256 provides significant computational work factor against offline dictionary attacks and specialized GPU cracking clusters, while taking approximately 50-150ms on modern client CPUs and mobile processors.

---

## 2. Salt Generation & Domain Separation
To prevent rainbow tables and ensure that identical master secrets yield distinct passwords across different services, a deterministic domain-separated salt is constructed:

```
Salt = UTF-8("SecurePass:v1:" + Normalized(AccountIdentifier) + [":c" + Generation])
```

### Normalization Rules
1. Strip protocol prefixes (`https://`, `http://`).
2. Strip trailing paths, query strings, and fragments (`/login?ref=...`).
3. Trim surrounding whitespace.
4. Convert all ASCII characters to lowercase.

### Examples
- `https://GitHub.com/settings` $\rightarrow$ `SecurePass:v1:github.com`
- `example.com` (Generation 1) $\rightarrow$ `SecurePass:v1:example.com`
- `example.com` (Generation 2) $\rightarrow$ `SecurePass:v1:example.com:c2`

---

## 3. Byte Derivation & Character Mapping

### Step 1: PBKDF2 Key Derivation
Given a requested password length $L$ ($4 \le L \le 64$):
$$\text{dkLen} = \max(64, L \times 4) \text{ bytes}$$
$$B = \text{PBKDF2}(\text{HMAC-SHA-256}, \text{MasterSecret}, \text{Salt}, 100000, \text{dkLen})$$

### Step 2: 16-Bit Integer Extraction
To prevent modulo bias, two bytes are consumed for every discrete character index or swap operation:
$$\text{ReadU16}(offset) = (B[offset] \ll 8) \mid B[offset + 1]$$
Since $0 \le \text{ReadU16} \le 65535$, applying $\pmod K$ for pool sizes $K \le 81$ produces an imperceptible bias of less than $0.024\%$.

### Step 3: Category Allocation
- **Full Profile ($K=81$):**
  - Slot 0: Lowercase ($a-z$, 26)
  - Slot 1: Uppercase ($A-Z$, 26)
  - Slot 2: Digits ($0-9$, 10)
  - Slot 3: Full Symbols (`!@#$%^&*()-_=+[]{}?`, 19)
  - Remaining $i = 4 \dots L-1$: Selected from full pool ($K=81$) using $\text{ReadU16}(2i) \pmod{81}$.

- **Alphanumeric Profile ($K=62$):**
  - Slot 0: Lowercase (26)
  - Slot 1: Uppercase (26)
  - Slot 2: Digits (10)
  - Remaining $i = 3 \dots L-1$: Selected from alphanumeric pool ($K=62$).

- **PIN Profile ($K=10$):**
  - All slots $i = 0 \dots L-1$: Selected from digits (`0123456789`).

### Step 4: Deterministic Fisher-Yates Uniform Shuffle
For profiles other than PIN, the array of $L$ characters is shuffled to distribute guaranteed character classes uniformly across all positions:

```
offset = L * 2
for j from (L - 1) down to 1:
    swap_index = ReadU16(offset) % (j + 1)
    offset = offset + 2
    swap(chars[j], chars[swap_index])
```

---

## 4. Official Test Vectors
All implementations (TypeScript/Web Crypto, Python, Kotlin) must pass these exact test vectors:

| # | Master Secret | Identifier | Len | Profile | Gen | Expected Password |
|---|---|---|---|---|---|---|
| 1 | `MySuperSecretMasterKey2026!` | `github.com` | 16 | `full` | 1 | `}JzgK06+0i=7T^v9` |
| 2 | `MySuperSecretMasterKey2026!` | `example.com` | 16 | `full` | 1 | `^0$Gi0+)0}%_KEPK` |
| 3 | `MySuperSecretMasterKey2026!` | `https://github.com/settings` | 16 | `full` | 1 | `}JzgK06+0i=7T^v9` |
| 4 | `MySuperSecretMasterKey2026!` | `aws.amazon.com` | 20 | `alphanumeric` | 1 | `tyrTv68FV1CY8Nj5TGZS` |
| 5 | `MySuperSecretMasterKey2026!` | `atm-card` | 6 | `pin` | 1 | `522979` |
| 6 | `MySuperSecretMasterKey2026!` | `github.com` | 16 | `symbols_safe` | 1 | `$qMgK0=TOebc_u!#` |

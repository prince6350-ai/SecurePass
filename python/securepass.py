#!/usr/bin/env python3
"""
SecurePass — Deterministic Password Generator (Python CLI Reference Implementation)
Developer: Prince Kumar
Tool Name: SecurePass
Algorithm Version: v1 (PBKDF2-HMAC-SHA-256)

This reference implementation generates repeatable, high-entropy passwords
locally without a database or network communication. It matches the Web Crypto
and Android implementation bit-for-bit.

Usage:
    # Interactive mode (prompts with hidden password input):
    python3 securepass.py

    # Direct CLI arguments:
    python3 securepass.py --site github.com --length 16
    python3 securepass.py --site aws.amazon.com --length 20 --profile alphanumeric
"""

import argparse
import getpass
import hashlib
import sys
from urllib.parse import urlparse

# Character Set Definitions (matching TypeScript generator)
CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz"
CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
CHARSET_DIGITS = "0123456789"
CHARSET_SYMBOLS_SAFE = "!@#$%^&*-_=+"
CHARSET_SYMBOLS_FULL = "!@#$%^&*()-_=+[]{}?"

CHARSET_FULL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_FULL  # 81
CHARSET_SAFE = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_SAFE  # 74
CHARSET_ALPHANUMERIC = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS  # 62
CHARSET_PIN = CHARSET_DIGITS  # 10

SALT_NAMESPACE_PREFIX = "SecurePass:v1:"
DEFAULT_ACCOUNT_IDENTIFIER = "default"
DEFAULT_ITERATIONS = 100_000


def normalize_identifier(raw: str = "") -> str:
    """
    Normalizes account or website identifier.
    Extracts hostname if full URL is given, trims whitespace, and converts to lowercase.
    If empty or whitespace, defaults to 'default'.
    """
    if not raw or not raw.strip():
        return DEFAULT_ACCOUNT_IDENTIFIER
    text = raw.strip().lower()
    if text.startswith("http://") or text.startswith("https://"):
        parsed = urlparse(text)
        return parsed.netloc or text.replace("https://", "").replace("http://", "").split("/")[0] or DEFAULT_ACCOUNT_IDENTIFIER
    if "/" in text:
        text = text.split("/")[0]
    return text.strip() or DEFAULT_ACCOUNT_IDENTIFIER


def derive_password(
    master_secret: str,
    account_identifier: str = DEFAULT_ACCOUNT_IDENTIFIER,
    length: int = 16,
    profile: str = "full",
    generation: int = 1,
    iterations: int = DEFAULT_ITERATIONS,
) -> str:
    """
    Derives a deterministic password using PBKDF2-HMAC-SHA-256.

    Args:
        master_secret: User-provided master password/passphrase.
        account_identifier: Website or service domain (optional; defaults to 'default').
        length: Desired password length (4-64, default 16).
        profile: Character set ('full', 'symbols_safe', 'alphanumeric', 'pin').
        generation: Counter for password rotation (default 1).
        iterations: PBKDF2 iteration count (default 100,000).

    Returns:
        The derived password string.
    """
    if not master_secret:
        raise ValueError("Master secret cannot be empty.")

    normalized = normalize_identifier(account_identifier)

    length = max(4, min(64, length))
    generation = max(1, generation)

    # Domain-separated salt
    if generation == 1:
        salt_str = f"{SALT_NAMESPACE_PREFIX}{normalized}"
    else:
        salt_str = f"{SALT_NAMESPACE_PREFIX}{normalized}:c{generation}"

    salt_bytes = salt_str.encode("utf-8")
    secret_bytes = master_secret.encode("utf-8")

    # Minimum 64 bytes or 4 * length to cover character picks and Fisher-Yates shuffle
    dklen = max(64, length * 4)

    derived = hashlib.pbkdf2_hmac("sha256", secret_bytes, salt_bytes, iterations, dklen)

    def read_u16(offset: int) -> int:
        return (derived[offset] << 8) | derived[offset + 1]

    chars = []

    if profile == "pin":
        for i in range(length):
            idx = read_u16(i * 2) % len(CHARSET_PIN)
            chars.append(CHARSET_PIN[idx])
    elif profile == "alphanumeric":
        # Guaranteed category slots
        chars.append(CHARSET_LOWER[read_u16(0) % len(CHARSET_LOWER)])
        chars.append(CHARSET_UPPER[read_u16(2) % len(CHARSET_UPPER)])
        chars.append(CHARSET_DIGITS[read_u16(4) % len(CHARSET_DIGITS)])
        for i in range(3, length):
            idx = read_u16(i * 2) % len(CHARSET_ALPHANUMERIC)
            chars.append(CHARSET_ALPHANUMERIC[idx])
    elif profile == "symbols_safe":
        # Guaranteed category slots with safe symbols
        chars.append(CHARSET_LOWER[read_u16(0) % len(CHARSET_LOWER)])
        chars.append(CHARSET_UPPER[read_u16(2) % len(CHARSET_UPPER)])
        chars.append(CHARSET_DIGITS[read_u16(4) % len(CHARSET_DIGITS)])
        chars.append(CHARSET_SYMBOLS_SAFE[read_u16(6) % len(CHARSET_SYMBOLS_SAFE)])
        for i in range(4, length):
            idx = read_u16(i * 2) % len(CHARSET_SAFE)
            chars.append(CHARSET_SAFE[idx])
    else:  # 'full'
        # Guaranteed category slots with full symbols
        chars.append(CHARSET_LOWER[read_u16(0) % len(CHARSET_LOWER)])
        chars.append(CHARSET_UPPER[read_u16(2) % len(CHARSET_UPPER)])
        chars.append(CHARSET_DIGITS[read_u16(4) % len(CHARSET_DIGITS)])
        chars.append(CHARSET_SYMBOLS_FULL[read_u16(6) % len(CHARSET_SYMBOLS_FULL)])
        for i in range(4, length):
            idx = read_u16(i * 2) % len(CHARSET_FULL)
            chars.append(CHARSET_FULL[idx])

    # Deterministic Fisher-Yates uniform shuffle (if length > 1 and not PIN)
    if length > 1 and profile != "pin":
        shuffle_offset = length * 2
        for j in range(length - 1, 0, -1):
            swap_idx = read_u16(shuffle_offset) % (j + 1)
            shuffle_offset += 2
            chars[j], chars[swap_idx] = chars[swap_idx], chars[j]

    return "".join(chars)


def main():
    parser = argparse.ArgumentParser(
        description="SecurePass: Deterministic Password Generator (Developed by Mohit Prajapati)"
    )
    parser.add_argument(
        "--site",
        "-s",
        default="default",
        help="Website or account identifier (optional, default: 'default')",
    )
    parser.add_argument("--secret", "-m", help="Master secret (optional; prompted hiddenly if omitted)")
    parser.add_argument("--length", "-l", type=int, default=16, help="Password length (default: 16)")
    parser.add_argument(
        "--profile",
        "-p",
        choices=["full", "symbols_safe", "alphanumeric", "pin"],
        default="full",
        help="Character profile (default: full)",
    )
    parser.add_argument("--generation", "-g", type=int, default=1, help="Generation counter for rotation (default: 1)")

    args = parser.parse_args()

    print("======================================================")
    print("  SecurePass — Deterministic Password Generator")
    print("  Developed by Prince Kumar")
    print("  Zero Database | Zero History | Local PBKDF2 Derivation")
    print("======================================================\n")

    site = args.site
    if site == "default" and not any(flag in sys.argv for flag in ("--site", "-s")):
        user_input = input("Website or Account Identifier (optional, press Enter for default): ").strip()
        if user_input:
            site = user_input
        else:
            site = "default"

    secret = args.secret
    if not secret:
        secret = getpass.getpass("Enter Master Secret (input hidden): ")
        if not secret:
            print("Error: Master secret cannot be empty.", file=sys.stderr)
            sys.exit(1)

    try:
        password = derive_password(
            master_secret=secret,
            account_identifier=site,
            length=args.length,
            profile=args.profile,
            generation=args.generation,
        )

        norm_site = normalize_identifier(site)
        print("\n---------------- Derivation Results ----------------")
        print(f"Target Service   : {norm_site}")
        print(f"Profile          : {args.profile}")
        print(f"Length           : {args.length} characters")
        print(f"Generation       : {args.generation}")
        print(f"Derived Password : {password}")
        print("----------------------------------------------------\n")
        print("Notice: No passwords or secrets are ever saved to disk or network.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

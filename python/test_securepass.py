#!/usr/bin/env python3
"""
Automated unit tests for SecurePass Python implementation.
Verifies shared cryptographic test vectors matching TypeScript / Web Crypto implementation.
"""

import unittest
from securepass import (
    derive_password,
    normalize_identifier,
    CHARSET_LOWER,
    CHARSET_UPPER,
    CHARSET_DIGITS,
    CHARSET_SYMBOLS_FULL,
)

SHARED_TEST_VECTORS = [
    {
        "title": "Empty Identifier (Default 'default')",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "",
        "length": 16,
        "profile": "full",
        "generation": 1,
        "expectedPassword": "fjZ+Y0*g^=70Z=x$",
    },
    {
        "title": "Standard GitHub 16-char Full",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "github.com",
        "length": 16,
        "profile": "full",
        "generation": 1,
        "expectedPassword": "}JzgK06+0i=7T^v9",
    },
    {
        "title": "Standard Example.com 16-char Full",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "example.com",
        "length": 16,
        "profile": "full",
        "generation": 1,
        "expectedPassword": "^0$Gi0+)0}%_KEPK",
    },
    {
        "title": "URL Normalization check",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "https://github.com/settings",
        "length": 16,
        "profile": "full",
        "generation": 1,
        "expectedPassword": "}JzgK06+0i=7T^v9",
    },
    {
        "title": "20-char Alphanumeric profile",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "aws.amazon.com",
        "length": 20,
        "profile": "alphanumeric",
        "generation": 1,
        "expectedPassword": "tyrTv68FV1CY8Nj5TGZS",
    },
    {
        "title": "6-digit Numeric PIN",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "atm-card",
        "length": 6,
        "profile": "pin",
        "generation": 1,
        "expectedPassword": "522979",
    },
    {
        "title": "16-char Safe Symbols profile",
        "masterSecret": "MySuperSecretMasterKey2026!",
        "identifier": "github.com",
        "length": 16,
        "profile": "symbols_safe",
        "generation": 1,
        "expectedPassword": "$qMgK0=TOebc_u!#",
    },
]


class TestSecurePass(unittest.TestCase):

    def test_shared_test_vectors(self):
        """Verifies bit-for-bit parity with TypeScript / Web Crypto implementation."""
        for v in SHARED_TEST_VECTORS:
            pwd = derive_password(
                master_secret=v["masterSecret"],
                account_identifier=v["identifier"],
                length=v["length"],
                profile=v["profile"],
                generation=v["generation"],
            )
            self.assertEqual(
                pwd,
                v["expectedPassword"],
                f"Failed vector {v['title']}: expected {v['expectedPassword']}, got {pwd}",
            )

    def test_determinism(self):
        """Identical inputs must produce identical outputs."""
        secret = "DeterministicSecret2026!"
        site = "proton.me"
        run1 = derive_password(secret, site, length=24)
        run2 = derive_password(secret, site, length=24)
        run3 = derive_password(secret, site, length=24)
        self.assertEqual(run1, run2)
        self.assertEqual(run2, run3)
        self.assertEqual(len(run1), 24)

    def test_domain_separation(self):
        """Different identifiers must produce completely different passwords."""
        secret = "SameSecretForAll"
        p_git = derive_password(secret, "github.com")
        p_gitlab = derive_password(secret, "gitlab.com")
        self.assertNotEqual(p_git, p_gitlab)

    def test_generation_rotation(self):
        """Rotating generation counter produces distinct passwords."""
        secret = "SecretKey"
        site = "apple.com"
        g1 = derive_password(secret, site, generation=1)
        g2 = derive_password(secret, site, generation=2)
        self.assertNotEqual(g1, g2)

    def test_character_guarantees(self):
        """Full profile must guarantee lower, upper, digit, and symbol."""
        pwd = derive_password("SimpleKey", "mybank.com", length=16, profile="full")
        self.assertEqual(len(pwd), 16)
        self.assertTrue(any(c in CHARSET_LOWER for c in pwd))
        self.assertTrue(any(c in CHARSET_UPPER for c in pwd))
        self.assertTrue(any(c in CHARSET_DIGITS for c in pwd))
        self.assertTrue(any(c in CHARSET_SYMBOLS_FULL for c in pwd))

    def test_optional_identifier(self):
        """Empty or omitted identifier produces repeatable 'default' password."""
        secret = "MySuperSecretMasterKey2026!"
        p1 = derive_password(secret, "")
        p2 = derive_password(secret)
        p3 = derive_password(secret, "   ")
        self.assertEqual(p1, "fjZ+Y0*g^=70Z=x$")
        self.assertEqual(p1, p2)
        self.assertEqual(p2, p3)

    def test_normalization(self):
        """Verifies URL stripping and lowercase normalization."""
        self.assertEqual(normalize_identifier("https://github.com/mohit"), "github.com")
        self.assertEqual(normalize_identifier("  EXAMPLE.COM/login?next=/  "), "example.com")
        self.assertEqual(normalize_identifier("my-local-server"), "my-local-server")
        self.assertEqual(normalize_identifier(""), "default")
        self.assertEqual(normalize_identifier("   "), "default")


if __name__ == "__main__":
    unittest.main()

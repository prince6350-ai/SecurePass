# SecurePass — Android Architecture & Implementation Guide
**Developer:** Mohit Prajapati  
**Platform:** Android (Kotlin, Jetpack Compose, Material 3)  
**Security Target:** Zero Network Permissions, Hardware-Accelerated Local Cryptography

---

## 1. Architectural Principles
1. **Zero Internet Permission (`android.permission.INTERNET` omitted):**  
   The `AndroidManifest.xml` must not declare internet access. This provides absolute assurance to users that the app cannot leak secrets.
2. **Zero Persistent Storage:**  
   No `RoomDatabase`, `SharedPreferences`, or `DataStore` used for secrets or generated passwords.
3. **Biometric Master Key (Optional KeyStore Hook):**  
   If the user opts to remember their master secret on device, it must be encrypted via Android KeyStore `KeyGenParameterSpec` backed by the hardware Secure Element (StrongBox / TEE) and unlocked only via `BiometricPrompt`.
4. **Window Secure Flag:**  
   `window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)` prevents screenshots and app switcher caching.

---

## 2. Cryptographic Implementation (Kotlin)

Below is the production-grade Kotlin implementation using standard `javax.crypto.SecretKeyFactory` that reproduces the exact same passwords as the Python and TypeScript implementations:

```kotlin
package com.securepass.crypto

import java.nio.charset.StandardCharsets
import java.security.spec.KeySpec
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object SecurePassEngine {
    private const val ALGORITHM = "PBKDF2WithHmacSHA256"
    private const val ITERATIONS = 100_000
    private const val SALT_PREFIX = "SecurePass:v1:"

    private const val CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz"
    private const val CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    private const val CHARSET_DIGITS = "0123456789"
    private const val CHARSET_SYMBOLS_SAFE = "!@#$%^&*-_=+"
    private const val CHARSET_SYMBOLS_FULL = "!@#$%^&*()-_=+[]{}?"

    private val CHARSET_FULL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_FULL
    private val CHARSET_SAFE = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_SAFE
    private val CHARSET_ALPHANUMERIC = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS

    fun normalizeIdentifier(raw: String): String {
        var str = raw.trim().lowercase()
        if (str.startsWith("http://") || str.startsWith("https://")) {
            str = str.replace("https://", "").replace("http://", "").split("/")[0]
        } else if (str.contains("/")) {
            str = str.split("/")[0]
        }
        return str.trim()
    }

    fun derivePassword(
        masterSecret: String,
        accountIdentifier: String,
        length: Int = 16,
        profile: String = "full",
        generation: Int = 1
    ): String {
        require(masterSecret.isNotEmpty()) { "Master secret cannot be empty" }
        val normalized = normalizeIdentifier(accountIdentifier)
        require(normalized.isNotEmpty()) { "Account identifier cannot be empty" }

        val boundedLength = length.coerceIn(4, 64)
        val saltString = if (generation == 1) "$SALT_PREFIX$normalized" else "$SALT_PREFIX$normalized:c$generation"
        val saltBytes = saltString.toByteArray(StandardCharsets.UTF_8)

        val dkLen = maxOf(64, boundedLength * 4)
        val spec: KeySpec = PBEKeySpec(
            masterSecret.toCharArray(),
            saltBytes,
            ITERATIONS,
            dkLen * 8 // bits
        )
        val factory = SecretKeyFactory.getInstance(ALGORITHM)
        val derivedBytes = factory.generateSecret(spec).encoded

        fun readU16(offset: Int): Int {
            val b0 = derivedBytes[offset].toInt() and 0xFF
            val b1 = derivedBytes[offset + 1].toInt() and 0xFF
            return (b0 shl 8) or b1
        }

        val chars = ArrayList<Char>(boundedLength)

        when (profile) {
            "pin" -> {
                for (i in 0 until boundedLength) {
                    val idx = readU16(i * 2) % CHARSET_DIGITS.length
                    chars.add(CHARSET_DIGITS[idx])
                }
            }
            "alphanumeric" -> {
                chars.add(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length])
                chars.add(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length])
                chars.add(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length])
                for (i in 3 until boundedLength) {
                    val idx = readU16(i * 2) % CHARSET_ALPHANUMERIC.length
                    chars.add(CHARSET_ALPHANUMERIC[idx])
                }
            }
            "symbols_safe" -> {
                chars.add(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length])
                chars.add(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length])
                chars.add(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length])
                chars.add(CHARSET_SYMBOLS_SAFE[readU16(6) % CHARSET_SYMBOLS_SAFE.length])
                for (i in 4 until boundedLength) {
                    val idx = readU16(i * 2) % CHARSET_SAFE.length
                    chars.add(CHARSET_SAFE[idx])
                }
            }
            else -> { // full
                chars.add(CHARSET_LOWER[readU16(0) % CHARSET_LOWER.length])
                chars.add(CHARSET_UPPER[readU16(2) % CHARSET_UPPER.length])
                chars.add(CHARSET_DIGITS[readU16(4) % CHARSET_DIGITS.length])
                chars.add(CHARSET_SYMBOLS_FULL[readU16(6) % CHARSET_SYMBOLS_FULL.length])
                for (i in 4 until boundedLength) {
                    val idx = readU16(i * 2) % CHARSET_FULL.length
                    chars.add(CHARSET_FULL[idx])
                }
            }
        }

        // Fisher-Yates uniform shuffle
        if (boundedLength > 1 && profile != "pin") {
            var shuffleOffset = boundedLength * 2
            for (j in boundedLength - 1 downTo 1) {
                val swapIdx = readU16(shuffleOffset) % (j + 1)
                shuffleOffset += 2
                val tmp = chars[j]
                chars[j] = chars[swapIdx]
                chars[swapIdx] = tmp
            }
        }

        return chars.joinToString("")
    }
}
```

---

## 3. Test Vector Verification in Android
In your `src/test/java/com/securepass/crypto/SecurePassEngineTest.kt`:

```kotlin
@Test
fun testSharedVectorGitHub() {
    val pwd = SecurePassEngine.derivePassword(
        masterSecret = "MySuperSecretMasterKey2026!",
        accountIdentifier = "github.com",
        length = 16,
        profile = "full"
    )
    assertEquals("}JzgK06+0i=7T^v9", pwd)
}
```

---

## 4. Jetpack Compose UI Skeleton
The user interface should mirror the web app's clean card structure:
- OutlinedTextField with PasswordVisualTransformation
- Domain auto-suggest
- Material 3 Slider for length
- Primary derivation button with haptic feedback
- ClipboardManager copy with 30-second auto-clear timer

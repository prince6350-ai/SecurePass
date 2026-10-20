package com.securepass.crypto

import java.nio.charset.StandardCharsets
import java.security.spec.KeySpec
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * SecurePass Deterministic Derivation Engine (Android Reference)
 * Developed by Mohit Prajapati
 *
 * Algorithm: PBKDF2-HMAC-SHA-256
 * Standard Iterations: 100,000
 * Namespace Salt Prefix: SecurePass:v1:
 * Fixed Default Identifier: "default"
 */
object SecurePassEngine {
    const val ALGORITHM = "PBKDF2WithHmacSHA256"
    const val DEFAULT_ITERATIONS = 100_000
    const val SALT_PREFIX = "SecurePass:v1:"
    const val DEFAULT_ACCOUNT_IDENTIFIER = "default"

    const val CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz"
    const val CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const val CHARSET_DIGITS = "0123456789"
    const val CHARSET_SYMBOLS_SAFE = "!@#$%^&*-_=+"
    const val CHARSET_SYMBOLS_FULL = "!@#$%^&*()-_=+[]{}?"

    val CHARSET_FULL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_FULL // 81
    val CHARSET_SAFE = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS_SAFE // 74
    val CHARSET_ALPHANUMERIC = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS // 62
    val CHARSET_PIN = CHARSET_DIGITS // 10

    fun normalizeIdentifier(raw: String?): String {
        if (raw == null || raw.trim().isEmpty()) {
            return DEFAULT_ACCOUNT_IDENTIFIER
        }
        var str = raw.trim().lowercase()
        if (str.startsWith("http://") || str.startsWith("https://")) {
            str = str.replace("https://", "").replace("http://", "").split("/")[0]
        } else if (str.contains("/")) {
            str = str.split("/")[0]
        }
        return if (str.trim().isEmpty()) DEFAULT_ACCOUNT_IDENTIFIER else str.trim()
    }

    fun derivePassword(
        masterSecret: String,
        accountIdentifier: String? = null,
        length: Int = 16,
        profile: String = "full",
        generation: Int = 1,
        iterations: Int = DEFAULT_ITERATIONS
    ): String {
        require(masterSecret.isNotEmpty()) { "Master secret cannot be empty." }

        val normalized = normalizeIdentifier(accountIdentifier)
        val boundedLength = length.coerceIn(4, 64)
        val boundedGen = maxOf(1, generation)

        val saltString = if (boundedGen == 1) {
            "$SALT_PREFIX$normalized"
        } else {
            "$SALT_PREFIX$normalized:c$boundedGen"
        }

        val saltBytes = saltString.toByteArray(StandardCharsets.UTF_8)
        val dkLen = maxOf(64, boundedLength * 4)

        val spec: KeySpec = PBEKeySpec(
            masterSecret.toCharArray(),
            saltBytes,
            iterations,
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
                    val idx = readU16(i * 2) % CHARSET_PIN.length
                    chars.add(CHARSET_PIN[idx])
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
            else -> { // "full"
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

        // Deterministic Fisher-Yates uniform shuffle
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

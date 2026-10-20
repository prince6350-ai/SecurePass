package com.securepass

import com.securepass.crypto.SecurePassEngine
import org.junit.Assert.assertEquals
import org.junit.Test

class SecurePassEngineTest {

    @Test
    fun testEmptyIdentifierVector() {
        val pwd = SecurePassEngine.derivePassword(
            masterSecret = "MySuperSecretMasterKey2026!",
            accountIdentifier = "",
            length = 16,
            profile = "full"
        )
        assertEquals("fjZ+Y0*g^=70Z=x$", pwd)
    }

    @Test
    fun testGitHubVector() {
        val pwd = SecurePassEngine.derivePassword(
            masterSecret = "MySuperSecretMasterKey2026!",
            accountIdentifier = "github.com",
            length = 16,
            profile = "full"
        )
        assertEquals("}JzgK06+0i=7T^v9", pwd)
    }

    @Test
    fun testAwsAlphanumericVector() {
        val pwd = SecurePassEngine.derivePassword(
            masterSecret = "MySuperSecretMasterKey2026!",
            accountIdentifier = "aws.amazon.com",
            length = 20,
            profile = "alphanumeric"
        )
        assertEquals("tyrTv68FV1CY8Nj5TGZS", pwd)
    }

    @Test
    fun testPinVector() {
        val pwd = SecurePassEngine.derivePassword(
            masterSecret = "MySuperSecretMasterKey2026!",
            accountIdentifier = "atm-card",
            length = 6,
            profile = "pin"
        )
        assertEquals("522979", pwd)
    }
}

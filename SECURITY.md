# Security Policy & Cryptographic Threat Model
**Project:** SecurePass  
**Lead Developer:** Mohit Prajapati  

---

## 1. Threat Model & Security Guarantees

### What SecurePass Protects Against
1. **Cloud Vault Breaches:**  
   Because SecurePass maintains no central database, no accounts, and no cloud synchronization, there is zero data on any server to breach, leak, or sell.
2. **Rainbow Tables & Precomputed Hashes:**  
   The deterministic salt prefix (`SecurePass:v1:`) concatenated with the normalized website identifier prevents precomputed dictionary attacks across services.
3. **Cross-Service Credential Stuffing:**  
   Compromise of one service's password does not reveal the master secret or compromise passwords on other services.
4. **Network Eavesdropping (MitM):**  
   Secrets and derived passwords never travel across network sockets. All calculations take place strictly in local execution environments (browser Web Crypto, Python process, or local Android execution).

---

## 2. Inherent Privacy & Operational Limitations
Deterministic password derivation provides unmatched privacy from server breaches, but users must understand local system boundaries:

1. **Client Device Integrity:**  
   If the user's computer or mobile phone is infected with hardware keyloggers, screen recorders, memory scrapers, or malicious browser extensions, the master secret can be captured when typed.
2. **Master Secret Irrecoverability:**  
   If the user forgets their master secret, there is no &quot;Forgot Password&quot; reset mechanism. The mathematical derivation cannot be reversed.
3. **Clipboard Sniffing:**  
   Operating system clipboard managers or untrusted background applications can read copied text. Always paste passwords promptly and use the &quot;Clear Memory&quot; button.
4. **Compromise of Master Secret:**  
   If an adversary acquires both the master secret and knowledge of the user's visited services, they can derive identical passwords. Users must safeguard their master secret as a root private key.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability or cryptographic flaw in SecurePass:

1. **Do not open a public GitHub issue.**
2. Reach out directly to **Mohit Prajapati** via the verified security contact channels documented in his GitHub profile or LinkedIn.
3. Include a description of the issue, affected versions, and a proof of concept or mathematical analysis if applicable.
4. Security reports will be acknowledged within 48 hours and patched in a coordinated advisory.

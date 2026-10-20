# SecurePass — Chrome Extension (Manifest V3)
**Developer:** Mohit Prajapati  
**Architecture:** Zero-Storage, Client-Side Deterministic Derivation  

This folder contains a ready-to-load Chromium Manifest V3 extension.

---

## How to Load in Google Chrome / Brave / Edge

1. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
2. Enable **"Developer mode"** (toggle in the top-right corner).
3. Click **"Load unpacked"**.
4. Select the `extension/` directory from this project repository.
5. Click the **SecurePass** icon in your browser toolbar to generate passwords directly!

---

## Extension Privacy & Security Guarantees
- **No Background Tabs / Services:** The extension is purely an action popup. It does not run background service workers or track browsing history.
- **Zero Network Permissions:** No `http://*` or `https://*` host permissions are requested.
- **Minimal Permissions:** Only `clipboardWrite` is requested to allow copying the derived password when you click the copy button.
- **No Storage:** Does not store passwords in `chrome.storage.local` or `chrome.storage.sync`.

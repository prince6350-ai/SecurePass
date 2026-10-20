# SecurePass — Android Project (Kotlin & Jetpack Compose)
**Developer:** Mohit Prajapati  
**Package:** `com.securepass`  
**Security Model:** Zero Network Permissions (`INTERNET` permission omitted)  

---

## How to Build the Release APK in Android Studio

1. **Prerequisites:**
   - Android Studio Hedgehog (2023.1.1) or newer
   - JDK 17
   - Android SDK Platform 34

2. **Open Project:**
   - In Android Studio, select **File → Open** and choose the `android/` folder.
   - Wait for Gradle sync to complete.

3. **Run Unit Tests:**
   ```bash
   ./gradlew test
   ```
   All test vectors will execute against the native Kotlin `SecurePassEngine`.

4. **Build Release APK:**
   ```bash
   ./gradlew assembleRelease
   ```
   The APK will be generated at:
   `app/build/outputs/apk/release/app-release-unsigned.apk`

5. **Sign the APK:**
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore my-release-key.keystore app-release-unsigned.apk alias_name
   zipalign -v 4 app-release-unsigned.apk securepass-release.apk
   ```

---

## Hosting the APK for Direct Direct-Sideloading Download

1. Push your code to GitHub.
2. Create a new **GitHub Release** (e.g. `v1.0.0`).
3. Attach `securepass-release.apk` to the release assets.
4. Provide the direct release asset download link to your users.
5. Android users can tap the link to download and install directly (Android will prompt to allow installation from unknown sources).

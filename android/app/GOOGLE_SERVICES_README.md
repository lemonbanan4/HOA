# How to add google-services.json

This file is required for Firebase to work on Android. It is gitignored for security.

## Steps

1. Go to: https://console.firebase.google.com/project/hoa-tracker-e3316/settings/general
2. Scroll down to **"Your apps"**
3. Find the Android app with package name: `com.cogcore.boardvault`
   - If it doesn't exist yet, click **"Add app"** → Android, and enter package `com.cogcore.boardvault` and app name `BoardVault`
4. Click **"Download google-services.json"**
5. Place the downloaded file here: `android/app/google-services.json`
6. Re-run the release build:
   ```bash
   cd android && ./gradlew bundleRelease
   ```

## Notes

- The `build.gradle` handles the missing file gracefully — the build succeeds without it,
  but Firebase (Firestore, Auth, Analytics) won't work on device until it's added.
- This file is listed in `.gitignore` and must never be committed to source control.

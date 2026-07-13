# HOA Tracker Native Mobile & Backend Deployment Plan

This plan details how we will host the Express backend on Google Cloud/Firebase and wrap the React frontend into native iOS and Android projects using Capacitor, enabling app store publishing and tester invitations.

## User Review Required

> [!IMPORTANT]
> **Mobile App Architecture:** Mobile apps run client-side and cannot run the Express server locally on the device. We will host the Express backend on **Google Cloud Run** under the existing Firebase/GCP project (`hoa-tracker-e3316`), giving us a free HTTPS URL to connect the mobile apps to.
> 
> **Development Tools:** To build the final binaries for testing:
> 1. For Android (Google Play Store): You will need **Android Studio** installed locally.
> 2. For iOS (App Store / TestFlight): You will need a Mac with **Xcode** installed.

---

## Proposed Changes

### 1. Backend Deployment & Setup (Cloud Run)

We will configure and deploy the Express backend to Google Cloud Run.

#### [NEW] [Dockerfile](file:///Users/lemon/antigravity/HOA-Tracker/Dockerfile)
Create a Dockerfile to package the Express server and Vite frontend for production deployment on Cloud Run.

#### [MODIFY] [server.ts](file:///Users/lemon/antigravity/HOA-Tracker/server.ts)
Ensure the server correctly serves static files from `dist/` in production and binds to the `$PORT` environment variable.

---

### 2. Frontend Mobile Optimization

#### [MODIFY] [firebase.ts](file:///Users/lemon/antigravity/HOA-Tracker/src/firebase.ts)
Allow configuring the API base URL dynamically based on whether the app is running in development or as a compiled mobile app.

---

### 3. Capacitor Integration (Mobile Wrapper)

#### [NEW] [capacitor.config.json](file:///Users/lemon/antigravity/HOA-Tracker/capacitor.config.json)
Configure Capacitor to wrap the built web application (`dist`) with the bundle identifier `com.hoatracker.app`.

---

## Verification Plan

### Automated Build & Sync
1. Run `npm install` to install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, and `@capacitor/ios`.
2. Build the app using `npm run build`.
3. Initialize capacitor and add platforms:
   ```bash
   npx cap init "HOA Tracker" "com.hoatracker.app" --web-dir=dist
   npx cap add android
   npx cap add ios
   ```
4. Verify the `android/` and `ios/` native folders are generated.

### Manual Verification
- We will instruct the user on how to open the native projects in Android Studio / Xcode to run them on devices or upload them to Google Play Console / TestFlight.

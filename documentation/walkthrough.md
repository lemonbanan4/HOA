# Walkthrough: HOA Tracker Mobile & Backend Setup

We have successfully configured the HOA Tracker application to support mobile store deployment (Apple App Store & Google Play Store) and hosted the full-stack backend on Google Cloud Run.

## Deployed Services

- **Backend Cloud Run URL:** [hoa-tracker-backend](https://hoa-tracker-backend-350407592063.europe-west4.run.app)
- **Firestore Database:** Active on `hoa-tracker-e3316` using the named database `ai-studio-hoatracker-7ce99915-1128-4315-8a0a-7662d69d8678` with deployed rules.

---

## Action Plan: Compiling & Publishing

To request testers or publish the app, follow these steps to build the binaries from the generated native directories:

### 1. Android (Google Play Store / Play Console)
The native Android codebase has been generated in [android/](file:///Users/lemon/antigravity/HOA-Tracker/android).

1. Open **Android Studio**.
2. Select **Open an Existing Project** and choose the `android` folder in the `HOA-Tracker` directory.
3. In Android Studio, wait for Gradle to finish indexing.
4. To test: Click **Run** to launch the app on an Android Emulator or connected physical device.
5. To publish:
   - Go to **Build** > **Generate Signed Bundle / APK**.
   - Choose **Android App Bundle** (required for Play Store uploads).
   - Create/choose a Keystore, sign the app, and build the release `.aab` file.
   - Upload this `.aab` file to your **Google Play Console** under the **Internal Testing** or **Closed Testing** tracks.

### 2. iOS (Apple App Store / TestFlight)
The native iOS codebase has been generated in [ios/App/](file:///Users/lemon/antigravity/HOA-Tracker/ios/App).

1. Open a terminal and run `npx cap open ios` inside `HOA-Tracker`, or open the workspace file directly in Xcode:
   [App.xcworkspace](file:///Users/lemon/antigravity/HOA-Tracker/ios/App/App.xcworkspace)
2. In Xcode, click on the **App** project in the left sidebar.
3. Under the **Signing & Capabilities** tab, select your Apple Developer **Team** to generate a provisioning profile.
4. To test: Choose a Simulator or your connected iPhone/iPad, and click the **Play/Run** button.
5. To publish:
   - Select the target build device as **Any iOS Device (arm64)**.
   - Go to **Product** > **Archive**.
   - Once the archiving completes, use the Organizer window to click **Distribute App** and upload it to **App Store Connect**.
   - Once processed, you can invite testers instantly via **TestFlight**.

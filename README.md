# Home Kitchen — mobile

React Native with Expo, shipped through EAS. Three jobs, per [../PLANNING.md](../PLANNING.md): the shopping list with offline check-off, Today (cook from the plan), and marking pantry items low. Same API as the web app.

```bash
npm install --legacy-peer-deps
cp .env.example .env          # point EXPO_PUBLIC_API_URL at the backend
npx expo start                # then press i / a, or scan with Expo Go
npm test                      # jest-expo
npm run typecheck
npm run export                # Metro bundle for iOS + Android — proves it resolves without a device
```

**Offline.** Queries are cached on the device and served first (`networkMode: offlineFirst`); ticking an item or marking something low updates the screen immediately, and the write is queued while there is no signal, survives an app restart, and replays when the connection returns. Last write wins, which is fine at household scale because every write is an idempotent toggle.

`src/lib/types.ts` and `src/lib/format.ts` mirror the backend's `shared` shapes and formatter; nothing here computes quantities.

## Builds and updates (EAS)

Native builds run on EAS under [`@dhruv7393/home-kitchen`](https://expo.dev/accounts/dhruv7393/projects/home-kitchen); JS changes ship over the air through `expo-updates`. Same commands as Shleeji. There is no paid Apple Developer membership, so iPhones run the app in Expo Go (free) from the published update; Android gets a real APK.

```bash
npm run publish:prod -- "message"     # publish JS to the production branch: reaches the Android APK and Expo Go on iPhone
npm run build:android:prod            # new Android APK (only when native code, plugins, or app.json change)
npm run publish -- "message"          # same, to the preview branch
npm run build:android                 # preview APK
npm run build:ios:prod                # store-signed iOS build; needs a paid Apple Developer membership, so unused for now
```

- **iPhone (Expo Go).** Install Expo Go from the App Store and sign in as `dhruv7393`; the home screen lists this project, and opening it shows the `production` branch with the latest update. Any update's page on the EAS dashboard also has a QR code that opens it in Expo Go. Expo Go must support the project's SDK (57), so upgrade the SDK only when the App Store version of Expo Go has caught up. The `appVersion` runtime policy is fine for Expo Go on SDK 49 and later.
- **Android (APK).** Open the finished build's page on the dashboard from the phone, download the APK, and allow installs from that source. The APK checks the `production` channel on launch and picks up new publishes on the next launch.
- **Backend URL.** `eas build` and `eas update` run with `NODE_ENV=production`, so Expo reads the committed `.env.production` over the gitignored `.env`. Change the URL there once the backend is deployed, then `publish:prod` again; it must match the Vercel URL exactly.
- **When a native build is needed.** `runtimeVersion` follows `version` in `app.json`, and an update only reaches builds on the same version. After changing native modules, plugins, or `app.json`, bump the version and rebuild the APK (Expo Go is unaffected); for everything else `publish:prod` is enough. Production builds auto-increment the Android versionCode on EAS.
- **Credentials.** The Android keystore is generated and stored by EAS. If the Apple membership is ever bought, `build:ios:prod` sets up iOS signing after an Apple sign-in, and `eas submit --platform ios --latest` uploads to TestFlight; `ITSAppUsesNonExemptEncryption` is already false in `app.json` so TestFlight skips the export-compliance question.

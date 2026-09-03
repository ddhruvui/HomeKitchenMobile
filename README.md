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

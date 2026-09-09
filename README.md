# Recall (native)

Adult cognitive training games for iOS and Android.

Companion to the web app: [rickray/recall](https://github.com/rickray/recall) · [live](https://rickray.github.io/recall/)

**Stack:** React Native + Expo + TypeScript  
**App Identity:** `Recall` / `com.rickray.recall` (version 1.0.0)

## Getting Started

```bash
# Install dependencies
npm install

# Start local dev server
npx expo start
```

## Running Tests & Type Checks

```bash
# Run unit tests
npm test

# Run TypeScript compiler checks
npx tsc --noEmit
```

## EAS Builds

EAS Build configuration is defined in `eas.json` for internal/preview testing distribution.

```bash
# Build iOS preview (internal distribution / TestFlight)
eas build -p ios --profile preview

# Build Android preview (internal distribution / Play internal)
eas build -p android --profile preview
```

> **Note:** Running EAS cloud builds requires logging in via `eas login` and having configured Apple Developer / Google Play credentials or internal provisioning profiles in EAS.

## Spec & Architecture

See [docs/superpowers/specs/2026-09-09-recall-native-app-design.md](docs/superpowers/specs/2026-09-09-recall-native-app-design.md) and [docs/superpowers/plans/2026-09-09-recall-native-app.md](docs/superpowers/plans/2026-09-09-recall-native-app.md).

## Games

- **Sequence**: Memorize and repeat progressively longer sequences of auditory & visual signals.
- **N-back**: Match the current stimulus position to the one presented N steps back (1-back & 2-back).
- **Spatial Grid**: Recall flashed patterns and spatial coordinates across a 4×4 matrix.
- **Even Factors**: Mental math multiplication drill where factors end in even digits (2, 4, 6, 8).

No accounts. No ads. Offline play. Progress stays on device.

# Recall Native App — Design Spec

**Date:** 2026-09-09  
**Status:** Draft for review  
**Repo:** https://github.com/rickray/recall-app  
**Web source of truth:** https://github.com/rickray/recall (live: https://rickray.github.io/recall/)

## 1. Goal

Ship a standalone **iOS and Android** app for Recall: adult cognitive training games matching the web product, with the same privacy posture and dark adult UI. Web stays on GitHub Pages; this repo is the native product.

**In scope (v1):** Hub + Sequence, N-back, Spatial Grid, Even Factors. Offline. Local progress only. No accounts, ads, analytics, or IAP.

**Out of scope (v1):** Cloud sync, accounts, social, leaderboards, ads, paywalls, Capacitor wrap of the static site, PWA-as-primary, Kids Games / Gabrelia content.

**Success:** Installable builds via EAS (TestFlight + Play internal). Each game plays by the same rules as web. App works offline after first install. Progress survives restarts on device.

## 2. Product principles

Mirror the web README:

- Adult aesthetics: clean dark theme, no cartoon or juvenile styling
- Mobile-first, one-handed: large touch targets, thumb-friendly controls
- No friction: instant play, no onboarding wall, no account gate
- Privacy first: no tracking SDKs, no remote telemetry in v1
- Monetization later is allowed; v1 ships free and private

## 3. Architecture

| Choice | Decision |
|--------|----------|
| Stack | React Native + **Expo** (managed) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Persistence | `@react-native-async-storage/async-storage` |
| Audio | Expo Audio / simple synth tones (parity with web Web Audio cues) |
| Builds | EAS Build; TestFlight + Google Play internal testing |
| Game logic | Port from web JS modules; pure TS functions under `src/games/<name>/` testable without UI |

**Not chosen:** Capacitor shell of Pages site; Flutter; bare RN without Expo.

**Repo relationship:** New repo `rickray/recall-app`. Do not nest inside `rickray/recall`. When web rules change, port deliberately; no shared package in v1.

**Ownership:** Recall bot owns game fidelity. Cloud agent implements. Chief of Staff coordinates. No coding until this written spec is approved.

## 4. Screens and navigation

```
app/
  _layout.tsx          # root stack, dark theme
  index.tsx            # Hub
  sequence/index.tsx
  n-back/index.tsx
  grid/index.tsx
  even-factors/index.tsx
```

**Hub** matches web:

- Brand: Recall + short tagline
- Privacy pill: No accounts · No ads · Instant play
- Four game cards (title, tag, one-line desc) in web order: Sequence → N-back → Spatial Grid → Even Factors
- Footer principles strip: Offline / Zero tracking / One-handed

Each game screen: back to hub, game chrome, settings that exist on web for that game (modes, sound toggle).

## 5. Games (behavioral parity)

Source of truth is the live web folders under `rickray/recall`. Native must match rules, scoring, and streak semantics. UI may adapt to native controls but not change difficulty math.

### 5.1 Even Factors (build first)

Web: `even-factors/game.js`.

- Multiply drill: show factors `a` and `b`, player enters product
- Both factors end in even digit `{0,2,4,6,8}` (range 1–99 for valid set; singles are `2,4,6,8`)
- Modes: `mixed` (default), `1x1`, `1x2` as on web
  - `1x1`: both from single-digit factors
  - `1x2`: one single, one double-digit even-ending
  - `mixed`: at least one single-digit factor; other from full even-ending set
- No timer
- Numpad + Check + Skip; wrong answer clears input and resets current streak (calm retry); Skip reveals solution and resets streak
- Correct: increment solved total + current streak; update best streak; auto-advance after short success flash (~1.2s)
- Persist: `recall_evenfactors_solved_total`, `recall_evenfactors_streak_best`, sound enabled flag
- Current streak is session-only (not persisted), matching web

### 5.2 Sequence

Web: `sequence/`. Simon-style progressive auditory + visual sequential recall. Port level progression, input/feedback, and stored best/high scores exactly from web.

### 5.3 N-back

Web: `n-back/`. Working memory: match current stimulus to item N steps back. Port N settings, trial timing, score, and persistence keys from web.

### 5.4 Spatial Grid

Web: `grid/`. Visuospatial pattern recall on a matrix. Port board sizes, flash/recall phases, scoring, and persistence from web.

**Fidelity rule:** Before marking a game done, side-by-side check against https://rickray.github.io/recall/ for that game. Recall bot signs off on rules.

## 6. Data and privacy

- All progress on-device via AsyncStorage
- Prefer same key names as web `localStorage` where practical so mental model stays shared
- No network calls required for play after install
- No analytics, crash reporters, or ad SDKs in v1
- Optional later: sync / accounts / monetization behind an explicit product decision (not this spec)

## 7. UI / UX

- Dark theme tokens aligned with web (`#0d1117` background family, emerald accents for primary actions)
- Safe areas respected (notch / home indicator)
- Sound toggle per game (or shared `recall_sound_enabled`) default on; muted persists
- Haptics optional enhancement on correct/wrong; not required for parity
- No mandatory tutorial; short status copy on-screen like web

## 8. Project layout (target)

```
src/
  games/
    even-factors/   # pure logic + types + unit tests
    sequence/
    n-back/
    grid/
  storage/          # AsyncStorage helpers
  theme/
  audio/
app/                # Expo Router screens
docs/superpowers/specs/
```

Game logic units export generators, scorers, and reducers with no React imports so Jest/Vitest can cover them.

## 9. Build and ship plan

Ordered delivery:

1. Expo + TypeScript + Expo Router scaffold, theme, Hub shell
2. Even Factors (logic + screen + storage + sound)
3. Sequence
4. N-back
5. Spatial Grid
6. Polish (a11y labels, empty states, icon, splash)
7. EAS profiles; TestFlight + Play internal tracks

**App identity (v1 defaults):**

- Display name: `Recall`
- Bundle / application id: `com.rickray.recall` (change only if store conflict)
- Versioning: Expo `app.json` / `app.config`; semantic start at `1.0.0` for first store-ready build

Store listing copy and screenshots happen at step 7; not blocking earlier coding.

## 10. Testing

- Unit tests for each game’s pure logic (generators, mode constraints, streak updates)
- Manual device/simulator pass per game against web
- Even Factors: assert factor last digits, mode guarantees, streak reset on wrong/skip

## 11. Risks and non-goals

| Risk | Mitigation |
|------|------------|
| Subtle rule drift from web | Port from source files; Recall bot review; golden cases |
| Audio latency / silent mode on iOS | Document mute; soft failure if audio unavailable |
| Apple privacy questionnaire | Honest: no tracking, local data only |
| Scope creep (sync, IAP) | Explicitly deferred |

## 12. Open decisions (locked for v1)

| Topic | Decision |
|-------|----------|
| Scope | Full hub + four games |
| Approach | Native rewrite (Expo), not wrap |
| Privacy | Privacy-first now; monetize later OK |
| Repo | `rickray/recall-app` |
| Build order | Even Factors first |

No remaining product TBD for v1. Implementation plan follows after this spec is approved.

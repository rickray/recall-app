# Recall Native App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an Expo React Native iOS/Android app with Hub + Sequence, N-back, Spatial Grid, and Even Factors matching web rules, offline, privacy-first.

**Architecture:** Expo Router file routes; pure TypeScript game engines under `src/games/*` with no React imports; AsyncStorage for progress using the same keys as web `localStorage`; dark theme tokens aligned with web; port logic from `rickray/recall` (`sequence/game.js`, `n-back/game.js`, `grid/game.js`, `even-factors/game.js`).

**Tech Stack:** Expo (managed) + TypeScript + Expo Router + `@react-native-async-storage/async-storage` + Jest (or Expo jest-expo) + EAS Build.

**Spec:** `docs/superpowers/specs/2026-09-09-recall-native-app-design.md`  
**Web source:** https://github.com/rickray/recall (live https://rickray.github.io/recall/)

## Global Constraints

- No accounts, ads, analytics, crash SDKs, or IAP in v1
- Offline play after install; no required network calls for gameplay
- Bundle id / application id: `com.rickray.recall`; display name `Recall`; start version `1.0.0`
- Persist with web key names where listed below
- Shared sound flag: `recall_sound_enabled` (`'false'` means muted; anything else = on)
- Adult dark UI; background family `#0d1117`; primary actions emerald
- Game fidelity owned by Recall bot; side-by-side check vs live web before marking a game done
- Do not nest this app inside `rickray/recall`; work only in `rickray/recall-app`
- Prefer smaller pure-logic files; no React in `src/games/**`

## File map (create)

```
app/_layout.tsx
app/index.tsx
app/sequence/index.tsx
app/n-back/index.tsx
app/grid/index.tsx
app/even-factors/index.tsx
src/theme/colors.ts
src/storage/keys.ts
src/storage/asyncStore.ts
src/audio/sound.ts
src/games/even-factors/types.ts
src/games/even-factors/generate.ts
src/games/even-factors/engine.ts
src/games/sequence/types.ts
src/games/sequence/engine.ts
src/games/n-back/types.ts
src/games/n-back/generate.ts
src/games/n-back/score.ts
src/games/grid/types.ts
src/games/grid/engine.ts
src/components/GameHeader.tsx
src/components/StatusBanner.tsx
src/components/SummaryCard.tsx
__tests__/even-factors/generate.test.ts
__tests__/even-factors/engine.test.ts
__tests__/sequence/engine.test.ts
__tests__/n-back/generate.test.ts
__tests__/n-back/score.test.ts
__tests__/grid/engine.test.ts
app.json
eas.json
package.json
```

---

### Task 1: Expo scaffold, theme, Hub shell

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `app/_layout.tsx`, `app/index.tsx`, `src/theme/colors.ts`
- Test: manual Hub render on Expo Go / simulator

**Interfaces:**
- Produces: Expo Router Hub at `/`; theme `colors.bg = '#0d1117'`, `colors.emerald` for primary CTA; routes `/sequence`, `/n-back`, `/grid`, `/even-factors`

- [ ] **Step 1: Scaffold Expo app in repo root**

```bash
npx create-expo-app@latest . --template tabs -y
# Then strip unused tab template screens; switch to Expo Router app/ layout if template differs.
# Ensure dependencies include: expo-router, react-native-safe-area-context, react-native-screens, @react-native-async-storage/async-storage
```

Expected: `npx expo start` launches without error.

- [ ] **Step 2: Set app identity in `app.json`**

```json
{
  "expo": {
    "name": "Recall",
    "slug": "recall",
    "version": "1.0.0",
    "scheme": "recall",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "ios": { "bundleIdentifier": "com.rickray.recall", "supportsTablet": true },
    "android": { "package": "com.rickray.recall" },
    "plugins": ["expo-router"]
  }
}
```

- [ ] **Step 3: Add theme tokens**

Create `src/theme/colors.ts`:

```ts
export const colors = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  emerald: '#3fb950',
  amber: '#d29922',
  red: '#f85149',
  purple: '#a371f7',
} as const;
```

- [ ] **Step 4: Root layout + Hub**

`app/_layout.tsx`: Stack navigator, `contentStyle: { backgroundColor: colors.bg }`, header tint matching dark theme.

`app/index.tsx`: brand "Recall", tagline "Focused cognitive training and memory games.", privacy pill "No accounts · No ads · Instant play", four `Link` cards in order Sequence → N-back → Spatial Grid → Even Factors with web taglines, footer Offline / Zero tracking / One-handed.

Placeholder game routes can render a `Text` "Coming soon" until later tasks.

- [ ] **Step 5: Commit**

```bash
git add app app.json src/theme package.json package-lock.json tsconfig.json babel.config.js
git commit -m "feat: scaffold Expo Router hub and dark theme"
```

---

### Task 2: Shared storage + sound helpers

**Files:**
- Create: `src/storage/keys.ts`, `src/storage/asyncStore.ts`, `src/audio/sound.ts`
- Test: `__tests__/storage/asyncStore.test.ts` (optional thin wrapper test) or manual

**Interfaces:**
- Produces:
  - `STORAGE_KEYS` constants matching web
  - `getString(key)`, `setString(key, value)`, `getInt(key, fallback)`, `setInt(key, value)`
  - `createSoundController(): { enabled: boolean; load(): Promise<void>; toggle(): Promise<boolean>; playKey(); playSuccess(); playError(); playTone(index: number, seconds: number); }`

- [ ] **Step 1: Keys**

```ts
// src/storage/keys.ts
export const STORAGE_KEYS = {
  soundEnabled: 'recall_sound_enabled',
  evenFactorsSolvedTotal: 'recall_evenfactors_solved_total',
  evenFactorsStreakBest: 'recall_evenfactors_streak_best',
  sequenceBest: 'recall_sequence_best',
  gridBest: 'recall_grid_best',
  nbackBest: (n: 1 | 2) => `recall_nback_n${n}_best` as const,
} as const;
```

- [ ] **Step 2: AsyncStorage helpers**

```ts
// src/storage/asyncStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getInt(key: string, fallback = 0): Promise<number> {
  const v = await AsyncStorage.getItem(key);
  if (v === null) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function setInt(key: string, value: number): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

export async function getSoundEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem('recall_sound_enabled');
  return v !== 'false';
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem('recall_sound_enabled', enabled ? 'true' : 'false');
}
```

- [ ] **Step 3: Sound stub**

Implement `src/audio/sound.ts` that respects `getSoundEnabled` / `setSoundEnabled`. Soft-fail if audio unavailable (no throw). Tone frequencies can approximate web (Sequence pads 4 tones; success arpeggio; error saw-ish drop). Using `expo-av` Audio.Sound with short generated assets OR a minimal oscillator approach if available; if blocked, no-op when muted/unavailable is acceptable for v1 fidelity of *rules* (audio is best-effort).

- [ ] **Step 4: Commit**

```bash
git add src/storage src/audio
git commit -m "feat: add AsyncStorage keys and sound helpers"
```

---

### Task 3: Even Factors pure logic (TDD)

**Files:**
- Create: `src/games/even-factors/types.ts`, `generate.ts`, `engine.ts`
- Test: `__tests__/even-factors/generate.test.ts`, `__tests__/even-factors/engine.test.ts`

**Interfaces:**
- Produces:
  - `export type EvenFactorsMode = 'mixed' | '1x1' | '1x2'`
  - `generateProblem(mode: EvenFactorsMode, rng?: () => number): { a: number; b: number; product: number }`
  - `applyCorrect(state) / applyWrong(state) / applySkip(state)` updating solvedTotal, currentStreak, bestStreak (currentStreak not persisted)

- [ ] **Step 1: Write failing generate tests**

```ts
import { generateProblem, isEvenEnding } from '../../src/games/even-factors/generate';

test('both factors end in even digit', () => {
  for (let i = 0; i < 50; i++) {
    const p = generateProblem('mixed');
    expect(isEvenEnding(p.a)).toBe(true);
    expect(isEvenEnding(p.b)).toBe(true);
    expect(p.product).toBe(p.a * p.b);
  }
});

test('1x1 uses only 2,4,6,8', () => {
  for (let i = 0; i < 30; i++) {
    const p = generateProblem('1x1');
    expect([2, 4, 6, 8]).toContain(p.a);
    expect([2, 4, 6, 8]).toContain(p.b);
  }
});

test('mixed guarantees at least one single-digit factor', () => {
  for (let i = 0; i < 40; i++) {
    const p = generateProblem('mixed');
    expect(p.a < 10 || p.b < 10).toBe(true);
  }
});

test('1x2 is one single and one double-digit', () => {
  for (let i = 0; i < 40; i++) {
    const p = generateProblem('1x2');
    const singles = [p.a, p.b].filter((n) => n < 10).length;
    expect(singles).toBe(1);
  }
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest __tests__/even-factors/generate.test.ts -v
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement generate (port from web)**

```ts
// src/games/even-factors/generate.ts
export type EvenFactorsMode = 'mixed' | '1x1' | '1x2';

export function isEvenEnding(n: number): boolean {
  return [0, 2, 4, 6, 8].includes(n % 10);
}

function allEvenEndingFactors(): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 99; i++) if (isEvenEnding(i)) out.push(i);
  return out;
}

const ALL = allEvenEndingFactors();
const SINGLES = ALL.filter((n) => n < 10); // 2,4,6,8
const DOUBLES = ALL.filter((n) => n >= 10);

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateProblem(mode: EvenFactorsMode, rng: () => number = Math.random) {
  let a: number;
  let b: number;
  if (mode === '1x1') {
    a = pick(SINGLES, rng);
    b = pick(SINGLES, rng);
  } else if (mode === '1x2') {
    if (rng() < 0.5) {
      a = pick(SINGLES, rng);
      b = pick(DOUBLES, rng);
    } else {
      a = pick(DOUBLES, rng);
      b = pick(SINGLES, rng);
    }
  } else {
    const single = pick(SINGLES, rng);
    const other = pick(ALL, rng);
    if (rng() < 0.5) {
      a = single;
      b = other;
    } else {
      a = other;
      b = single;
    }
  }
  return { a, b, product: a * b };
}
```

- [ ] **Step 4: Engine tests + implementation**

```ts
// engine: on correct → solvedTotal++, currentStreak++, best = max(best, current)
// on wrong or skip → currentStreak = 0; skip reveals product (UI concern)
export type EvenFactorsState = {
  solvedTotal: number;
  currentStreak: number;
  bestStreak: number;
};

export function onCorrect(s: EvenFactorsState): EvenFactorsState {
  const currentStreak = s.currentStreak + 1;
  return {
    solvedTotal: s.solvedTotal + 1,
    currentStreak,
    bestStreak: Math.max(s.bestStreak, currentStreak),
  };
}

export function onWrongOrSkip(s: EvenFactorsState): EvenFactorsState {
  return { ...s, currentStreak: 0 };
}
```

Tests: correct bumps best; wrong resets current only; skip resets current.

- [ ] **Step 5: Run tests PASS + commit**

```bash
npx jest __tests__/even-factors -v
git add src/games/even-factors __tests__/even-factors
git commit -m "feat: Even Factors generate + streak engine with tests"
```

---

### Task 4: Even Factors screen

**Files:**
- Create: `app/even-factors/index.tsx`
- Modify: Hub card already links here
- Manual test vs https://rickray.github.io/recall/even-factors/

**Interfaces:**
- Consumes: `generateProblem`, `onCorrect`, `onWrongOrSkip`, `getInt`/`setInt` for solved + best, sound helpers
- Produces: playable Even Factors screen with modes Mixed / 1×2 / 1×1, numpad, Check, Skip

- [ ] **Step 1: Build UI**

Layout: GameHeader (back + sound), mode pills, stats (Solved / Streak / Best), status banner, factors `a × b`, answer display, numpad 0–9 + backspace + clear, Check + Skip.

Behavior (match web):
- Max 6 digits; leading-zero rules as web
- Empty Check → amber status "Please enter an answer first"
- Correct → persist solved + best; success flash; auto next after 1200ms
- Wrong → clear input, reset streak, keep problem
- Skip → show solution, reset streak, next via Check/Skip
- Current streak not persisted (session only); load solved/best on mount

- [ ] **Step 2: Manual fidelity check**

Play 5 problems per mode on device/simulator and web. Confirm factor constraints and streak semantics.

- [ ] **Step 3: Commit**

```bash
git add app/even-factors
git commit -m "feat: Even Factors screen with numpad and persistence"
```

---

### Task 5: Sequence engine + screen

**Files:**
- Create: `src/games/sequence/types.ts`, `src/games/sequence/engine.ts`, `app/sequence/index.tsx`
- Test: `__tests__/sequence/engine.test.ts`
- Web: `sequence/game.js` — 4 pads; start length 1; append random 0–3; best key `recall_sequence_best`

**Interfaces:**
- Produces:
  - `createInitialSequence(rng): number[]` → length-1 array of pad index 0–3
  - `extendSequence(seq, rng): number[]`
  - `stepSpeed(len): number` → `Math.max(220, 500 - len * 15)`
  - `gapSpeed(len): number` → `Math.max(120, 250 - len * 8)`
  - `evaluatePress(seq, playerStep, padIndex): 'continue' | 'level-complete' | 'fail'`

- [ ] **Step 1: Failing tests for evaluatePress + speeds**

```ts
test('correct mid-step continues', () => {
  expect(evaluatePress([0, 1, 2], 0, 0)).toBe('continue');
});
test('full match completes level', () => {
  expect(evaluatePress([0, 1], 1, 1)).toBe('level-complete');
});
test('wrong pad fails', () => {
  expect(evaluatePress([0, 1], 0, 2)).toBe('fail');
});
test('stepSpeed floors at 220', () => {
  expect(stepSpeed(100)).toBe(220);
});
```

- [ ] **Step 2: Implement engine**

```ts
export function evaluatePress(sequence: number[], playerStep: number, padIndex: number) {
  if (padIndex !== sequence[playerStep]) return 'fail';
  if (playerStep + 1 === sequence.length) return 'level-complete';
  return 'continue';
}

export function stepSpeed(len: number) {
  return Math.max(220, 500 - len * 15);
}
export function gapSpeed(len: number) {
  return Math.max(120, 250 - len * 8);
}
export function createInitialSequence(rng = Math.random) {
  return [Math.floor(rng() * 4)];
}
export function extendSequence(seq: number[], rng = Math.random) {
  return [...seq, Math.floor(rng() * 4)];
}
```

- [ ] **Step 3: Screen**

4 colored pads; Start / Restart; watch phase disables pads; on fail show SummaryCard with reached length + best; persist best via `recall_sequence_best` only when completedLength > best.

- [ ] **Step 4: Tests PASS, manual vs web, commit**

```bash
npx jest __tests__/sequence -v
git add src/games/sequence app/sequence __tests__/sequence
git commit -m "feat: Sequence game engine and screen"
```

---

### Task 6: N-back engine + screen

**Files:**
- Create: `src/games/n-back/types.ts`, `generate.ts`, `score.ts`, `app/n-back/index.tsx`
- Test: `__tests__/n-back/generate.test.ts`, `__tests__/n-back/score.test.ts`
- Web: `n-back/game.js` — 3×3 cells (0–8); N=1|2; totalTrials = 20 + N; stimulus 850ms; trial interval 1500ms; best keys `recall_nback_n1_best` / `recall_nback_n2_best` (percent accuracy string)

**Interfaces:**
- Produces:
  - `generateTrials(n: 1 | 2, rng): number[]` length `20 + n`, ~33% matches on test trials
  - `scoreRound(n, trials, responses): { hits, falseAlarms, misses, correctRejections, accuracy }` where accuracy = round((hits + correctRejections) / 20 * 100); null response on target = miss; null on non-target = correct rejection (match web finishRound)

- [ ] **Step 1: Score tests from web semantics**

```ts
test('accuracy uses 20 evaluated trials', () => {
  const n = 1;
  const trials = [0, 0, 1, 2 /* ... pad to length 21 in real test */];
  // Prefer constructing small fixture: for i>=n, known targets
});
```

Implement `scoreRound` exactly as web `finishRound` loop (indices `n .. totalTrials-1`).

- [ ] **Step 2: generateTrials port**

Warmup: first N random cells 0–8. Then 20 trials targeting ~`floor(20*0.33)` matches using web probability logic; non-match must not equal `list[i-N]`.

- [ ] **Step 3: Screen**

N toggles 1/2 (disabled mid-round); Start Round; 3×3 board; Match / No Match; progress; live hits/FA; summary accuracy/hits/FA/CR; persist best % when higher.

Timing: stimulus visible 850ms; advance trial every 1500ms.

- [ ] **Step 4: Tests + commit**

```bash
npx jest __tests__/n-back -v
git add src/games/n-back app/n-back __tests__/n-back
git commit -m "feat: N-back generate, score, and screen"
```

---

### Task 7: Spatial Grid engine + screen

**Files:**
- Create: `src/games/grid/types.ts`, `engine.ts`, `app/grid/index.tsx`
- Test: `__tests__/grid/engine.test.ts`
- Web: `grid/game.js` — 4×4 (16 cells); start length 3; flashDuration `min(1800, 750 + length*120)`; best `recall_grid_best`

**Interfaces:**
- Produces:
  - `generateTargetPattern(count, rng): number[]` unique indices in 0..15
  - `flashDuration(length): number`
  - `evaluateSelection(target: Set<number>, selected: Set<number>): boolean` — true iff sets equal size and every selected ∈ target (web checks selected ⊆ target with same size)

- [ ] **Step 1: Tests**

```ts
test('pattern has exact unique count', () => {
  const p = generateTargetPattern(5);
  expect(new Set(p).size).toBe(5);
  p.forEach((i) => expect(i).toBeGreaterThanOrEqual(0));
  p.forEach((i) => expect(i).toBeLessThan(16));
});
test('flashDuration caps at 1800', () => {
  expect(flashDuration(50)).toBe(1800);
  expect(flashDuration(3)).toBe(750 + 360);
});
test('evaluate requires exact set match', () => {
  expect(evaluateSelection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
  expect(evaluateSelection(new Set([1, 2, 3]), new Set([1, 2, 4]))).toBe(false);
});
```

- [ ] **Step 2: Implement + screen**

Start at length 3; on match increment length and persist best if `currentLength > best`; on fail show correct/wrong/missed styling then SummaryCard with reached length.

- [ ] **Step 3: Commit**

```bash
npx jest __tests__/grid -v
git add src/games/grid app/grid __tests__/grid
git commit -m "feat: Spatial Grid engine and screen"
```

---

### Task 8: Shared chrome polish + EAS profiles

**Files:**
- Create/Modify: `src/components/GameHeader.tsx`, `StatusBanner.tsx`, `SummaryCard.tsx`, `eas.json`, app icon/splash assets, README
- Manual: Hub → each game → back; sound toggle persists across games

- [ ] **Step 1: Extract shared chrome** used by all four games (back link, sound toggle bound to `recall_sound_enabled`, status banner variants success/error/amber/purple).

- [ ] **Step 2: Accessibility**

`accessibilityLabel` on pads/cells/numpad keys; large hit targets (≥44pt).

- [ ] **Step 3: `eas.json`**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

Document: `eas build -p ios --profile preview` and `eas build -p android --profile preview` for TestFlight / Play internal. Do not submit production store listing in this task unless Rick asks.

- [ ] **Step 4: Final fidelity pass**

With Recall bot: walk Even Factors, Sequence, N-back, Grid against live web. Fix rule deltas only.

- [ ] **Step 5: Commit**

```bash
git add src/components eas.json assets README.md
git commit -m "feat: shared chrome, a11y polish, EAS profiles"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Expo + TS + Expo Router | 1 |
| Privacy / offline / AsyncStorage keys | 2–7 |
| Hub four games | 1 |
| Even Factors modes + streaks | 3–4 |
| Sequence | 5 |
| N-back | 6 |
| Spatial Grid | 7 |
| EAS / TestFlight / Play internal | 8 |
| Build order Even Factors first | 3–4 before 5–7 |

## Self-review notes

- No TBD left for v1 product scope
- Storage key names match web
- Timing constants copied from web (`850`/`1500`, sequence speeds, grid flash formula)
- Audio is best-effort soft-fail; rules/persistence are hard requirements

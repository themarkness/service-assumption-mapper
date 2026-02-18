---
description: 
alwaysApply: true
---

# CLAUDE.md — Service Assumption Mapper

This file gives Claude and other AI agents the context needed to work effectively on this codebase.

---

## What this project is

A client-side web app for government product teams to map, score, and prioritise service assumptions using the **GDS Riskiest Assumption Testing (RAT)** methodology. There is no backend — all data is persisted to `localStorage`.

The core formula is: **Risk = Importance × (10 − Evidence)**

High risk scores surface assumptions that are both highly impactful and poorly evidenced — these are the ones to test first.

---

## Tech stack

| Layer | Choice | Version |
|---|---|---|
| UI framework | React | 19.2 |
| Language | TypeScript | 5.9 (strict) |
| State management | Zustand | 5.0 |
| Build tool | Vite | 7.2 |
| Styling | Tailwind CSS | 4.1 |
| Drag-and-drop (category view) | @dnd-kit | 6.3 / 10.0 |
| Drag-and-drop (grid view) | react-draggable | 4.5 |
| Pan/zoom (grid view) | react-zoom-pan-pinch | 3.7 |
| PDF export | jsPDF | 4.0 |
| Test runner | Vitest | 4.0 |
| Component testing | @testing-library/react | 16.3 |
| DOM environment | jsdom | 28 |
| Deployment | Vercel | (static) |

---

## Commands

```bash
npm run dev            # Start dev server (localhost:5173)
npm run build          # tsc -b && vite build  ← what Vercel runs
npm run lint           # ESLint
npm test               # Run all tests once
npm run test:watch     # Watch mode
npm run test:coverage  # Tests + coverage report (70% threshold on all metrics)
```

> **Important:** `npm run build` runs `tsc -b` first. TypeScript errors will break the Vercel deployment. Always verify the build passes before pushing.

---

## Project structure

```
src/
├── App.tsx                    # Root router — switches between views
├── main.tsx                   # Entry point (React StrictMode)
├── index.css                  # Global styles + Tailwind + component layers
│
├── types/
│   └── index.ts               # All shared types and constants
│                              # (Project, Assumption, Score, AssumptionWithCalculations,
│                              #  AssumptionCategory, ProjectPhase, CATEGORY_LABELS, etc.)
│
├── store/
│   └── useStore.ts            # Single Zustand store — ALL app state and actions
│
├── utils/
│   ├── calculations.ts        # Pure functions: risk score, averages, colour/label mapping
│   ├── storage.ts             # localStorage read/write (no direct localStorage calls elsewhere)
│   └── export.ts              # CSV, PDF (jsPDF), and JSON export
│
├── components/
│   ├── App.tsx                # Root view router
│   ├── WelcomeScreen.tsx      # First-run onboarding — captures user name
│   ├── ProjectsPage.tsx       # Project list dashboard
│   ├── ProjectModal.tsx       # Create / edit project form
│   ├── AssumptionModal.tsx    # Create / edit assumption form
│   ├── ScoreModal.tsx         # Importance + evidence sliders
│   ├── AssumptionCard.tsx     # Reusable card — rendered inside both views
│   ├── CategoryView.tsx       # 8-column DnD view (@dnd-kit)
│   └── GridView.tsx           # 2×2 matrix — react-draggable + zoom/pan
│
└── test/
    └── setup.ts               # Global Vitest setup — clears localStorage before/after each test
```

---

## Architecture

### State management

One Zustand store (`src/store/useStore.ts`) holds everything: projects, assumptions, current project, user name, view mode, and all modal open/close state.

**Rules:**
- All `localStorage` access goes through `src/utils/storage.ts` — never call `localStorage` directly in components or the store
- Store actions call storage utilities to persist, then call `set()` to update in-memory state
- Modal state is colocated in the store (e.g. `isScoreModalOpen`, `scoringAssumption`)

### Data model

```
Project
  └── has many Assumption
        └── has many Score (one per person — adding a second score from the same person replaces the first)
```

`AssumptionWithCalculations` is a derived type — `addCalculations()` from `calculations.ts` augments an `Assumption` with `averageImportance`, `averageConfidence`, and `riskScore`. Components receive this enriched type for display.

### No backend

There is intentionally no API. Everything lives in `localStorage`. `loadData()` in the store hydrates state from storage on app mount (called once in `App.tsx` via `useEffect`).

---

## TDD approach

This project follows TDD principles. Tests are **backfilled** and **maintained alongside source code** — all new features and bug fixes should be accompanied by tests.

### Setup

- Vitest runs in a `jsdom` environment with `globals: true`
- `src/test/setup.ts` clears `localStorage` before and after every test
- Test files sit **next to** source files: `Foo.tsx` → `Foo.test.tsx`

### Coverage thresholds

All four metrics must stay at **70% or above**:

```
statements: 70%   branches: 70%   functions: 70%   lines: 70%
```

Run `npm run test:coverage` to check. The build does **not** enforce coverage — but keep thresholds green.

### Key patterns

**Reset the store between tests** (copy this into every component/store test file):

```ts
function resetStore(overrides = {}) {
  useStore.setState({
    projects: [],
    assumptions: [],
    currentProjectId: null,
    userName: null,
    viewMode: 'category',
    isProjectModalOpen: false,
    isAssumptionModalOpen: false,
    isScoreModalOpen: false,
    editingAssumption: null,
    scoringAssumption: null,
    ...overrides,
  });
}

beforeEach(() => {
  resetStore();
});
```

**Seed localStorage when testing `App.tsx`** — `App` calls `loadData()` on mount which reads from `localStorage` and overwrites in-memory store state. Seed both together:

```ts
import { saveProject, setCurrentProject } from './utils/storage';

saveProject(project);           // seed localStorage
setCurrentProject(project.id);  // seed current project id
useStore.setState({ projects: [project], currentProjectId: project.id, viewMode: 'category' });
```

**Fixture factories** — keep test data consistent with named factory functions:

```ts
function makeProject(overrides: Partial<Project> = {}): Project { ... }
function makeAssumption(overrides: Partial<Assumption> = {}): Assumption { ... }
```

**Mocking `document.createElement` for export tests** — mock *after* `render()` and only intercept `'a'` tags so React's own DOM calls are unaffected:

```ts
render(<TopNav />);  // render first

const linkMock = { href: '', download: '', click: vi.fn() };
const origCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'a') return linkMock as unknown as HTMLElement;
  return origCreateElement(tag);
});
```

**Inspecting Blob content** — spy on the constructor rather than replacing it:

```ts
const blobSpy = vi.spyOn(globalThis, 'Blob');
exportToCSV(project, assumptions);
const [parts] = blobSpy.mock.calls[0] as [BlobPart[], BlobPropertyBag];
const content = (parts as string[]).join('');
expect(content).toContain('Assumption Text');
blobSpy.mockRestore();
```

### What is and isn't tested

| Module | Coverage | Notes |
|---|---|---|
| `utils/calculations.ts` | 100% | Pure functions — easy to test exhaustively |
| `utils/storage.ts` | 100% | jsdom provides localStorage |
| `utils/export.ts` | 100% | Blob spy pattern above |
| `store/useStore.ts` | 100% | Test all actions; reset store in beforeEach |
| `components/` (most) | 85–100% | Use @testing-library/react + userEvent |
| `GridView.tsx` | ~2% | react-draggable + zoom/pan — not unit-testable without heavy mocking; acceptable gap |

---

## TypeScript

Strict mode is fully enabled including `noUnusedLocals` and `noUnusedParameters`.

**Test files are excluded from the production build** (`tsconfig.app.json`):

```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"]
```

This means TypeScript errors in test files won't block `npm run build`, but Vitest still type-checks them during test runs. Keep test imports clean.

`vite.config.ts` imports `defineConfig` from `vitest/config` (not `vite`) so the `test` property is typed correctly.

---

## Core business logic reference

### Risk score formula

```
Risk = Importance × (10 − Evidence)
```

- `Importance` (1–10): How much damage if this assumption is wrong?
- `Evidence` (1–10): How much evidence supports it?
- Maximum risk = 100 (Importance 10, Evidence 0)
- Zero risk = 0 (fully evident, or zero importance)

### Risk thresholds

| Score | Label | CSS class |
|---|---|---|
| 0–30 | Low Risk | `bg-risk-low` |
| 31–60 | Medium Risk | `bg-risk-medium` |
| 61–100 | High Risk | `bg-risk-high` |

### The 8 assumption categories

`service` · `product` · `users` · `business_case` · `market` · `technology` · `delivery` · `stakeholders`

Labels and descriptions live in `src/types/index.ts` (`CATEGORY_LABELS`, `CATEGORY_DESCRIPTIONS`, `CATEGORY_COLORS`).

---

## Deployment

Vercel builds the project on every push. The build command is `npm run build` (`tsc -b && vite build`). TypeScript errors and unused imports **will fail the deployment**.

Before pushing:
1. `npm run build` — confirm it exits 0
2. `npm test` — confirm all tests pass
3. `npm run lint` — confirm no lint errors

Generated artefacts (`coverage/`, `*.pdf`, `*.csv`) are in `.gitignore` and should never be committed.

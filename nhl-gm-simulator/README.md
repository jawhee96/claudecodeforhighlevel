# NHL GM Simulator — Phase 1 Vertical Slice

A polished, offline-first **NHL General Manager Simulator** that runs entirely in
the browser. You manage an NHL franchise as its GM: set lines, manage the salary
cap, simulate games, track standings and statistics, read your inbox, and save
your progress — all with a deterministic simulation engine and local persistence.

This is **not** an on-ice arcade game. There is no manual gameplay. You make
personnel and organizational decisions; the engine generates the games and the
league around you.

> **Status:** MVP **Phase 1** is complete and playable. Phases 2–4 (trades,
> scouting, owner mode, playoffs, draft, offseason, league history) are
> scaffolded in the architecture but not yet implemented. See
> [Roadmap](#roadmap).

---

## ⚠️ Data honesty & intellectual property

**No copyrighted rosters, contracts, ratings, or logos are bundled.**

- **Real & factual:** the 32 NHL teams, their cities, divisions, conferences,
  and the league structure (public information).
- **Estimated / simulated:** every player, every rating, every contract, and the
  82-game schedule are **procedurally generated** and clearly flagged
  `estimated` throughout the UI. The game never silently presents invented
  figures as real.
- To play with **real, authorized July 20 2026 data**, use the import pipeline on
  the **Database** screen (see [Importing real data](#importing-the-july-20-2026-nhl-database)).

NHL team names, player names, league names, and related marks belong to their
respective rights holders. Public distribution of this prototype may require
licensing. Keep branding assets (logos via optional URL fields, user-supplied
images) separate from simulation data.

---

## Tech stack

React 18 · TypeScript (strict, no `any`) · Vite 6 · Tailwind CSS · React Router ·
Zustand · Dexie/IndexedDB · Recharts · Lucide · Vitest + Testing Library.

No backend is required. Service boundaries (`services/persistence`) are kept clean
so persistence can later move to SQLite/Postgres/Supabase/Electron/Tauri. **All
simulation logic lives outside React components** (`src/engine`).

---

## Quick start

```bash
cd nhl-gm-simulator
npm install
npm run dev        # start the dev server (prints a localhost URL)
```

Then in the app:

1. **New Franchise** → pick any of the 32 teams → set up your GM profile → **Start Franchise**.
2. You land in the **GM Office** dashboard.
3. Use the top-bar **simulation controls** (Next Game / 1d / 3d / 1w / 1m).
4. Explore Roster, Lines, Schedule, Standings, Statistics, Contracts, Salary Cap.
5. Save from **Settings**, or rely on autosave after every sim batch.
6. Close the tab and reopen — your franchise is still there (IndexedDB).

### Other scripts

```bash
npm run build      # typecheck (tsc -b) + production build
npm run typecheck  # types only
npm test           # run the Vitest suite (30 tests)
npm run preview    # serve the production build
```

---

## What was built (Phase 1)

| Area | Status |
|---|---|
| Project setup (Vite/TS strict/Tailwind/Zustand/Dexie/Recharts/Vitest) | ✅ |
| Core domain types (`src/types`) | ✅ |
| League rules in config (`src/data/leagueRules.ts`) | ✅ |
| 32 real teams + procedurally generated league (`src/data/seed.ts`) | ✅ |
| Seeded, reproducible RNG (`src/engine/random/rng.ts`) | ✅ |
| Possession-flavored game simulation with box scores & 3 stars | ✅ |
| 82-game schedule generator (balanced, labeled *Simulated*) | ✅ |
| Standings with correct NHL points & tiebreakers + playoff picture | ✅ |
| Salary-cap engine (active cap hit, space, floor, roster/contract limits) | ✅ |
| Line management (auto depth chart + chemistry, PP/PK units) | ✅ |
| Calendar / simulation controls with urgent-event interruption | ✅ |
| Injuries (occurrence, IR, recovery over games) | ✅ |
| Inbox system (categorized, priority, read/archive) | ✅ |
| Dashboard, Roster, Lines, Schedule, Standings, Statistics, Contracts, Cap | ✅ |
| Database status screen + validation report + import pipeline | ✅ |
| Save/Load/Duplicate/Delete + JSON export/import (Dexie) | ✅ |
| Tests: cap, standings, sim reproducibility, schedule, validation, integration | ✅ (30) |

### What remains (not in Phase 1)

Trades & AI GMs, contract negotiations, waivers UI, full scouting, prospects &
draft, AHL, owner mode, finances, media/press conferences, staff, playoffs
bracket sim, awards, offseason, multi-season player development, and persistent
league history. The type model and folder structure were designed so these slot
in without breaking existing saves.

---

## How the simulation stays reproducible

Every random draw flows through a seeded `mulberry32` PRNG (`src/engine/random`).
Each game is seeded from `franchise.rngState + gameId`, so the **same franchise
seed always produces the same season**. The integration test asserts that two
franchises created from the same seed have identical standings after 40 days, and
that a save reloaded from IndexedDB is byte-for-byte identical
(`JSON.stringify(reloaded) === JSON.stringify(original)`).

---

## Where the data snapshot is stored

- A franchise is a **single self-contained object** (teams, players, contracts,
  schedule, standings, lines, inbox, seed state, snapshot metadata).
- It is persisted in **IndexedDB** under database `nhl-gm-simulator`, table
  `franchises`, via Dexie (`src/services/persistence/db.ts`). Nothing is sent
  over the network.
- You can **export** any franchise to a JSON file (Home screen or Settings) and
  **import** it back on another machine.

---

## Importing the July 20 2026 NHL database

The app works fully offline with its generated league. To overlay real,
**authorized** data:

1. Go to **Database** in the left nav.
2. Click **Download Sample Format** to get the import envelope shape.
3. Prepare a JSON file:

```json
{
  "meta": {
    "snapshotDate": "2026-07-20",
    "sources": ["your-authorized-source"],
    "notes": "Real roster/contract overlay"
  },
  "players": [
    { "id": "P00001", "firstName": "…", "lastName": "…", "overall": 91, "dataStatus": "user-edited" }
  ],
  "contracts": [
    { "id": "C_P00001", "aav": 12600000, "dataStatus": "user-edited" }
  ]
}
```

4. Click **Import JSON**. Matching records are merged by `id` (unknown ids are
   appended). Imported fields are flagged **user-edited** — never invented
   silently. Then re-run validation on the same screen.

The import/merge logic lives in `src/data/importSchema.ts`; validation in
`src/data/validation.ts`.

### Verified vs estimated vs missing

The **Database** screen reports, for the loaded snapshot: counts of teams /
players / contracts / games, **estimated fields**, **missing fields**, blocking
**errors**, and **warnings**, plus a downloadable JSON validation report. In the
shipped seed: team identity/structure is **verified**; all player ratings and
contracts are **estimated**; nothing is marked verified that isn't.

---

## Project structure

```
src/
  app/            App routes
  components/      Layout, SimControls, shared UI
  pages/           One file per screen (Dashboard, Roster, Lines, …)
  data/            leagueRules, teams (32 real), names, seed generator,
                   validation, importSchema
  engine/          random/ (seeded RNG), gameSim, schedule, standings,
                   salaryCap, lines, sim (day advance + injuries)
  services/        createFranchise, persistence/ (Dexie)
  state/           franchiseStore (Zustand)
  types/           domain model
  utils/           formatting helpers
  tests/           Vitest suites (unit + integration)
```

---

## Roadmap

- **Phase 2:** Trades + AI GM valuation, contract negotiation, waivers, scouting,
  prospects, AHL, morale events.
- **Phase 3:** Owner mode, finances, media & press conferences, staff, trade
  deadline, monthly reports.
- **Phase 4:** Playoffs, awards, offseason, draft, free agency, multi-season
  development, persistent league history.

A `NarrativeService` interface is planned so an optional external LLM can later
generate richer text **without ever mutating game state** — the deterministic
engine remains the single source of truth.

---

## License / disclaimer

Prototype for private testing and development. NHL team names, player names,
league names, and related marks belong to their respective rights holders. Do not
distribute publicly without appropriate licensing.

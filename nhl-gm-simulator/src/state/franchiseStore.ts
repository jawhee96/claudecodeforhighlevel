import { create } from 'zustand';
import type { Franchise, InboxMessage, LineConfig } from '@/types';
import { createFranchise, type NewFranchiseOptions } from '@/services/createFranchise';
import {
  loadFranchise as dbLoad,
  saveFranchise as dbSave,
} from '@/services/persistence/db';
import { simulateOneDay } from '@/engine/sim';

interface SimProgress {
  running: boolean;
  daysSimulated: number;
  gamesSimulated: number;
}

interface FranchiseState {
  franchise: Franchise | null;
  loading: boolean;
  sim: SimProgress;
  lastStopReason: string | null;

  newGame: (opts: NewFranchiseOptions) => Promise<Franchise>;
  load: (id: string) => Promise<void>;
  save: () => Promise<void>;
  setFranchise: (f: Franchise | null) => void;

  advanceDays: (days: number, stopOnUrgent?: boolean) => Promise<void>;
  advanceToDate: (targetIso: string, stopOnUrgent?: boolean) => Promise<void>;
  advanceToNextGame: () => Promise<void>;

  markRead: (id: string) => void;
  archiveMessage: (id: string) => void;
  addMessage: (m: InboxMessage) => void;
  setLines: (teamId: string, lines: LineConfig) => void;
}

/** Clone so React sees a new reference and re-renders after in-place mutation. */
function commit(set: (partial: Partial<FranchiseState>) => void, f: Franchise): void {
  set({ franchise: { ...f } });
}

export const useFranchiseStore = create<FranchiseState>((set, get) => ({
  franchise: null,
  loading: false,
  sim: { running: false, daysSimulated: 0, gamesSimulated: 0 },
  lastStopReason: null,

  async newGame(opts) {
    const f = createFranchise(opts);
    await dbSave(f);
    set({ franchise: f });
    return f;
  },

  async load(id) {
    set({ loading: true });
    const f = await dbLoad(id);
    set({ franchise: f ?? null, loading: false });
  },

  async save() {
    const f = get().franchise;
    if (f) await dbSave(f);
  },

  setFranchise(f) {
    set({ franchise: f });
  },

  async advanceDays(days, stopOnUrgent = true) {
    const f = get().franchise;
    if (!f) return;
    set({ sim: { running: true, daysSimulated: 0, gamesSimulated: 0 }, lastStopReason: null });
    let daysDone = 0;
    let gamesDone = 0;
    let stopReason: string | null = null;
    for (let i = 0; i < days; i++) {
      const step = simulateOneDay(f);
      daysDone++;
      gamesDone += step.gamesPlayed;
      if (stopOnUrgent && step.stopped) {
        stopReason = step.stopReason ?? 'Urgent event';
        break;
      }
    }
    await dbSave(f);
    set({
      sim: { running: false, daysSimulated: daysDone, gamesSimulated: gamesDone },
      lastStopReason: stopReason,
    });
    commit(set, f);
  },

  async advanceToDate(targetIso, stopOnUrgent = true) {
    const f = get().franchise;
    if (!f) return;
    const target = new Date(targetIso).getTime();
    const span = Math.max(0, Math.ceil((target - new Date(f.currentDate).getTime()) / 86_400_000));
    await get().advanceDays(span, stopOnUrgent);
  },

  async advanceToNextGame() {
    const f = get().franchise;
    if (!f) return;
    // Find next scheduled unplayed game for the user's team.
    const upcoming = f.schedule
      .filter((g) => !g.played && (g.homeTeamId === f.userTeamId || g.awayTeamId === f.userTeamId))
      .filter((g) => g.date >= f.currentDate)
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    if (!upcoming) return;
    // Simulate through the day of that game (inclusive).
    const span = Math.max(1, Math.ceil((new Date(upcoming.date).getTime() - new Date(f.currentDate).getTime()) / 86_400_000) + 1);
    await get().advanceDays(span, true);
  },

  markRead(id) {
    const f = get().franchise;
    if (!f) return;
    const m = f.inbox.find((x) => x.id === id);
    if (m) m.read = true;
    commit(set, f);
  },

  archiveMessage(id) {
    const f = get().franchise;
    if (!f) return;
    const m = f.inbox.find((x) => x.id === id);
    if (m) m.archived = true;
    commit(set, f);
  },

  addMessage(msg) {
    const f = get().franchise;
    if (!f) return;
    f.inbox.unshift(msg);
    commit(set, f);
  },

  setLines(teamId, lines) {
    const f = get().franchise;
    if (!f) return;
    f.lines[teamId] = lines;
    commit(set, f);
    void dbSave(f);
  },
}));

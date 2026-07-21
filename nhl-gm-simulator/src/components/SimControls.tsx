import { Play, FastForward, SkipForward } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';

/** Calendar / simulation controls shown in the top bar. */
export function SimControls() {
  const advanceDays = useFranchiseStore((s) => s.advanceDays);
  const advanceToNextGame = useFranchiseStore((s) => s.advanceToNextGame);
  const running = useFranchiseStore((s) => s.sim.running);

  return (
    <div className="flex items-center gap-1">
      <button className="btn px-2 py-1" disabled={running} onClick={() => advanceToNextGame()} title="Simulate to next game">
        <Play size={14} /> Next Game
      </button>
      <button className="btn px-2 py-1" disabled={running} onClick={() => advanceDays(1)} title="Simulate 1 day">
        1d
      </button>
      <button className="btn px-2 py-1" disabled={running} onClick={() => advanceDays(3)} title="Simulate 3 days">
        3d
      </button>
      <button className="btn px-2 py-1" disabled={running} onClick={() => advanceDays(7)} title="Simulate 1 week">
        <FastForward size={14} /> 1w
      </button>
      <button className="btn px-2 py-1" disabled={running} onClick={() => advanceDays(30)} title="Simulate 1 month">
        <SkipForward size={14} /> 1m
      </button>
    </div>
  );
}

import { renderHook } from '@testing-library/react';
import { useDropOutcomes, OutcomeType } from '@/hooks/drops/useDropOutcomes';
import { ApiWaveOutcomeCredit } from '@/generated/models/ApiWaveOutcomeCredit';
import { ApiWaveOutcomeType } from '@/generated/models/ApiWaveOutcomeType';

it('returns empty outcomes when drop has no rank', () => {
  const drop: any = { rank: null };
  const wave: any = {};
  const { result } = renderHook(() => useDropOutcomes({ drop, wave }));
  expect(result.current.haveOutcomes).toBe(false);
  expect(result.current.outcomes.nicOutcomes).toHaveLength(0);
});

it('maps wave outcomes by rank', () => {
  const drop: any = { rank: 2 };
  const wave: any = {
    outcomes: [
      {
        credit: ApiWaveOutcomeCredit.Cic,
        distribution: [{ amount: 10 }, { amount: 20 }],
      },
      {
        credit: ApiWaveOutcomeCredit.Rep,
        rep_category: 'A',
        distribution: [{ amount: 1 }, { amount: 2 }],
      },
      {
        type: ApiWaveOutcomeType.Manual,
        distribution: [{ description: 'x' }, { description: 'y' }],
      },
    ],
  };
  const { result } = renderHook(() => useDropOutcomes({ drop, wave }));
  expect(result.current.haveOutcomes).toBe(true);
  expect(result.current.outcomes.nicOutcomes).toEqual([
    { type: OutcomeType.NIC, value: 20 },
  ]);
  expect(result.current.outcomes.repOutcomes).toEqual([
    { type: OutcomeType.REP, value: 2, category: 'A' },
  ]);
  expect(result.current.outcomes.manualOutcomes).toEqual([
    { type: OutcomeType.MANUAL, description: 'y' },
  ]);
});

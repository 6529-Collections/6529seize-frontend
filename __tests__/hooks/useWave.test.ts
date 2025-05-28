import { renderHook } from '@testing-library/react';
import { useWave, SubmissionStatus } from '../../hooks/useWave';

jest.mock('../../contexts/SeizeSettingsContext', () => ({ useSeizeSettings: () => ({ isMemesWave: (id: string) => id === 'memes' }) }));
jest.mock('../../helpers/time', () => ({ Time: { currentMillis: jest.fn(() => 2000) } }));

describe('useWave', () => {
  const baseWave: any = {
    id: 'wave1',
    participation: {
      no_of_applications_allowed_per_participant: 2,
      period: { min: 1000, max: 3000 },
      authenticated_user_eligible: true,
    },
    voting: { period: { min: 1000, max: 3000 } },
    chat: { authenticated_user_eligible: true, enabled: true, scope: { group: { is_direct_message: false } } },
    metrics: { your_participation_drops_count: 1 },
    wave: { decisions_strategy: { subsequent_decisions: [] }, type: 'RANK' },
  };

  it('determines submission status based on time', () => {
    const { result } = renderHook(() => useWave(baseWave));
    expect(result.current.participation.status).toBe(SubmissionStatus.ACTIVE);
    expect(result.current.participation.remainingSubmissions).toBe(1);
    const time = require('../../helpers/time');
    time.Time.currentMillis.mockReturnValue(4000);
    const { result: ended } = renderHook(() => useWave(baseWave));
    expect(ended.current.participation.status).toBe(SubmissionStatus.ENDED);
  });

  it('flags memes wave', () => {
    const wave = { ...baseWave, id: 'memes' };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.isMemesWave).toBe(true);
  });
});

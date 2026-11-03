import { renderHook } from "@testing-library/react";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isMemesWave: (id: string) => id === "memes",
    isCurationWave: (id: string) => id === "curation",
    isQuorumWave: (id: string) => id === "quorum",
  }),
}));
jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 2000) },
}));

describe("useWave", () => {
  beforeEach(() => {
    jest.mocked(Time.currentMillis).mockReturnValue(2000);
  });

  const baseWave: any = {
    id: "wave1",
    participation: {
      no_of_applications_allowed_per_participant: 2,
      period: { min: 1000, max: 3000 },
      authenticated_user_eligible: true,
    },
    voting: { period: { min: 1000, max: 3000 } },
    chat: {
      authenticated_user_eligible: true,
      enabled: true,
      scope: { group: { is_direct_message: false } },
    },
    metrics: { your_participation_drops_count: 1 },
    wave: { decisions_strategy: { subsequent_decisions: [] }, type: "RANK" },
  };

  it("determines submission status based on time", () => {
    const { result } = renderHook(() => useWave(baseWave));
    expect(result.current.participation.status).toBe(SubmissionStatus.ACTIVE);
    expect(result.current.participation.remainingSubmissions).toBe(1);
    const time = require("@/helpers/time");
    time.Time.currentMillis.mockReturnValue(4000);
    const { result: ended } = renderHook(() => useWave(baseWave));
    expect(ended.current.participation.status).toBe(SubmissionStatus.ENDED);
  });

  it("flags memes wave", () => {
    const wave = { ...baseWave, id: "memes" };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.isMemesWave).toBe(true);
  });

  it("closes manually ended competitions without a scheduled deadline", () => {
    const wave = {
      ...baseWave,
      participation: { ...baseWave.participation, period: {} },
      competition: {
        wave_id: baseWave.id,
        lifecycle: "ENDED",
        participation: { ends_at: null },
        capabilities: [],
      },
    };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.participation.status).toBe(SubmissionStatus.ENDED);
    expect(result.current.participation.canSubmitNow).toBe(false);
    expect(result.current.participation.endTime).toBe(0);
  });

  it.each([null, 9000])(
    "preserves a manual closure received after mount with deadline %s",
    (scheduledEnd) => {
      const wave = {
        ...baseWave,
        participation: {
          ...baseWave.participation,
          period: { min: 1000, max: scheduledEnd },
        },
        competition: {
          wave_id: baseWave.id,
          lifecycle: "ACTIVE",
          ended_at: null as number | null,
          participation: { ends_at: scheduledEnd },
          capabilities: [],
        },
      };
      const { result, rerender } = renderHook(
        ({ currentWave }) => useWave(currentWave),
        { initialProps: { currentWave: wave } }
      );
      expect(result.current.participation.status).toBe(SubmissionStatus.ACTIVE);

      jest.mocked(Time.currentMillis).mockReturnValue(5000);
      rerender({
        currentWave: {
          ...wave,
          competition: {
            ...wave.competition,
            lifecycle: "ENDED",
            ended_at: 4000,
          },
        },
      });

      expect(result.current.participation.status).toBe(SubmissionStatus.ENDED);
      expect(result.current.participation.canSubmitNow).toBe(false);
      expect(result.current.participation.endTime).toBe(4000);
    }
  );

  it("flags curation wave", () => {
    const wave = { ...baseWave, id: "curation" };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.isCurationWave).toBe(true);
  });

  it("flags quorum wave", () => {
    const wave = { ...baseWave, id: "quorum" };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.isQuorumWave).toBe(true);
  });

  it("flags approve wave", () => {
    const wave = {
      ...baseWave,
      wave: { ...baseWave.wave, type: ApiWaveType.Approve },
    };
    const { result } = renderHook(() => useWave(wave));
    expect(result.current.isApproveWave).toBe(true);
    expect(result.current.isRankWave).toBe(false);
  });
});

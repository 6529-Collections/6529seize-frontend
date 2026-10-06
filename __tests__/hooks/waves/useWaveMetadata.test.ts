import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { WaveDisplayMetadataContext } from "@/contexts/WaveDisplayMetadataContext";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { useQuery } from "@tanstack/react-query";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WAVE_DISPLAY_METADATA_KEYS } from "@/helpers/waves/wave-metadata.helpers";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import {
  useWaveOutcomeVisibility,
  useApproveWaveCustomTabLabels,
  useWaveSubmissionButtonLabel,
  useWaveSubmissionButtonLabelOverride,
} from "@/hooks/waves/useWaveMetadata";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;

const createWave = (type: ApiWaveType): ApiWave =>
  ({
    id: "wave-1",
    wave: { type },
  }) as ApiWave;

describe("useWaveOutcomeVisibility", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "hides outcomes for %s waves until metadata is loaded",
    (waveType) => {
      const { result } = renderHook(() =>
        useWaveOutcomeVisibility(createWave(waveType))
      );

      expect(result.current).toBe(false);
    }
  );

  it("hides outcomes when loaded metadata says outcomes are hidden", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(false);
  });

  it("shows outcomes when loaded metadata has no visibility row", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(true);
  });

  it("shows outcomes when loaded metadata has an invalid visibility value", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "hidden",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Approve))
    );

    expect(result.current).toBe(true);
  });

  it.each([ApiWaveType.Chat, null])(
    "shows outcomes for non-competition wave state %s",
    (waveType) => {
      const wave = waveType === null ? null : createWave(waveType);

      const { result } = renderHook(() => useWaveOutcomeVisibility(wave));

      expect(result.current).toBe(true);
    }
  );

  it("uses existing metadata data when a background refetch errors", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ],
      isError: true,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(false);
  });
});

describe("competition appearance scope", () => {
  const parentMetadata = [
    {
      id: 1,
      data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
      data_value: "Parent action",
    },
  ];
  let metadata: ApiWaveMetadata[];
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(WaveDisplayMetadataContext.Provider, {
      value: { waveId: "wave-1", metadata },
      children,
    });
  const useLabel = (waveId = "wave-1") =>
    useWaveSubmissionButtonLabel({
      waveId,
      submissionExperience: WaveSubmissionExperience.DEFAULT,
    });

  beforeEach(() => {
    useQueryMock.mockReturnValue({ data: parentMetadata });
    metadata = [];
  });

  it("uses native presentation immediately and updates after an appearance edit", () => {
    metadata = [{ ...parentMetadata[0]!, data_value: "Enter competition" }];
    const { result, rerender } = renderHook(() => useLabel(), { wrapper });
    expect(result.current).toBe("Enter competition");
    expect(useQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    );
    metadata = [{ ...parentMetadata[0]!, data_value: "Nominate" }];
    rerender();
    expect(result.current).toBe("Nominate");
  });

  it("uses competition defaults when native presentation is empty", () => {
    const { result } = renderHook(() => useLabel(), { wrapper });
    expect(result.current).toBe("Drop");
  });

  it("preserves parent metadata outside the native scope and for other waves", () => {
    expect(renderHook(() => useLabel()).result.current).toBe("Parent action");
    metadata = [{ ...parentMetadata[0]!, data_value: "Enter competition" }];
    expect(
      renderHook(() => useLabel("wave-2"), { wrapper }).result.current
    ).toBe("Parent action");
    expect(useQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it("uses native Approve labels and outcome visibility", () => {
    metadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Candidates",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
      {
        id: 3,
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "false",
      },
    ];
    const { result } = renderHook(
      () => ({
        labels: useApproveWaveCustomTabLabels(createWave(ApiWaveType.Approve)),
        outcomes: useWaveOutcomeVisibility(createWave(ApiWaveType.Approve)),
      }),
      { wrapper }
    );
    expect(result.current).toEqual({
      labels: { approvals: "Candidates", approved: "Selected" },
      outcomes: false,
    });
  });
});

describe("wave submission button label hooks", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses the default label while metadata is not loaded", () => {
    const { result } = renderHook(() =>
      useWaveSubmissionButtonLabel({
        submissionExperience: WaveSubmissionExperience.DEFAULT,
        waveId: "wave-1",
      })
    );

    expect(result.current).toBe("Drop");
  });

  it("uses the custom label from metadata", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
          data_value: "Apply",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveSubmissionButtonLabel({
        submissionExperience: WaveSubmissionExperience.QUORUM_PROPOSAL,
        waveId: "wave-1",
      })
    );

    expect(result.current).toBe("Apply");
  });

  it("returns only the custom override for override consumers", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
          data_value: "Apply",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveSubmissionButtonLabelOverride({
        waveId: "wave-1",
      })
    );

    expect(result.current).toBe("Apply");
  });

  it("returns null when no override is configured", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveSubmissionButtonLabelOverride({
        waveId: "wave-1",
      })
    );

    expect(result.current).toBeNull();
  });
});

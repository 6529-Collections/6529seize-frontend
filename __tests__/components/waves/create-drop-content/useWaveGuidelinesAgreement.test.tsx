import { act, renderHook, waitFor } from "@testing-library/react";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { fetchWaveMetadata } from "@/services/api/waves-v2-api";
import { useWaveGuidelinesAgreement } from "@/components/waves/create-drop-content/useWaveGuidelinesAgreement";

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveMetadata: jest.fn(),
}));

const fetchWaveMetadataMock = jest.mocked(fetchWaveMetadata);

// Sent-message memory lasts for the page session, so each test uses its own
// wave unless it names one.
let currentWaveId = "wave-0";

const createWave = ({
  chatDrops = 0,
  participationDrops = 0,
  waveId = currentWaveId,
}: {
  readonly chatDrops?: number;
  readonly participationDrops?: number;
  readonly waveId?: string;
} = {}): ApiWave =>
  ({
    id: waveId,
    metrics: {
      your_drops_count: chatDrops,
      your_participation_drops_count: participationDrops,
    },
  }) as ApiWave;

const guidelinesMetadata = [
  {
    id: 1,
    data_key: "wave_display.rules.custom",
    data_value: "Be thoughtful and stay on topic.",
  },
];

describe("useWaveGuidelinesAgreement", () => {
  let testNumber = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchWaveMetadataMock.mockResolvedValue([]);
    testNumber += 1;
    currentWaveId = `wave-${testNumber}`;
  });

  it.each([
    ["chat message", createWave({ chatDrops: 1 })],
    ["participation drop", createWave({ participationDrops: 1 })],
  ])("skips the dialog after an existing %s", async (_label, wave) => {
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-1", wave })
    );

    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Chat)
    ).resolves.toBe("accepted");
    expect(fetchWaveMetadataMock).not.toHaveBeenCalled();
    expect(result.current.dialogGuidelines).toBeNull();
  });

  it("does not gate participation-drop submissions", async () => {
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave(),
      })
    );

    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Participatory)
    ).resolves.toBe("accepted");
    expect(fetchWaveMetadataMock).not.toHaveBeenCalled();
  });

  it("submits without a dialog when the wave has no guidelines", async () => {
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave(),
      })
    );

    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Chat)
    ).resolves.toBe("accepted");
    expect(fetchWaveMetadataMock).toHaveBeenCalledWith({
      waveId: currentWaveId,
    });
    expect(result.current.dialogGuidelines).toBeNull();
  });

  it("declines without remembering agreement and opens again on retry", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave(),
      })
    );

    let firstRequest!: Promise<string>;
    act(() => {
      firstRequest = result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() =>
      expect(result.current.dialogGuidelines).toBe(
        "Be thoughtful and stay on topic."
      )
    );

    act(() => result.current.declineGuidelines());
    await expect(firstRequest).resolves.toBe("declined");
    expect(result.current.dialogGuidelines).toBeNull();

    let secondRequest!: Promise<string>;
    act(() => {
      secondRequest = result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() =>
      expect(result.current.dialogGuidelines).toBe(
        "Be thoughtful and stay on topic."
      )
    );

    act(() => result.current.agreeToGuidelines());
    await expect(secondRequest).resolves.toBe("accepted");
    act(() => result.current.markChatSubmitted());
    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Chat)
    ).resolves.toBe("accepted");
    expect(fetchWaveMetadataMock).toHaveBeenCalledTimes(2);
  });

  it("does not remember agreement until the chat is submitted", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave(),
      })
    );

    let firstRequest!: Promise<string>;
    act(() => {
      firstRequest = result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() => expect(result.current.dialogGuidelines).not.toBeNull());
    act(() => result.current.agreeToGuidelines());
    await expect(firstRequest).resolves.toBe("accepted");

    let retryRequest!: Promise<string>;
    act(() => {
      retryRequest = result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() => expect(result.current.dialogGuidelines).not.toBeNull());
    act(() => result.current.declineGuidelines());
    await expect(retryRequest).resolves.toBe("declined");

    act(() => result.current.markChatSubmitted());
    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Chat)
    ).resolves.toBe("accepted");
    expect(fetchWaveMetadataMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the guidelines cannot be loaded", async () => {
    fetchWaveMetadataMock.mockRejectedValue(new Error("network unavailable"));
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave(),
      })
    );

    await expect(
      result.current.requestGuidelinesAgreement(ApiDropType.Chat)
    ).resolves.toBe("unavailable");
    expect(result.current.dialogGuidelines).toBeNull();
  });

  it("cancels a pending decision when the active profile changes", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    const wave = createWave();
    const { result, rerender } = renderHook(
      ({ profileId }: { readonly profileId: string }) =>
        useWaveGuidelinesAgreement({ profileId, wave }),
      { initialProps: { profileId: "profile-1" } }
    );

    let pendingRequest!: Promise<string>;
    act(() => {
      pendingRequest = result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() => expect(result.current.dialogGuidelines).not.toBeNull());

    rerender({ profileId: "profile-2" });

    await expect(pendingRequest).resolves.toBe("declined");
    expect(result.current.dialogGuidelines).toBeNull();

    rerender({ profileId: "profile-1" });
    expect(result.current.dialogGuidelines).toBeNull();
  });

  it("does not ask again when the composer remounts after a first message", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    // The cached wave still reports no messages from the viewer after the
    // first one is sent, until the wave is refetched.
    const wave = createWave();
    const firstComposer = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-1", wave })
    );

    let firstRequest!: Promise<string>;
    act(() => {
      firstRequest = firstComposer.result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() =>
      expect(firstComposer.result.current.dialogGuidelines).not.toBeNull()
    );
    act(() => firstComposer.result.current.agreeToGuidelines());
    await expect(firstRequest).resolves.toBe("accepted");
    act(() => firstComposer.result.current.markChatSubmitted());
    firstComposer.unmount();

    const remountedComposer = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-1", wave })
    );
    await expect(
      remountedComposer.result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      )
    ).resolves.toBe("accepted");
    expect(remountedComposer.result.current.dialogGuidelines).toBeNull();
    expect(fetchWaveMetadataMock).toHaveBeenCalledTimes(1);
  });

  it("still asks another profile, or in another wave, after a first message", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    const wave = createWave();
    const sender = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-1", wave })
    );
    act(() => sender.result.current.markChatSubmitted());
    sender.unmount();

    const otherProfile = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-2", wave })
    );
    act(() => {
      void otherProfile.result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() =>
      expect(otherProfile.result.current.dialogGuidelines).not.toBeNull()
    );
    otherProfile.unmount();

    const otherWave = renderHook(() =>
      useWaveGuidelinesAgreement({
        profileId: "profile-1",
        wave: createWave({ waveId: `${wave.id}-other` }),
      })
    );
    act(() => {
      void otherWave.result.current.requestGuidelinesAgreement(
        ApiDropType.Chat
      );
    });
    await waitFor(() =>
      expect(otherWave.result.current.dialogGuidelines).not.toBeNull()
    );
  });

  it("asks a first-time sender when the wave omits the viewer's chat count", async () => {
    fetchWaveMetadataMock.mockResolvedValue(guidelinesMetadata);
    // Anonymous-shaped metrics leave out your_drops_count entirely.
    const wave = {
      id: currentWaveId,
      metrics: { your_participation_drops_count: 0 },
    } as ApiWave;
    const { result } = renderHook(() =>
      useWaveGuidelinesAgreement({ profileId: "profile-1", wave })
    );

    act(() => {
      void result.current.requestGuidelinesAgreement(ApiDropType.Chat);
    });
    await waitFor(() =>
      expect(result.current.dialogGuidelines).toBe(
        "Be thoughtful and stay on topic."
      )
    );
  });
});

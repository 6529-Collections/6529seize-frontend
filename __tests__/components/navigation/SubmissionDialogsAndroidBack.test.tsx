import { act, render, screen, waitFor } from "@testing-library/react";
import { WaveChatSubmitDropModal } from "@/components/brain/my-stream/WaveChatSubmitDropModal";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { dismissAndroidBackLayer } from "@/services/capacitor/android-back-layers";

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: true }),
}));
jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: () => <button type="button">Submit drop</button>,
}));
jest.mock("@/hooks/competitions/useCompetitionSubmissionWave", () => ({
  useCompetitionSubmissionWave: (wave: ApiWave) => ({ wave, pending: false }),
}));
jest.mock("@/components/waves/drop/useDropDetailMetadata", () => ({
  useDropDetailMetadata: () => ({
    metadata: null,
    metadataState: { status: "ready" },
  }),
}));
jest.mock(
  "@/components/waves/memes/submission/MemesArtSubmissionContainer",
  () => ({
    __esModule: true,
    default: () => <button type="button">Submit artwork</button>,
  })
);

const wave = { id: "wave-1" } as ApiWave;
const kinds = ["chat", "memes"] as const;

function submission(
  kind: (typeof kinds)[number],
  isOpen: boolean,
  onClose: () => void
) {
  return kind === "chat" ? (
    <WaveChatSubmitDropModal
      isOpen={isOpen}
      wave={wave}
      title="Submit drop"
      onClose={onClose}
    />
  ) : (
    <MemesArtSubmissionModal isOpen={isOpen} wave={wave} onClose={onClose} />
  );
}

it.each(kinds)(
  "closes the open %s submission with the current close callback and cleans up",
  async (kind) => {
    const firstClose = jest.fn();
    const currentClose = jest.fn();
    const view = render(submission(kind, false, firstClose));
    expect(dismissAndroidBackLayer()).toBe(false);

    view.rerender(submission(kind, true, firstClose));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    view.rerender(submission(kind, true, currentClose));
    act(() => expect(dismissAndroidBackLayer()).toBe(true));
    expect(currentClose).toHaveBeenCalledTimes(1);
    expect(firstClose).not.toHaveBeenCalled();

    view.rerender(submission(kind, false, currentClose));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(dismissAndroidBackLayer()).toBe(false);
  }
);

it.each(kinds)(
  "keeps the %s submission open while a child modal owns Back",
  (kind) => {
    const onClose = jest.fn();
    render(submission(kind, true, onClose));
    const child = document.createElement("dialog");
    child.open = true;
    child.style.position = "fixed";
    child.style.zIndex = "1100";
    document.body.append(child);
    try {
      act(() => expect(dismissAndroidBackLayer()).toBe(true));
      expect(onClose).not.toHaveBeenCalled();
      child.remove();
      act(() => expect(dismissAndroidBackLayer()).toBe(true));
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      child.remove();
    }
  }
);

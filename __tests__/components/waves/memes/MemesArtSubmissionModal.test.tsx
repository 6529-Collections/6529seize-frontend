import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import type { ApiWave } from "@/generated/models/ApiWave";

const mockSubmissionTarget = jest.fn();
const mockSubmissionContainer = jest.fn((_props: { wave: ApiWave }) => (
  <div data-testid="container" />
));
jest.mock("@/hooks/competitions/useCompetitionSubmissionWave", () => ({
  useCompetitionSubmissionWave: (wave: ApiWave, enabled: boolean) =>
    mockSubmissionTarget(wave, enabled),
}));

jest.mock(
  "@/components/waves/memes/submission/MemesArtSubmissionContainer",
  () => ({
    __esModule: true,
    default: (props: { wave: ApiWave }) => mockSubmissionContainer(props),
  })
);

describe("MemesArtSubmissionModal", () => {
  const wave = { id: "w", participation: { terms: "" } } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmissionTarget.mockReturnValue({
      wave,
      pending: false,
      retry: jest.fn(),
    });
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
    expect(mockSubmissionTarget).toHaveBeenCalledWith(wave, false);
  });

  it("does not call onClose on Escape when closed", () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape when open", async () => {
    const onClose = jest.fn();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("calls onClose when backdrop clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />
    );
    await user.click(screen.getByTestId("memes-art-submission-modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders above the mobile drop detail layer with an accessible name", () => {
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={jest.fn()} />
    );

    expect(
      screen.getByRole("dialog", { name: "Submit Work to The Memes" })
    ).toHaveClass("tw-z-[1020]");
    expect(
      within(screen.getByTestId("memes-art-submission-modal-panel")).getByText(
        "Submit Work to The Memes"
      )
    ).toBeInTheDocument();
  });

  it("uses keyboard-aware mobile viewport height constraints", () => {
    render(
      <MemesArtSubmissionModal isOpen={true} wave={wave} onClose={jest.fn()} />
    );
    const panel = screen.getByTestId("memes-art-submission-modal-panel");
    expect(panel).toHaveClass(
      "tw-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))]"
    );
    expect(panel).toHaveClass(
      "tw-max-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))]"
    );
  });

  it("passes the resolved competition target to the submission container", () => {
    const scopedWave = {
      ...wave,
      competition: { id: "selected", wave_id: wave.id },
    };
    mockSubmissionTarget.mockReturnValue({
      wave: scopedWave,
      pending: false,
      retry: jest.fn(),
    });
    render(<MemesArtSubmissionModal isOpen wave={wave} onClose={jest.fn()} />);
    expect(mockSubmissionTarget).toHaveBeenCalledWith(wave, true);
    expect(mockSubmissionContainer).toHaveBeenCalledWith(
      expect.objectContaining({ wave: scopedWave })
    );
  });

  it("keeps the loading state while the native target is unresolved", () => {
    mockSubmissionTarget.mockReturnValue({
      wave: null,
      pending: true,
      retry: jest.fn(),
    });
    render(<MemesArtSubmissionModal isOpen wave={wave} onClose={jest.fn()} />);
    expect(mockSubmissionContainer).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});

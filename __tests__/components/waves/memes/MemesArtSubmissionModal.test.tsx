import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { fetchDropMetadataByIdV2 } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropMetadataByIdV2: jest.fn(),
}));

const mockContainer = jest.fn(
  (_props: { readonly sourceDrop?: ExtendedDrop | undefined }) => (
    <div data-testid="container" />
  )
);

function render(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderComponent(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

jest.mock(
  "@/components/waves/memes/submission/MemesArtSubmissionContainer",
  () => ({
    __esModule: true,
    default: (props: { readonly sourceDrop?: ExtendedDrop | undefined }) =>
      mockContainer(props),
  })
);

describe("MemesArtSubmissionModal", () => {
  const wave = { id: "w", participation: { terms: "" } } as any;

  beforeEach(() => {
    mockContainer.mockClear();
    jest.mocked(fetchDropMetadataByIdV2).mockReset();
  });

  it("waits for complete metadata before initializing a resubmission and retries failures", async () => {
    const sourceDrop = {
      id: "source-1",
      metadata: [],
      is_additional_action_promised: true,
    } as unknown as ExtendedDrop;
    const metadata = [
      {
        data_key: "additional_action_plan",
        data_value: "The saved artist plan",
      },
    ];
    jest
      .mocked(fetchDropMetadataByIdV2)
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(metadata);
    render(
      <MemesArtSubmissionModal
        isOpen={true}
        wave={wave}
        onClose={jest.fn()}
        sourceDrop={sourceDrop}
      />
    );
    expect(screen.queryByTestId("container")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the saved submission…"
    );
    const retry = await screen.findByRole("button", {
      name: "Retry loading submission",
    });
    expect(mockContainer).not.toHaveBeenCalled();
    await userEvent.click(retry);
    await screen.findByTestId("container");
    expect(mockContainer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceDrop: { ...sourceDrop, metadata } })
    );
    expect(fetchDropMetadataByIdV2).toHaveBeenCalledWith(
      expect.objectContaining({ dropId: "source-1", throwOnError: true })
    );
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
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
});

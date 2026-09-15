import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import WaveHeaderShareButton from "@/components/waves/header/WaveHeaderShareButton";
import type { ApiWave } from "@/generated/models/ApiWave";

const mockShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();

jest.mock("react-use", () => ({
  ...jest.requireActual("react-use"),
  useCopyToClipboard: () => [{}, mockCopyToClipboard],
}));

const createWave = (overrides: Partial<ApiWave> = {}) =>
  ({
    id: "w1",
    name: "Wave",
    chat: { scope: { group: null } },
    ...overrides,
  }) as ApiWave;
const setNavigatorShare = (share?: typeof navigator.share) => {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
};

describe("WaveHeaderShareButton", () => {
  beforeEach(() => {
    mockShare.mockReset().mockResolvedValue(undefined);
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
    setNavigatorShare(mockShare);
  });
  afterEach(() => jest.useRealTimers());

  it("uses native share when available", async () => {
    render(<WaveHeaderShareButton wave={createWave()} />);

    const shareActionButton = screen.getByRole("button", {
      name: "Share wave",
    });
    expect(shareActionButton).toHaveAttribute(
      "data-wave-link-action-mode",
      "share"
    );
    fireEvent.click(shareActionButton);

    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        title: "Wave",
        url: "http://localhost/waves/w1",
      })
    );
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it("falls back to clipboard copy when native share is unavailable", async () => {
    setNavigatorShare(undefined);
    render(<WaveHeaderShareButton wave={createWave()} />);

    const copyActionButton = screen.getByRole("button", {
      name: "Copy wave link",
    });
    expect(copyActionButton).toHaveAttribute(
      "data-wave-link-action-mode",
      "copy"
    );
    fireEvent.click(copyActionButton);

    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
  });

  it("does not fallback to copy when native share is cancelled", async () => {
    const abortError = new Error("Cancelled");
    Object.defineProperty(abortError, "name", { value: "AbortError" });
    mockShare.mockRejectedValue(abortError);
    render(<WaveHeaderShareButton wave={createWave()} />);

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    expect(mockCopyToClipboard).not.toHaveBeenCalled();
  });

  it("demotes to copy mode for the current wave when share fails", async () => {
    mockShare.mockRejectedValue(new Error("Share failed"));
    const { container } = render(<WaveHeaderShareButton wave={createWave()} />);

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
    expect(
      container.querySelector('[data-wave-link-action-mode="copy"]')
    ).toBeInTheDocument();
  });

  it("returns to share mode when wave URL changes after a share failure", async () => {
    mockShare.mockRejectedValue(new Error("Share failed"));
    const { container, rerender } = render(
      <WaveHeaderShareButton
        wave={createWave({ id: "w1", name: "Wave One" })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
    expect(
      container.querySelector('[data-wave-link-action-mode="copy"]')
    ).toBeInTheDocument();

    rerender(
      <WaveHeaderShareButton
        wave={createWave({ id: "w2", name: "Wave Two" })}
      />
    );

    expect(
      container.querySelector('[data-wave-link-action-mode="share"]')
    ).toBeInTheDocument();
  });

  it("shows temporary share feedback and resets", async () => {
    jest.useFakeTimers();
    render(<WaveHeaderShareButton wave={createWave()} />);

    const shareActionButton = screen.getByRole("button", {
      name: "Share wave",
    });
    fireEvent.click(shareActionButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(shareActionButton).toHaveTextContent("Link shared");
    expect(screen.getByRole("status")).toHaveTextContent("Link shared");
    expect(shareActionButton).toHaveAccessibleName("Share wave");

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(shareActionButton).toHaveTextContent("Share wave");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("does not expose sharing when mounted with a direct message", () => {
    const { container } = render(
      <WaveHeaderShareButton
        wave={createWave({
          chat: {
            scope: { group: { is_direct_message: true } },
          } as ApiWave["chat"],
        })}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

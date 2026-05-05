import { render, screen } from "@testing-library/react";
import BrainContentInput from "@/components/brain/content/input/BrainContentInput";

const useWaveDataMock = jest.fn();
const capacitorMock = jest.fn();
const approvalStatusMock = jest.fn();

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: (args: any) => useWaveDataMock(args),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => approvalStatusMock(args),
}));

jest.mock("@/components/waves/PrivilegedDropCreator", () => ({
  __esModule: true,
  default: ({ wave, fixedDropMode }: any) => (
    <div data-testid="creator" data-mode={fixedDropMode}>
      {wave.id}
    </div>
  ),
  DropMode: { BOTH: "BOTH", CHAT: "CHAT" },
}));

describe("BrainContentInput", () => {
  beforeEach(() => {
    useWaveDataMock.mockReset();
    capacitorMock.mockReset();
    approvalStatusMock.mockReset();
    approvalStatusMock.mockReturnValue({ isVotingControlsLocked: false });
  });

  it("returns null when wave is missing", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: null });
    const { container } = render(
      <BrainContentInput activeDrop={null} onCancelReplyQuote={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
    expect(approvalStatusMock).toHaveBeenCalledWith({ wave: null });
  });

  it("renders creator and passes wave id", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: { id: "w1" } });
    render(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: "w1" } } } as any}
        onCancelReplyQuote={jest.fn()}
      />
    );
    expect(useWaveDataMock).toHaveBeenCalledWith({
      waveId: "w1",
      onWaveNotFound: expect.any(Function),
    });
    expect(screen.getByTestId("creator")).toHaveTextContent("w1");
    expect(screen.getByTestId("creator")).toHaveAttribute("data-mode", "BOTH");
    expect(screen.getByTestId("creator").parentElement?.className).toContain(
      "tw-max-h-[calc(100vh-20rem)]"
    );
  });

  it("uses capacitor height and triggers onWaveNotFound", () => {
    const onCancel = jest.fn();
    let onWaveNotFound: (() => void) | null = null;
    capacitorMock.mockReturnValue({ isCapacitor: true });
    useWaveDataMock.mockImplementation((args: any) => {
      onWaveNotFound = args.onWaveNotFound;
      return { data: { id: "w2" } };
    });
    render(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: "w2" } } } as any}
        onCancelReplyQuote={onCancel}
      />
    );
    expect(screen.getByTestId("creator").parentElement?.className).toContain(
      "tw-max-h-[calc(100vh-14.7rem)]"
    );
    if (onWaveNotFound) {
      (onWaveNotFound as any)();
    }
    expect(onCancel).toHaveBeenCalled();
  });

  it("uses chat composer mode when approval submissions are locked", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    approvalStatusMock.mockReturnValue({ isVotingControlsLocked: true });
    useWaveDataMock.mockReturnValue({ data: { id: "w3" } });

    render(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: "w3" } } } as any}
        onCancelReplyQuote={jest.fn()}
      />
    );

    expect(screen.getByTestId("creator")).toHaveAttribute("data-mode", "CHAT");
  });
});

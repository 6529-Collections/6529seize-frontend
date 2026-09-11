import type React from "react";
import { render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import BrainContentInput from "@/components/brain/content/input/BrainContentInput";

const useWaveDataMock = jest.fn();
const capacitorMock = jest.fn();

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: (args: any) => useWaveDataMock(args),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
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

function renderInput(ui: React.ReactElement) {
  return render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>);
}

function getComposerSurface() {
  const surface = screen.getByTestId("creator").closest(".tw-sticky");
  expect(surface).not.toBeNull();
  return surface as HTMLElement;
}

describe("BrainContentInput", () => {
  beforeEach(() => {
    useWaveDataMock.mockReset();
    capacitorMock.mockReset();
  });

  it("returns null when wave is missing", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: null });
    const { container } = renderInput(
      <BrainContentInput activeDrop={null} onCancelReplyQuote={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders creator and passes wave id", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: { id: "w1" } });
    renderInput(
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
    expect(screen.getByTestId("creator")).toHaveAttribute("data-mode", "CHAT");
    expect(getComposerSurface().className).toContain(
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
    renderInput(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: "w2" } } } as any}
        onCancelReplyQuote={onCancel}
      />
    );
    expect(getComposerSurface().className).toContain(
      "tw-max-h-[calc(100vh-14.7rem)]"
    );
    if (onWaveNotFound) {
      (onWaveNotFound as any)();
    }
    expect(onCancel).toHaveBeenCalled();
  });
});

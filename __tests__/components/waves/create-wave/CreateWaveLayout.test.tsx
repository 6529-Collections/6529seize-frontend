import { render, screen } from "@testing-library/react";
import CreateWaveLayout from "@/components/waves/create-wave/CreateWaveLayout";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: jest.fn(),
}));
jest.mock(
  "@/components/waves/create-wave/main-steps/CreateWavesMainSteps",
  () => ({
    __esModule: true,
    default: () => <div data-testid="main-steps" />,
  })
);
jest.mock("@/components/waves/create-wave/utils/CreateWaveActions", () => ({
  __esModule: true,
  default: () => <div data-testid="create-wave-actions" />,
}));

const useCapacitor = require("@/hooks/useCapacitor").default as jest.Mock;
const { useNativeKeyboard } = require("@/hooks/useNativeKeyboard") as {
  useNativeKeyboard: jest.Mock;
};

const config = {
  overview: { type: "CHAT" },
} as any;

describe("CreateWaveLayout", () => {
  const scrollIntoView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    useCapacitor.mockReturnValue({ isIos: false });
    useNativeKeyboard.mockReturnValue({ isVisible: false });
  });

  it("adds bottom safe-area padding to the action footer", () => {
    render(
      <CreateWaveLayout
        config={config}
        step={CreateWaveStep.OVERVIEW}
        showActions={true}
        submitting={false}
        setStep={jest.fn()}
        onComplete={async () => {}}
      >
        <div>content</div>
      </CreateWaveLayout>
    );

    const footer = screen.getByTestId("create-wave-actions").parentElement;

    expect(footer?.className).toContain(
      "tw-pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
    );
    expect(footer?.className).toContain(
      "lg:tw-pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
    );
  });

  it("scrolls the shared flow to the top when the step changes", () => {
    const props = {
      config,
      showActions: true,
      submitting: false,
      setStep: jest.fn(),
      onComplete: async () => {},
    };
    const { rerender } = render(
      <CreateWaveLayout {...props} step={CreateWaveStep.OVERVIEW}>
        <div>overview</div>
      </CreateWaveLayout>
    );

    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <CreateWaveLayout {...props} step={CreateWaveStep.GROUPS}>
        <div>groups</div>
      </CreateWaveLayout>
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      inline: "nearest",
    });
  });
});

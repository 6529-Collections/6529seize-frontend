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
  // dates is required on CreateWaveConfig; the mobile progress header reads
  // ongoingRanking from it.
  dates: { ongoingRanking: false },
} as any;

describe("CreateWaveLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      "tw-pb-[max(calc(env(safe-area-inset-bottom,0px)_-_0.5rem),0.5rem)]"
    );
    expect(footer?.className).toContain("lg:tw-pb-5");
  });

  it("fills the flow height on mobile so actions stay at the bottom", () => {
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

    const layout = screen.getByText("content").closest(".tw-min-h-full");

    expect(layout).toHaveClass("tw-flex");
    expect(layout).toHaveClass("tw-h-max");
    expect(layout).toHaveClass("tw-shrink-0");
  });
});

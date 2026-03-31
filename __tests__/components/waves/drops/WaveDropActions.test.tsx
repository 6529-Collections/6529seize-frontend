import { fireEvent, render, screen } from "@testing-library/react";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";

jest.mock("@/components/waves/drops/WaveDropActionsAddReaction", () => ({
  __esModule: true,
  default: () => <div data-testid="add-reaction" />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsBoost", () => ({
  __esModule: true,
  default: () => <div data-testid="boost" />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsEdit", () => ({
  __esModule: true,
  default: () => <div data-testid="edit" />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsMore", () => ({
  __esModule: true,
  default: ({
    onOpenChange,
  }: {
    readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  }) => (
    <button
      type="button"
      aria-label="Open more actions"
      onClick={() => onOpenChange?.(true)}
    >
      more
    </button>
  ),
}));

jest.mock("@/components/waves/drops/WaveDropActionsQuickReact", () => ({
  __esModule: true,
  default: () => <div data-testid="quick-react" />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsRate", () => ({
  __esModule: true,
  default: () => <div data-testid="rate" />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsReply", () => ({
  __esModule: true,
  default: () => <div data-testid="reply" />,
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

const settingsMock = useSeizeSettings as jest.Mock;

const baseDrop: any = {
  id: "drop-1",
  wave: { id: "wave-1" },
  drop_type: ApiDropType.Chat,
};

describe("WaveDropActions", () => {
  beforeEach(() => {
    settingsMock.mockReturnValue({ isMemesWave: () => false });
  });

  it("keeps hidden actions non-interactive while closed", () => {
    const { container } = render(
      <WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} />
    );

    expect(container.firstElementChild).toHaveClass(
      "tw-pointer-events-none",
      "tw-opacity-0"
    );
  });

  it("keeps actions interactive when the more dropdown is open", () => {
    const { container } = render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        suppressed={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open more actions" }));

    expect(container.firstElementChild).toHaveClass(
      "tw-pointer-events-auto",
      "tw-opacity-100"
    );
  });

  it("renders the voting control for regular drops", () => {
    render(
      <WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} />
    );

    expect(screen.getByTestId("rate")).toBeInTheDocument();
  });

  it("hides voting for participation drops in memes waves", () => {
    settingsMock.mockReturnValue({ isMemesWave: () => true });

    render(
      <WaveDropActions
        drop={{ ...baseDrop, drop_type: ApiDropType.Participatory }}
        activePartIndex={0}
        onReply={() => {}}
      />
    );

    expect(screen.queryByTestId("rate")).toBeNull();
  });
});

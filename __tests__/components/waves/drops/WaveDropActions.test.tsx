import { fireEvent, render, screen } from "@testing-library/react";

import { useAuth } from "@/components/auth/Auth";
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

jest.mock("@/components/waves/drops/WaveDropActionsCopyLink", () => ({
  __esModule: true,
  default: () => <div data-testid="copy-link" />,
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

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

const settingsMock = useSeizeSettings as jest.Mock;
const authMock = useAuth as jest.Mock;

const baseDrop: any = {
  id: "drop-1",
  wave: { id: "wave-1" },
  drop_type: ApiDropType.Chat,
};

describe("WaveDropActions", () => {
  beforeEach(() => {
    settingsMock.mockReturnValue({ isMemesWave: () => false });
    authMock.mockReturnValue({ connectedProfile: { handle: "alice" } });
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

  it("forces visibility from the row's pointer-driven hover", () => {
    const { container } = render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        forceVisible={true}
      />
    );

    expect(container.firstElementChild).toHaveClass(
      "tw-pointer-events-auto",
      "tw-opacity-100"
    );
  });

  it("keeps link-card suppression above the pointer-driven hover", () => {
    const { container } = render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        suppressed={true}
        forceVisible={true}
      />
    );

    expect(container.firstElementChild).toHaveClass(
      "tw-pointer-events-none",
      "tw-opacity-0"
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

  it("shows only copy link for guests", () => {
    authMock.mockReturnValue({ connectedProfile: null });

    render(
      <WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} />
    );

    expect(screen.getByTestId("copy-link")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-react")).toBeNull();
    expect(screen.queryByTestId("add-reaction")).toBeNull();
    expect(screen.queryByTestId("reply")).toBeNull();
    expect(screen.queryByTestId("boost")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Open more actions" })
    ).toBeNull();
    expect(screen.queryByTestId("rate")).toBeNull();
  });
});

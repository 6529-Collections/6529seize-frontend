import WaveDropActionsMore from "@/components/waves/drops/WaveDropActionsMore";
import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));
jest.mock("@/components/waves/drops/useDropLinkPreviewToggleControl", () => ({
  useDropLinkPreviewToggleControl: jest.fn(),
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper",
  () =>
    ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="dropdown">{children}</div> : null
);
jest.mock("@/components/waves/drops/WaveDropActionsMarkUnread", () => () => (
  <div data-testid="mark-unread" />
));
jest.mock("@/components/waves/drops/WaveDropActionsCopyLink", () => () => (
  <div data-testid="copy-link" />
));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <div data-testid="open" />
));
jest.mock("@/components/waves/drops/WaveDropActionsDownload", () => () => (
  <div data-testid="download" />
));
jest.mock("@/components/waves/drops/WaveDropActionsOptions", () => () => (
  <div data-testid="delete" />
));
jest.mock("@/components/waves/drops/WaveDropActionsSetPinnedDrop", () => () => (
  <div data-testid="set-pinned-drop" />
));
jest.mock(
  "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal",
  () => () => <div data-testid="delete-modal" />
);
jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
}));

const mockedUseDropInteractionRules = jest.mocked(useDropInteractionRules);
const mockedUseDropLinkPreviewToggleControl = jest.mocked(
  useDropLinkPreviewToggleControl
);

const drop = {
  id: "drop-1",
  parts: [],
} as any;

describe("WaveDropActionsMore", () => {
  beforeEach(() => {
    mockedUseDropInteractionRules.mockReturnValue({
      canShowVote: true,
      canVote: true,
      voteState: "CAN_VOTE" as any,
      canDelete: false,
      canSetPinnedDrop: false,
      isAuthor: false,
      isWinner: false,
      isVotingEnded: false,
    });
    mockedUseDropLinkPreviewToggleControl.mockReturnValue(undefined);
  });

  it("shows the pinned-drop action in the desktop menu for admins", async () => {
    mockedUseDropInteractionRules.mockReturnValue({
      canShowVote: true,
      canVote: true,
      voteState: "CAN_VOTE" as any,
      canDelete: false,
      canSetPinnedDrop: true,
      isAuthor: false,
      isWinner: false,
      isVotingEnded: false,
    });

    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.getByTestId("set-pinned-drop")).toBeInTheDocument();
  });

  it("does not show the pinned-drop action for non-admins", async () => {
    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.queryByTestId("set-pinned-drop")).toBeNull();
  });

  it("shows restore link previews when the drop has hidden previews", async () => {
    mockedUseDropLinkPreviewToggleControl.mockReturnValue({
      canToggle: true,
      isHidden: true,
      isLoading: false,
      label: "Show link previews",
      onToggle: jest.fn(),
    });

    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(
      screen.getByRole("button", { name: "Restore link previews" })
    ).toBeInTheDocument();
  });

  it("triggers restore link previews from the desktop menu", async () => {
    const onToggle = jest.fn();
    mockedUseDropLinkPreviewToggleControl.mockReturnValue({
      canToggle: true,
      isHidden: true,
      isLoading: false,
      label: "Show link previews",
      onToggle,
    });

    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Restore link previews" })
    );

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

import WaveDropActionsMore from "@/components/waves/drops/WaveDropActionsMore";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
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
});

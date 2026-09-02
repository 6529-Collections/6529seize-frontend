import WaveDropActionsMore from "@/components/waves/drops/WaveDropActionsMore";
import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import { useCanShowDropCurationsAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));
jest.mock("@/components/waves/drops/useDropLinkPreviewToggleControl", () => ({
  useDropLinkPreviewToggleControl: jest.fn(),
}));
jest.mock("@/hooks/drops/useCanShowDropCurationsAction", () => ({
  useCanShowDropCurationsAction: jest.fn(),
}));
jest.mock("@/hooks/drops/useDropCurationMembershipMutation", () => ({
  useDropCurationMembershipMutation: jest.fn(),
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
const mockedUseCanShowDropCurationsAction = jest.mocked(
  useCanShowDropCurationsAction
);
const mockedUseDropCurationMembershipMutation = jest.mocked(
  useDropCurationMembershipMutation
);
const updateMembershipAsync = jest.fn().mockResolvedValue(undefined);

const drop = {
  id: "drop-1",
  author: { id: "author-1" },
  wave: { authenticated_user_admin: false },
  parts: [],
} as any;

describe("WaveDropActionsMore", () => {
  beforeEach(() => {
    updateMembershipAsync.mockClear();
    mockedUseCanShowDropCurationsAction.mockReturnValue({
      showManageCurations: false,
      quickAddCuration: null,
      quickRemoveCuration: null,
    });
    mockedUseDropCurationMembershipMutation.mockReturnValue({
      updateMembership: jest.fn(),
      updateMembershipAsync,
      isPending: false,
      pendingCurationId: null,
    });
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

  it("does not bubble the menu trigger click to a parent card", async () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <WaveDropActionsMore drop={drop} />
      </div>
    );

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(onParentClick).not.toHaveBeenCalled();
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

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("does not show a desktop download action for media", async () => {
    const dropWithMedia = {
      ...drop,
      parts: [
        {
          media: [
            {
              url: "https://example.com/first.png",
              mime_type: "image/png",
            },
          ],
          attachments: [
            {
              url: "https://example.com/attachment.pdf",
            },
          ],
        },
        {
          media: [
            {
              url: "https://example.com/second.mp4",
              mime_type: "video/mp4",
            },
          ],
          attachments: [],
        },
      ],
    };

    render(<WaveDropActionsMore drop={dropWithMedia} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.queryByText("Download media")).toBeNull();
  });

  it("shows one Flag Content action as the final desktop menu entry", async () => {
    mockedUseDropInteractionRules.mockReturnValue({
      canShowVote: true,
      canVote: true,
      voteState: "CAN_VOTE" as any,
      canDelete: true,
      canSetPinnedDrop: true,
      isAuthor: false,
      isWinner: false,
      isVotingEnded: false,
    });

    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    const reportAction = screen.getByRole("button", {
      name: "Flag Content",
    });
    expect(reportAction.parentElement?.lastElementChild).toBe(reportAction);
    expect(screen.queryByRole("button", { name: "Hide post" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Block author" })).toBeNull();
  });

  it("adds directly to the preferred curation", async () => {
    mockedUseCanShowDropCurationsAction.mockReturnValue({
      showManageCurations: true,
      quickAddCuration: { id: "curation-1", name: "Marketplace" },
      quickRemoveCuration: null,
    });

    render(<WaveDropActionsMore drop={drop} />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Add to Marketplace" })
    );

    expect(updateMembershipAsync).toHaveBeenCalledWith(
      "curation-1",
      "add",
      expect.objectContaining({ successMessage: "Added to Marketplace." })
    );
  });

  it("shows only Remove for a post inside the active curation", async () => {
    mockedUseCanShowDropCurationsAction.mockReturnValue({
      showManageCurations: true,
      quickAddCuration: null,
      quickRemoveCuration: { id: "curation-1", name: "Marketplace" },
    });

    render(<WaveDropActionsMore drop={drop} showOnlyQuickRemove />);

    await userEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByTestId("copy-link")).toBeNull();
    expect(screen.queryByText("Manage Curations")).toBeNull();
    expect(screen.queryByRole("button", { name: "Flag Content" })).toBeNull();
  });
});

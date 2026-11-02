import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardRightSidebarActivityLog } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLog";
import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import * as messages from "@/i18n/messages";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));

// Mock dependencies
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: jest.fn((num) =>
    num >= 1000
      ? `${Math.floor(num / 1000)},${(num % 1000).toString().padStart(3, "0")}`
      : num.toString()
  ),
  getTimeAgoShort: jest.fn(() => "5m"),
}));

jest.mock("next/link", () => {
  return function Link({ href, children, className, title }: any) {
    return (
      <a href={href} className={className} title={title}>
        {children}
      </a>
    );
  };
});

jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop",
  () => ({
    WaveLeaderboardRightSidebarActivityLogDrop: function ({
      onDropClick,
    }: any) {
      return (
        <button onClick={() => onDropClick()} data-testid="drop-click-button">
          Drop Button
        </button>
      );
    },
  })
);

jest.mock("@/components/common/SystemAdjustmentPill", () => ({
  SystemAdjustmentPill: function () {
    return <span data-testid="system-adjustment-pill">System Adjustment</span>;
  },
}));

describe("WaveLeaderboardRightSidebarActivityLog", () => {
  const mockOnDropClick = jest.fn();

  const mockLog: ApiWaveLog = {
    id: "log-1",
    action: "VOTE",
    wave_id: "wave-1",
    drop_id: "drop-1",
    created_at: "2024-01-01T10:00:00Z" as any,
    invoker: {
      handle: "voter_user",
      pfp: "https://example.com/voter.jpg",
    } as any,
    drop_author: {
      handle: "author_user",
      pfp: "https://example.com/author.jpg",
    } as any,
    contents: {
      oldVote: 1000,
      newVote: 1000,
      reason: null,
    },
  };

  const defaultProps = {
    log: mockLog,
    creditType: ApiWaveCreditType.Rep,
    onDropClick: mockOnDropClick,
  };

  const getByExactTextContent = (text: string) =>
    screen.getByText((_, element) => element?.textContent === text);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  });

  const renderComponent = (props = {}) => {
    return render(
      <WaveLeaderboardRightSidebarActivityLog {...defaultProps} {...props} />
    );
  };

  it("renders the activity log container", () => {
    const { container } = renderComponent();

    const activityRow = container.querySelector(".tw-border-b");
    expect(activityRow).toBeInTheDocument();
    expect(activityRow).toHaveClass("tw-border-iron-900", "tw-py-3");
  });

  it("keeps the timestamp beside the voter without uppercase styling", () => {
    renderComponent();

    const timestamp = screen.getByText("5m");
    const controls = screen.getByTestId("drop-click-button").parentElement;
    expect(controls).toContainElement(timestamp);
    expect(timestamp).toHaveClass("tw-text-xs", "tw-text-iron-400");
    expect(timestamp).not.toHaveClass("tw-uppercase");
  });

  it("retains a historical activity row without inventing an epoch timestamp", () => {
    renderComponent({
      log: {
        ...mockLog,
        created_at: null,
        invoker_proxy: { id: "original-proxy" },
      },
    });
    expect(screen.getByText("voter_user")).toBeInTheDocument();
    expect(screen.getByTitle("Drop creator: author_user")).toBeInTheDocument();
    expect(getByExactTextContent("1,000 Rep")).toBeInTheDocument();
    expect(screen.getByTestId("drop-click-button")).toBeInTheDocument();
    expect(screen.queryByText("5m")).toBeNull();
  });

  it("groups the recipient with the vote details and a decorative arrow", () => {
    renderComponent();

    const recipientRow = screen.getByTitle(
      "Drop creator: author_user"
    ).parentElement;
    const arrow = recipientRow?.querySelector("svg");
    expect(recipientRow?.parentElement).toHaveClass("tw-pl-8");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveClass("tw-size-3.5", "tw-text-iron-500");
  });

  it("renders drop click button component", () => {
    renderComponent();

    const dropButton = screen.getByTestId("drop-click-button");
    expect(dropButton).toBeInTheDocument();
  });

  it("calls onDropClick when drop button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const dropButton = screen.getByTestId("drop-click-button");
    await user.click(dropButton);

    expect(mockOnDropClick).toHaveBeenCalledWith();
  });

  it("preserves keyboard order from voter to drop button to creator", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.tab();
    expect(screen.getByTitle("Voter: voter_user")).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId("drop-click-button")).toHaveFocus();
    await user.tab();
    expect(screen.getByTitle("Drop creator: author_user")).toHaveFocus();
  });

  it("displays voter information with profile picture", () => {
    renderComponent();

    const voterLink = screen.getByTitle("Voter: voter_user");
    expect(voterLink).toHaveAttribute("href", "/voter_user");
    expect(screen.getByText("voter_user")).toBeInTheDocument();

    const voterPfp = voterLink.querySelector("img");
    expect(voterPfp).toBeInTheDocument();
    expect(voterPfp).toHaveAttribute(
      "src",
      expect.stringContaining("voter.jpg")
    );
    expect(voterPfp).toHaveClass("tw-size-6", "tw-rounded-full");
  });

  it("requests scaled derivatives for the voter and drop creator avatars", () => {
    renderComponent({
      log: {
        ...mockLog,
        invoker: { ...mockLog.invoker, pfp: CDN_AVATAR_URL },
        drop_author: { ...mockLog.drop_author, pfp: CDN_AVATAR_URL },
      },
    });

    const voterPfp = screen
      .getByTitle("Voter: voter_user")
      .querySelector("img");
    const authorPfp = screen
      .getByTitle("Drop creator: author_user")
      .querySelector("img");
    expect(getRequestedImageSrc(voterPfp)).toContain(
      scaledAvatarPath(ImageScale.W_200_H_200)
    );
    expect(getRequestedImageSrc(authorPfp)).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it("displays voter information without profile picture", () => {
    const logWithoutVoterPfp = {
      ...mockLog,
      invoker: { ...mockLog.invoker, pfp: null },
    };

    renderComponent({ log: logWithoutVoterPfp });

    const voterLink = screen.getByTitle("Voter: voter_user");
    const placeholderDiv = voterLink.querySelector("div.tw-size-6");
    expect(placeholderDiv).toBeInTheDocument();
    expect(placeholderDiv).toHaveClass("tw-bg-iron-800");
  });

  it("displays drop author information with profile picture", () => {
    renderComponent();

    const authorLink = screen.getByTitle("Drop creator: author_user");
    expect(authorLink).toHaveAttribute("href", "/author_user");
    expect(screen.getByText("author_user")).toBeInTheDocument();

    const authorPfp = authorLink.querySelector("img");
    expect(authorPfp).toBeInTheDocument();
    expect(authorPfp).toHaveAttribute(
      "src",
      expect.stringContaining("author.jpg")
    );
  });

  it("uses the browser locale for the anonymous name and creator title", () => {
    jest.mocked(useBrowserLocale).mockReturnValue("fr-FR");
    const originalTranslate = messages.t;
    const translate = jest
      .spyOn(messages, "t")
      .mockImplementation((locale, key, params) =>
        locale === "fr-FR" && key === "competitions.anonymousAuthor"
          ? "Anonyme"
          : originalTranslate(locale, key, params)
      );
    try {
      renderComponent({
        log: {
          ...mockLog,
          drop_author: { ...mockLog.drop_author, is_anonymous: true },
        },
      });
      expect(screen.getByText("Anonyme")).toBeVisible();
      expect(screen.getByTitle("Drop creator: Anonyme")).toBeVisible();
    } finally {
      translate.mockRestore();
    }
  });

  it("keeps anonymous drop attribution noninteractive while preserving the voter's profile", () => {
    const { container } = renderComponent({
      log: {
        ...mockLog,
        drop_author: {
          ...mockLog.drop_author,
          id: "anonymous-entry-author",
          handle: "Anonymous",
          is_anonymous: true,
        },
      },
    });
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(container.querySelector('a[href="/Anonymous"]')).toBeNull();
    const creator = screen.getByTitle("Drop creator: Anonymous");
    expect(creator.tagName).toBe("DIV");
    expect(creator.querySelector("img")).toBeNull();
    expect(creator.querySelector("a")).toBeNull();
    expect(screen.getByTitle("Voter: voter_user")).toHaveAttribute(
      "href",
      "/voter_user"
    );
  });

  it("displays drop author information without profile picture", () => {
    const logWithoutAuthorPfp = {
      ...mockLog,
      drop_author: { ...mockLog.drop_author, pfp: null },
    };

    renderComponent({ log: logWithoutAuthorPfp });

    const authorLink = screen.getByTitle("Drop creator: author_user");
    const placeholderDiv = authorLink.querySelector("div.tw-size-5");
    expect(placeholderDiv).toBeInTheDocument();
  });

  it("uses the drop author's address when the handle is missing", () => {
    const logWithoutAuthorHandle = {
      ...mockLog,
      drop_author: {
        ...mockLog.drop_author,
        handle: null,
        primary_address: " 0xauthor ",
      },
    };

    renderComponent({ log: logWithoutAuthorHandle });

    const authorLink = screen.getByTitle("Drop creator: 0xauthor");
    expect(authorLink).toHaveAttribute("href", "/0xauthor");
    expect(authorLink).toHaveTextContent("0xauthor");
  });

  it("uses a trimmed voter address when the handle is missing", () => {
    const logWithoutVoterHandle = {
      ...mockLog,
      invoker: {
        ...mockLog.invoker,
        handle: null,
        primary_address: " 0xvoter ",
      },
    };

    renderComponent({ log: logWithoutVoterHandle });

    const voterLink = screen.getByTitle("Voter: 0xvoter");
    expect(voterLink).toHaveAttribute("href", "/0xvoter");
    expect(voterLink).toHaveTextContent("0xvoter");
  });

  it("renders an unknown drop creator without a broken profile link", () => {
    renderComponent({ log: { ...mockLog, drop_author: undefined } });

    const creator = screen.getByTitle("Drop creator: Unknown profile");
    expect(creator.tagName).toBe("DIV");
    expect(creator).not.toHaveAttribute("href");
    expect(creator).toHaveTextContent("Unknown profile");
  });

  it("displays vote change from old to new", () => {
    renderComponent();

    expect(screen.getByText("1,000 →")).toBeInTheDocument();
    expect(getByExactTextContent("1,000 Rep")).toBeInTheDocument();
  });

  it('displays "voted" text for first-time votes', () => {
    const firstVoteLog = {
      ...mockLog,
      contents: { ...mockLog.contents, oldVote: 0 },
    };

    renderComponent({ log: firstVoteLog });

    expect(screen.getByText("voted")).toBeInTheDocument();
    expect(screen.queryByText("0 →")).not.toBeInTheDocument();
  });

  it("applies green color for positive new votes", () => {
    renderComponent();

    const newVoteSpan = getByExactTextContent("1,000 Rep");
    expect(newVoteSpan).toHaveClass("tw-text-green");
  });

  it("applies red color for negative new votes", () => {
    const negativeVoteLog = {
      ...mockLog,
      contents: { ...mockLog.contents, newVote: -5 },
    };

    renderComponent({ log: negativeVoteLog });

    const newVoteSpan = getByExactTextContent("-5 Rep");
    expect(newVoteSpan).toHaveClass("tw-text-red");
  });

  it("displays system adjustment pill when reason is CREDIT_OVERSPENT", () => {
    const overspentLog = {
      ...mockLog,
      contents: { ...mockLog.contents, reason: "CREDIT_OVERSPENT" },
    };

    renderComponent({ log: overspentLog });

    expect(screen.getByTestId("system-adjustment-pill")).toBeInTheDocument();
  });

  it("does not display system adjustment pill for other reasons", () => {
    renderComponent();

    expect(
      screen.queryByTestId("system-adjustment-pill")
    ).not.toBeInTheDocument();
  });

  it("displays correct credit type", () => {
    renderComponent({ creditType: ApiWaveCreditType.Tdh });

    expect(screen.getByText("1,000 TDH")).toBeInTheDocument();
  });

  it("formats numbers with commas in vote display", () => {
    const { formatNumberWithCommas } = require("@/helpers/Helpers");
    formatNumberWithCommas.mockReturnValue("1,000");

    const largeVoteLog = {
      ...mockLog,
      contents: { oldVote: 1000, newVote: 1500 },
    };

    renderComponent({ log: largeVoteLog });

    expect(formatNumberWithCommas).toHaveBeenCalledWith(1000);
    expect(formatNumberWithCommas).toHaveBeenCalledWith(1500);
  });

  it("applies correct styling classes to vote elements", () => {
    renderComponent();

    const oldVoteSpan = screen.getByText("1,000 →");
    expect(oldVoteSpan).toHaveClass(
      "tw-text-xs",
      "tw-text-iron-400",
      "tw-tabular-nums"
    );

    const newVoteSpan = getByExactTextContent("1,000 Rep");
    expect(newVoteSpan).toHaveClass(
      "tw-text-xs",
      "tw-font-semibold",
      "tw-tabular-nums"
    );
  });

  it("applies hover effects to user links", () => {
    renderComponent();

    const voterLink = screen.getByTitle("Voter: voter_user");
    expect(voterLink).toHaveClass(
      "tw-group",
      "desktop-hover:hover:tw-opacity-80",
      "tw-transition-opacity",
      "tw-duration-200"
    );

    const authorLink = screen.getByTitle("Drop creator: author_user");
    expect(authorLink).toHaveClass(
      "tw-group",
      "desktop-hover:hover:tw-opacity-80",
      "tw-transition-opacity",
      "tw-duration-200"
    );
  });
});

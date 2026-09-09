import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import WaveDropReply from "@/components/waves/drops/WaveDropReply";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";

jest.mock("@/components/waves/drops/DropLoading", () => () => (
  <div data-testid="loading" />
));
jest.mock("@/components/waves/drops/DropNotFound", () => () => (
  <div data-testid="not-found" />
));
const mockContentDisplaySpy = jest.fn();
jest.mock("@/components/waves/drops/ContentDisplay", () => (props: any) => {
  mockContentDisplaySpy(props);
  return <div data-testid="content" />;
});

const hookData: any = {
  drop: null,
  content: { segments: [], apiMedia: [] },
  isLoading: false,
};

jest.mock("@/components/waves/drops/useDropContent", () => ({
  useDropContent: () => hookData,
}));

describe("WaveDropReply", () => {
  const baseProps = {
    dropId: "d",
    dropPartId: 1,
    maybeDrop: null,
    onReplyClick: jest.fn(),
  };

  beforeEach(() => {
    mockContentDisplaySpy.mockClear();
    baseProps.onReplyClick.mockClear();
    hookData.drop = null;
    hookData.content = { segments: [], apiMedia: [] };
    hookData.isLoading = false;
  });

  const expectFixedContainer = () => {
    const container = screen.getByTestId("wave-drop-reply-fixed-container");
    expect(container).toHaveClass("tw-h-[24px]");
    expect(container).toHaveClass("tw-min-h-[24px]");
    expect(container).toHaveClass("tw-max-h-[24px]");
    expect(container).toHaveClass("tw-overflow-hidden");
    return container;
  };

  it("shows loader when loading", () => {
    hookData.isLoading = true;
    render(<WaveDropReply {...baseProps} />);
    const fixedContainer = expectFixedContainer();
    expect(within(fixedContainer).getByTestId("loading")).toBeInTheDocument();
  });

  it("shows not found when author missing", () => {
    hookData.isLoading = false;
    hookData.drop = { author: { handle: null } } as any;
    render(<WaveDropReply {...baseProps} />);
    const fixedContainer = expectFixedContainer();
    expect(within(fixedContainer).getByTestId("not-found")).toBeInTheDocument();
  });

  it("shows not found when drop is empty", () => {
    hookData.isLoading = false;
    hookData.drop = null;
    render(<WaveDropReply {...baseProps} />);
    const fixedContainer = expectFixedContainer();
    expect(within(fixedContainer).getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders content when drop valid", () => {
    hookData.drop = {
      id: "d",
      author: { handle: "alice", pfp: null },
      serial_no: 1,
      moderation: {
        status: ApiDropModerationStatus.Visible,
        can_view: true,
      },
    } as any;
    render(<WaveDropReply {...baseProps} />);
    const fixedContainer = expectFixedContainer();
    expect(within(fixedContainer).getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(mockContentDisplaySpy).toHaveBeenCalled();
    const lastCallProps =
      mockContentDisplaySpy.mock.calls[
        mockContentDisplaySpy.mock.calls.length - 1
      ][0];
    expect(lastCallProps.textClassName).not.toContain("tw-block");
    expect(lastCallProps.linkify).toBe(false);
  });

  it("does not clip a globally moderated tombstone", () => {
    hookData.drop = {
      id: "d",
      author: { id: "author", handle: "alice", pfp: null },
      serial_no: 1,
      moderation: {
        status: ApiDropModerationStatus.ModeratorRemoved,
        can_view: false,
      },
    } as any;

    render(<WaveDropReply {...baseProps} />);

    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("wave-drop-reply-fixed-container")
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Content removed by moderators. View original post",
      })
    );
    expect(baseProps.onReplyClick).toHaveBeenCalledWith(1);
  });

  it("renders a moderated tombstone when a redacted reply has no author", () => {
    hookData.drop = {
      id: "d",
      author: { id: "", handle: null, pfp: null },
      serial_no: 1,
      moderation: {
        status: ApiDropModerationStatus.ModeratorRemoved,
        can_view: false,
      },
    } as any;

    render(<WaveDropReply {...baseProps} />);

    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
    expect(mockContentDisplaySpy).not.toHaveBeenCalled();
  });

  it("redacts a stale author-only removed reply for a non-author", () => {
    hookData.drop = {
      id: "d",
      author: { id: "author", handle: "alice", pfp: null },
      serial_no: 1,
      moderation: {
        status: ApiDropModerationStatus.ModeratorRemoved,
        can_view: true,
      },
    } as any;

    render(<WaveDropReply {...baseProps} />);

    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
    expect(mockContentDisplaySpy).not.toHaveBeenCalled();
  });

  it("keeps a personally hidden preview faded with a compact unhide action", () => {
    hookData.drop = {
      id: "d",
      author: { id: "author", handle: "alice", pfp: null },
      serial_no: 1,
      moderation: {
        status: ApiDropModerationStatus.Visible,
        can_view: true,
      },
      viewer_context: {
        author_blocked: false,
        drop_hidden: true,
      },
    } as any;

    render(<WaveDropReply {...baseProps} />);

    expect(screen.getByRole("button", { name: "Unhide" })).toBeVisible();
    expect(
      screen.getByTestId("content-moderation-hidden-content")
    ).toHaveAttribute("inert");
    expect(
      screen.getByTestId("wave-drop-reply-fixed-container")
    ).toBeInTheDocument();
  });
});

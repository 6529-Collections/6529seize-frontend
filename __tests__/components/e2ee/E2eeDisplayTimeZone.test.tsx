import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  E2eeMessageItem,
  type E2eeMessageActions,
} from "@/components/e2ee/conversation/E2eeMessageItem";
import { E2eeTimeline } from "@/components/e2ee/conversation/E2eeTimeline";
import { renderLegacyDmHtml } from "@/components/e2ee/legacy/legacyDmExport";
import { E2eeConversationList } from "@/components/e2ee/list/E2eeConversationList";
import { formatE2eeDateTime } from "@/components/e2ee/e2eeFormat";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";
import {
  conversation,
  createFakeE2eeEngine,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

jest.mock("@/hooks/useDisplayTimeZone", () => ({
  useDisplayTimeZone: jest.fn(),
}));
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  E2eeEmojiProvider: ({ children }: { children: ReactNode }) => children,
  useE2eeEmojis: () => ({ sources: new Map() }),
}));

Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

const mockZone = useDisplayTimeZone as jest.MockedFunction<
  typeof useDisplayTimeZone
>;
const UTC_ZONE: DisplayTimeZone = { timeZone: "UTC", isLocal: false };
const AUCKLAND_ZONE: DisplayTimeZone = {
  timeZone: "Pacific/Auckland",
  isLocal: false,
};

// Fixture messages are sent at 10:00 UTC on Oct 12, 2026 (23:00 in Auckland).
const SENT = Date.UTC(2026, 9, 12, 10, 0);
// 12:00 UTC, which is already 01:00 on Oct 13 in Auckland.
const NOW = Date.UTC(2026, 9, 12, 12, 0);

const actions: E2eeMessageActions = {
  onReply: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onBlock: jest.fn(),
  onToggleMute: jest.fn(),
  muted: false,
  onReact: jest.fn(),
  onJumpTo: jest.fn(),
};

const renderMessage = (item = message({ id: "m1", text: "gm" })) =>
  render(
    <ul>
      <E2eeMessageItem
        message={item}
        conversation={conversation()}
        engine={createFakeE2eeEngine()}
        selfProfileId={SELF_ID}
        replyTarget={null}
        compact={false}
        canAct
        actions={actions}
      />
    </ul>
  );

const messageTime = (container: HTMLElement) => {
  const time = container.querySelector("time");
  if (!time) throw new Error("no <time> rendered");
  return time;
};

describe("encrypted chats in the display time zone", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    mockZone.mockReturnValue(LOCAL_DISPLAY_TIME_ZONE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the device-zone message time unchanged", () => {
    const { container } = renderMessage();
    const time = messageTime(container);
    expect(time).toHaveTextContent(/^10:00 AM$/);
    expect(time).toHaveAttribute("title", "Oct 12, 2026, 10:00 AM");
    expect(time).toHaveAttribute("dateTime", "2026-10-12T10:00:00.000Z");
  });

  it("names UTC on a message time and keeps the UTC instant in dateTime", () => {
    mockZone.mockReturnValue(UTC_ZONE);
    const { container } = renderMessage();
    const time = messageTime(container);
    expect(time).toHaveTextContent(/^10:00 AM UTC$/);
    expect(time).toHaveAttribute("title", "Oct 12, 2026, 10:00 AM UTC");
    expect(time).toHaveAttribute("dateTime", "2026-10-12T10:00:00.000Z");
  });

  it("moves a message to Auckland's day", () => {
    mockZone.mockReturnValue(AUCKLAND_ZONE);
    const { container } = renderMessage();
    const time = messageTime(container);
    // 23:00 on Oct 12 in Auckland is yesterday there: the date, no clock.
    expect(time).toHaveTextContent(/^Oct 12$/);
    expect(time).toHaveAttribute("title", "Oct 12, 2026, 11:00 PM GMT+13");
    expect(time).toHaveAttribute("dateTime", "2026-10-12T10:00:00.000Z");
  });

  it("names the zone in a system notice's spoken time", () => {
    mockZone.mockReturnValue(UTC_ZONE);
    renderMessage(
      message({
        id: "n1",
        kind: "notice",
        notice: {
          type: "created",
          actorProfileId: SELF_ID,
          targetProfileIds: [],
        },
      })
    );
    expect(screen.getByText(/Oct 12, 2026, 10:00 AM UTC/)).toBeInTheDocument();
  });

  it("splits the timeline at midnight in the display zone", () => {
    const messages = [
      message({ id: "a", seq: 1, ts: SENT, text: "before" }),
      // 11:30 UTC is 00:30 on Oct 13 in Auckland.
      message({
        id: "b",
        seq: 2,
        ts: Date.UTC(2026, 9, 12, 11, 30),
        text: "after",
      }),
    ];
    const renderTimeline = () =>
      render(
        <E2eeTimeline
          conversation={conversation()}
          messages={messages}
          engine={createFakeE2eeEngine()}
          selfProfileId={SELF_ID}
          canAct
          actions={actions}
        />
      );
    // Day separators are the timeline's direct items that are not message rows.
    const separators = () =>
      [...screen.getByRole("list", { name: "Messages" }).children]
        .filter((item) => !item.hasAttribute("data-e2ee-row"))
        .map((item) => item.textContent);

    const local = renderTimeline();
    expect(separators()).toEqual(["Today"]);
    local.unmount();

    mockZone.mockReturnValue(AUCKLAND_ZONE);
    renderTimeline();
    expect(separators()).toEqual(["Yesterday", "Today"]);
  });

  it("shows a chat's last activity in the display zone", () => {
    mockZone.mockReturnValue(UTC_ZONE);
    render(
      <E2eeConversationList
        conversations={[conversation()]}
        selfProfileId={SELF_ID}
        label="Chats"
      />
    );
    expect(screen.getByText("10:00 AM UTC")).toBeInTheDocument();
  });

  it("states the zone in exported message times", () => {
    const html = renderLegacyDmHtml(
      {
        format: "6529.legacy-dm-export.v1",
        exported_at: new Date(NOW).toISOString(),
        exported_by: { profile_id: "me", handle: "me" },
        server_deletion_at: "2027-01-01T00:00:00.000Z",
        notice: "notice",
        conversation: { wave_id: "w", name: "dm", participants: [] },
        messages: [
          {
            legacy_drop_id: "d1",
            serial_no: 1,
            author: { profile_id: "a", handle: "alice" },
            created_at: SENT,
            updated_at: null,
            title: null,
            reply_to: null,
            parts: [],
            mentions: [],
            reactions: [],
          },
        ],
      },
      {
        lang: "en-US",
        title: "DM",
        exportedAt: "Exported",
        participants: "People",
        replyTo: "reply",
        edited: "edited",
        media: "Files",
        unknownAuthor: "Unknown",
        formatTime: (ms) => formatE2eeDateTime("en-US", ms, AUCKLAND_ZONE),
      }
    );
    expect(html).toContain(
      '<time datetime="2026-10-12T10:00:00.000Z">Oct 12, 2026, 11:00 PM GMT+13</time>'
    );
  });
});

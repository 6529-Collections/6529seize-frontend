import BlockActivityCard from "@/app/content-moderation/BlockActivityCard";
import {
  type ApiContentModerationBlockActivityItem,
  ApiContentModerationBlockActivityItemActionEnum as Action,
} from "@/generated/models/ApiContentModerationBlockActivityItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import * as messages from "@/i18n/messages";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({ useBrowserLocale: jest.fn() }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

const item: ApiContentModerationBlockActivityItem = {
  id: "event-1",
  action: Action.Blocked,
  blocker_profile_id: "actor-1",
  blocker_handle: "phoebeum",
  blocker_pfp: "https://example.com/actor.png",
  blocked_profile_id: "target-1",
  blocked_handle: "usrname",
  blocked_pfp: null,
  created_at: Date.UTC(2026, 7, 31, 12, 8),
  cursor: "1000.1",
};

describe("BlockActivityCard", () => {
  beforeEach(() => jest.mocked(useBrowserLocale).mockReturnValue("en-US"));

  it.each([
    [Action.Blocked, "blocked"],
    [Action.Unblocked, "unblocked"],
  ])(
    "renders %s with spaced identities and an inline date",
    (action, label) => {
      const { container } = render(
        <ul>
          <BlockActivityCard item={{ ...item, action }} />
        </ul>
      );
      const row = screen.getByRole("listitem");
      expect(row).toHaveTextContent(`@phoebeum ${label} @usrname`);
      const verb = screen.getByText(label);
      expect(verb.parentElement).toHaveClass("tw-gap-x-3");
      expect(screen.getByRole("link", { name: "@phoebeum" })).toHaveAttribute(
        "href",
        "/phoebeum"
      );
      expect(screen.getByRole("link", { name: "@usrname" })).toHaveAttribute(
        "href",
        "/usrname"
      );
      const time = container.querySelector("time");
      expect(time?.parentElement).toBe(row);
      expect(time).toHaveAttribute(
        "datetime",
        new Date(item.created_at).toISOString()
      );
      expect(time).not.toHaveClass("tw-border-t", "tw-mt-3");
      expect(container.querySelector("img")).toHaveAttribute("width", "28");
    }
  );

  it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
    "supports the %s locale with complete fallback copy",
    (locale) => {
      jest.mocked(useBrowserLocale).mockReturnValue(locale);
      const { container } = render(
        <ul>
          <BlockActivityCard item={{ ...item, action: Action.Unblocked }} />
        </ul>
      );
      expect(screen.getByRole("listitem")).toHaveTextContent(
        "@phoebeum unblocked @usrname"
      );
      expect(container.querySelector("time")?.textContent).toBeTruthy();
    }
  );

  it("keeps unavailable profiles readable without creating broken links", () => {
    render(
      <ul>
        <BlockActivityCard item={{ ...item, blocked_handle: null }} />
      </ul>
    );
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "@phoebeum blocked target-1"
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders repeated translated text without duplicate React keys", () => {
    const richMessage = jest
      .spyOn(messages, "tRich")
      .mockReturnValueOnce([
        " • ",
        <span key="actor">actor</span>,
        " • ",
        <span key="target">target</span>,
        " • ",
      ]);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      render(
        <ul>
          <BlockActivityCard item={item} />
        </ul>
      );
      expect(screen.getAllByText("•")).toHaveLength(3);
      expect(screen.getByRole("listitem")).toHaveTextContent(
        "• actor • target •"
      );
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      richMessage.mockRestore();
      consoleError.mockRestore();
    }
  });
});

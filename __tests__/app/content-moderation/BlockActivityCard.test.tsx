import BlockActivityCard from "@/app/content-moderation/BlockActivityCard";
import {
  type ApiContentModerationBlockActivityItem,
  ApiContentModerationBlockActivityItemActionEnum as Action,
} from "@/generated/models/ApiContentModerationBlockActivityItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
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
    [Action.Blocked, "Blocked", "tw-text-red"],
    [Action.Unblocked, "Unblocked", "tw-text-green"],
  ])(
    "renders %s with a prominent action, decorative lock, and linked profiles",
    (action, label, colorClass) => {
      const { container } = render(
        <ul>
          <BlockActivityCard item={{ ...item, action }} />
        </ul>
      );
      const row = screen.getByRole("listitem");
      expect(row).not.toHaveAttribute("aria-label");
      expect(row).not.toHaveAttribute("aria-labelledby");
      expect(row).toHaveTextContent(`@phoebeum ${label} @usrname`);
      expect(
        screen.getAllByRole("link").map((link) => link.textContent)
      ).toEqual(["@phoebeum", "@usrname"]);
      const verb = screen.getByText(label);
      expect(verb).toHaveClass(colorClass, "tw-font-semibold", "tw-gap-2");
      expect(verb.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(verb.querySelector("svg")).toHaveClass("tw-size-5");
      expect(row).toHaveClass("tw-grid");
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
        "@phoebeum Unblocked @usrname"
      );
      expect(screen.getByText("Unblocked")).toBeVisible();
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
      "@phoebeum Blocked target-1"
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("keeps full long handles in wrapping profile columns", () => {
    const blocker = "a_very_long_profile_handle_that_must_remain_readable";
    const blocked = "another_long_profile_handle_with_no_truncation";
    render(
      <ul>
        <BlockActivityCard
          item={{ ...item, blocker_handle: blocker, blocked_handle: blocked }}
        />
      </ul>
    );
    expect(screen.getByRole("listitem")).toHaveTextContent(
      `@${blocker} Blocked @${blocked}`
    );
    for (const handle of [blocker, blocked]) {
      expect(screen.getByRole("link", { name: `@${handle}` })).toHaveAttribute(
        "href",
        `/${handle}`
      );
      expect(screen.getByText(`@${handle}`)).toHaveClass(
        "[overflow-wrap:anywhere]"
      );
      expect(screen.getByText(`@${handle}`)).not.toHaveClass("tw-truncate");
    }
  });

  it("uses different lock shapes for block and unblock events", () => {
    const { container, rerender } = render(
      <ul>
        <BlockActivityCard item={item} />
      </ul>
    );
    const closedLockPath = container
      .querySelector("svg path")
      ?.getAttribute("d");
    expect(closedLockPath).toBeTruthy();
    rerender(
      <ul>
        <BlockActivityCard item={{ ...item, action: Action.Unblocked }} />
      </ul>
    );
    const openLockPath = container.querySelector("svg path")?.getAttribute("d");
    expect(openLockPath).toBeTruthy();
    expect(openLockPath).not.toBe(closedLockPath);
  });
});

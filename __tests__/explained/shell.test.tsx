import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ageText, isLate } from "@/components/explained/age";
import ChapterBar from "@/components/explained/shell/ChapterBar";
import {
  CHAPTERS,
  chapterById,
  chapterPages,
} from "@/components/explained/shell/chapters";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import LivePill from "@/components/explained/shell/LivePill";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

const book = createFactBook(fixtureFactInputs());

describe("the chapter shell", () => {
  it("frames a page: breadcrumb, feed-time pill, switcher and the chapter bar", async () => {
    const user = userEvent.setup();
    render(
      <ExplainedShell
        chapter="tdh"
        page="check"
        crumbs={[
          { label: "6529 Explained", href: "/explained" },
          { label: "01 TDH", href: "/network/tdh" },
          { label: "The daily check" },
        ]}
        live={{ fact: book.get("feed.writtenAt"), kind: "feed" }}
        facts={book.snapshot()}
        locale="en-US"
        clock="frozen"
      >
        <article data-ex-article="">page</article>
      </ExplainedShell>
    );
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByText("The daily check")).toHaveAttribute(
      "aria-current",
      "page"
    );
    const bar = screen.getByRole("navigation", { name: "01 TDH pages" });
    expect(
      within(bar).getAllByRole("link", { name: "3 The daily check" })[0]
    ).toHaveAttribute("aria-current", "page");
    expect(within(bar).getAllByText("Read")[0]).toBeInTheDocument();
    expect(within(bar).getAllByText("Check")[0]).toBeInTheDocument();
    // the shelf: a menu on a desktop, links after the spine on a phone
    expect(
      within(bar).getAllByRole("link", { name: "Specification" }).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("00:49 UTC")).toBeInTheDocument();
    expect(screen.getByText("· 8 h 51 min ago")).toBeInTheDocument();

    const switcher = screen.getByRole("button", {
      name: "6529 Explained: every chapter",
    });
    expect(switcher).toHaveAttribute("aria-expanded", "false");
    await user.click(switcher);
    expect(switcher).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById(
      switcher.getAttribute("aria-controls") ?? ""
    ) as HTMLElement;
    expect(within(menu).getByRole("link", { name: /^01 TDH/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getAllByText("Coming")).toHaveLength(CHAPTERS.length - 1);
    await user.keyboard("{Escape}");
    expect(switcher).toHaveAttribute("aria-expanded", "false");
  });

  it("shows a page not yet shipped at 55%, never as a link", () => {
    const tdh = chapterById("tdh");
    render(
      <ChapterBar
        chapter={{
          ...tdh,
          read: [
            ...tdh.read,
            {
              id: "new",
              title: "explained.kit.map.tdh.glossary",
              href: "/x",
              soon: true,
            },
          ],
        }}
        active="overview"
        locale="en-US"
      />
    );
    const soon = screen.getByTitle("Glossary, coming");
    expect(soon.tagName).toBe("SPAN");
    expect(soon).toHaveClass("tw-opacity-[0.55]");
    expect(soon).toHaveAttribute("aria-disabled", "true");
  });

  it("lists the TDH chapter's pages where they live, under /network/tdh", () => {
    const pages = chapterPages(chapterById("tdh"));
    expect(pages.map((page) => page.href)).toEqual([
      "/network/tdh",
      "/network/tdh/how-it-works",
      "/network/tdh/consolidation",
      "/network/tdh/verification",
      "/network/tdh/formal",
      "/network/tdh/proofs",
      "/network/tdh/specification",
      "/network/tdh/implementations",
      "/network/tdh/consolidation/design",
      "/network/tdh/historic-boosts",
      "/network/tdh/glossary",
    ]);
    expect(
      CHAPTERS.filter((chapter) => chapter.status === "live").map(
        (chapter) => chapter.id
      )
    ).toEqual(["tdh"]);
    expect(CHAPTERS.filter((chapter) => chapter.href === null)).toHaveLength(
      CHAPTERS.length - 1
    );
  });

  it("says late when the feed is past its cadence by two hours, and stops the pulse", () => {
    const { container } = render(
      <LivePill
        fact={book.get("feed.writtenAt")}
        kind="feed"
        locale="en-US"
        asOf="2026-10-19T03:00:00Z"
        clock="frozen"
      />
    );
    expect(container.querySelector("[data-live]")).toHaveAttribute(
      "data-live",
      "late"
    );
    expect(container.querySelector("[data-pulse]")).toHaveAttribute(
      "data-pulse",
      "late"
    );
    expect(isLate(1440 + 120, 1440)).toBe(false);
    expect(isLate(1440 + 121, 1440)).toBe(true);
    expect(ageText("en-US", 59)).toBe("59 min");
    expect(ageText("en-US", 531)).toBe("8 h 51 min");
    expect(ageText("en-US", 1500)).toBe("1 d 1 h");
    expect(ageText("de-DE", 531)).toBe("8 Std. 51 Min.");
  });
});

describe("How we know", () => {
  it("lists the sources and the five actions, and hands over every number's source as JSON", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const createObjectURL = jest.fn(() => "blob:sources");
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: jest.fn(),
      configurable: true,
    });
    render(
      <ExplainedShell
        chapter="tdh"
        page="check"
        crumbs={[{ label: "x" }]}
        facts={book.snapshot()}
        locale="en-US"
      >
        <article data-ex-article="">
          <h1>The daily check</h1>
          <HowWeKnow
            locale="en-US"
            title="The daily check"
            slug="tdh-daily-check"
            rows={[
              {
                title: "The daily comparison",
                body: "index.json and five day files",
              },
            ]}
          />
        </article>
      </ExplainedShell>
    );
    const footer = screen.getByRole("contentinfo", { name: "How we know" });
    expect(
      within(footer).getByText("The daily comparison")
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: "Report an error" })
    ).toHaveAttribute("href", "/about/contact-us");
    expect(
      within(footer).getByRole("link", { name: "Corrections log" })
    ).toHaveAttribute("href", "/explained#corrections");

    await user.click(
      within(footer).getByRole("button", { name: "Copy this page as Markdown" })
    );
    expect(writeText.mock.calls[0]?.[0]).toContain("# The daily check");
    await user.click(
      within(footer).getByRole("button", { name: "Cite this page" })
    );
    expect(writeText.mock.calls[1]?.[0]).toMatch(
      /^The daily check\. 6529 Explained, http.*\. Read October 18, 2026\.$/
    );
    await user.click(
      within(footer).getByRole("button", {
        name: "Every number's source, as JSON",
      })
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});

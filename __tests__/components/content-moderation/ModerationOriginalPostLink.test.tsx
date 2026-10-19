import { render, screen } from "@testing-library/react";
import ModerationOriginalPostLink from "@/components/content-moderation/ModerationOriginalPostLink";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it.each([
  "en-US",
  "en-GB",
  "fr-FR",
  "es-ES",
  "de-DE",
] satisfies SupportedLocale[])("keeps new labels available in %s", (locale) => {
  expect(t(locale, "contentModeration.originalPost.open")).toBe(
    "Open original post"
  );
  expect(t(locale, "checks.action.RESOLVE_DELETED_REPORT")).toBe(
    "Resolve reports — post deleted"
  );
});

it.each([
  "https://example.com/foreign",
  "../outside",
  "wave?drop=other",
  "",
  null,
  "wave%2Foutside",
])("rejects an invalid snapshot Wave ID: %s", (waveId) => {
  render(
    <ModerationOriginalPostLink
      dropId="actual-drop"
      waveId={waveId}
      deleted={false}
    />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText(/Original post link unavailable/)).toBeVisible();
});

it("rejects an invalid post ID instead of constructing a different destination", () => {
  render(
    <ModerationOriginalPostLink
      dropId="../other?drop=x"
      waveId="actual-wave"
      deleted={true}
    />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText(/The original post has been deleted/)).toBeVisible();
});

it("encodes valid opaque IDs into the trusted relative route", () => {
  render(
    <ModerationOriginalPostLink
      dropId="actual:drop"
      waveId="actual:wave"
      deleted={false}
    />
  );
  expect(
    screen.getByRole("link", { name: "Open original post" })
  ).toHaveAttribute("href", "/waves/actual%3Awave?drop=actual%3Adrop");
});

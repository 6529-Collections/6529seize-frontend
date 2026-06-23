import { render, screen } from "@testing-library/react";
import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";

jest.mock("@/components/user/stats/UserPageStatsCollected", () => ({
  __esModule: true,
  default: (props: { readonly locale: string }) => (
    <div data-testid="collected" data-locale={props.locale} />
  ),
}));

jest.mock("@/components/user/stats/UserPageStatsActivityOverview", () => ({
  __esModule: true,
  default: (props: { readonly locale: string }) => (
    <div data-testid="activity-overview" data-locale={props.locale} />
  ),
}));

jest.mock("@/components/user/stats/activity/UserPageActivityWrapper", () => ({
  __esModule: true,
  default: (props: { readonly locale: string }) => (
    <div data-testid="activity-wrapper" data-locale={props.locale} />
  ),
}));

jest.mock("@/components/user/stats/UserPageStatsBoostBreakdown", () => ({
  __esModule: true,
  default: (props: { readonly locale: string }) => (
    <div data-testid="boost" data-locale={props.locale} />
  ),
}));

test("passes runtime locale to all stats detail sections", () => {
  render(
    <UserPageStatsDetailsContent
      profile={{ wallets: [] } as any}
      activeAddress={null}
      seasons={[]}
      tdh={undefined}
      ownerBalance={undefined}
      balanceMemes={[]}
      locale="de-DE"
    />
  );

  expect(screen.getByTestId("collected")).toHaveAttribute(
    "data-locale",
    "de-DE"
  );
  expect(screen.getByTestId("activity-overview")).toHaveAttribute(
    "data-locale",
    "de-DE"
  );
  expect(screen.getByTestId("activity-wrapper")).toHaveAttribute(
    "data-locale",
    "de-DE"
  );
  expect(screen.getByTestId("boost")).toHaveAttribute("data-locale", "de-DE");
});

import { render, screen } from "@testing-library/react";
import UserPageTab from "@/components/user/layout/UserPageTab";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import { useParams, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("next/link", () => (props: any) => {
  const queryString = props.href.query
    ? new URLSearchParams(props.href.query).toString()
    : "";
  const href =
    typeof props.href === "string"
      ? props.href
      : `${props.href.pathname}${queryString ? `?${queryString}` : ""}`;

  return (
    <a
      data-testid="link"
      href={href}
      className={props.className}
      aria-current={props["aria-current"]}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </a>
  );
});

describe("UserPageTab", () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ user: "bob" });
    const searchParams = new URLSearchParams({
      address: "0x1",
      locale: "DE-de",
      collection: "Test Collection",
      page: "2",
      szn: "1",
      "sort-by": "date",
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (k: string) => searchParams.get(k),
    });
  });

  it("renders active and inactive states", () => {
    const repTab = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.REP];
    const { rerender } = render(
      <UserPageTab
        tab={repTab}
        activeTabId={USER_PAGE_TAB_IDS.REP}
      />
    );
    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "/bob/?address=0x1&locale=DE-de");
    expect(link).toHaveAttribute("aria-label", "Identity");
    expect(link).toHaveClass("tw-pointer-events-none");
    expect(link).toHaveClass("tw-font-medium");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Identity")).toHaveClass(
      "tw-border-transparent",
      "tw-font-semibold"
    );
    rerender(
      <UserPageTab
        tab={repTab}
        activeTabId={USER_PAGE_TAB_IDS.BRAIN}
      />
    );
    expect(link).not.toHaveClass("tw-pointer-events-none");
    expect(link).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Identity")).not.toHaveClass("tw-font-semibold");
  });

  it("renders localized badges in the link name", () => {
    render(
      <UserPageTab
        tab={USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.XTDH]}
        activeTabId={USER_PAGE_TAB_IDS.REP}
      />
    );

    expect(screen.getByRole("link", { name: "xTDH Beta" })).toBeInTheDocument();
  });
});

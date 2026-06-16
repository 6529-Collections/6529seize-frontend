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
jest.mock("next/link", () => (props: any) => (
  <a
    data-testid="link"
    href={
      props.href.pathname +
      (props.href.query ? "?address=" + props.href.query.address : "")
    }
    className={props.className}
    aria-current={props["aria-current"]}
    aria-label={props["aria-label"]}
  >
    {props.children}
  </a>
));

describe("UserPageTab", () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ user: "bob" });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (k: string) => (k === "address" ? "0x1" : null),
    });
  });

  it("renders active and inactive states", () => {
    const repTab = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.REP];
    const { rerender } = render(
      <UserPageTab
        tab={repTab}
        parentRef={{ current: null }}
        activeTabId={USER_PAGE_TAB_IDS.REP}
      />
    );
    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "/bob/?address=0x1");
    expect(link).toHaveAttribute("aria-label", "Identity");
    expect(link).toHaveClass("tw-pointer-events-none");
    expect(link).toHaveAttribute("aria-current", "page");
    rerender(
      <UserPageTab
        tab={repTab}
        parentRef={{ current: null }}
        activeTabId={USER_PAGE_TAB_IDS.BRAIN}
      />
    );
    expect(link).not.toHaveClass("tw-pointer-events-none");
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("renders localized badges in the link name", () => {
    render(
      <UserPageTab
        tab={USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.XTDH]}
        parentRef={{ current: null }}
        activeTabId={USER_PAGE_TAB_IDS.REP}
      />
    );

    expect(screen.getByRole("link", { name: "xTDH Beta" })).toBeInTheDocument();
  });
});

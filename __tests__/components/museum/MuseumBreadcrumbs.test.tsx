import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly children: ReactNode;
    readonly prefetch?: boolean;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

describe("MuseumBreadcrumbs", () => {
  it("wraps long work and artist labels without an overflow rail", () => {
    render(
      <MuseumBreadcrumbs
        ariaLabel="Breadcrumbs"
        items={[
          { label: "6529 Network Museum", href: "/museum/network" },
          {
            label: "Artists",
            href: "/museum/network/artists",
          },
          {
            label:
              "Moisés Saman — an intentionally long artist record title for a narrow viewport",
            href: "/museum/network/artists/moises-saman",
          },
          {
            label:
              "A work title that remains readable when the viewport is 390 pixels wide",
          },
        ]}
      />
    );

    const navigation = screen.getByRole("navigation", { name: "Breadcrumbs" });
    const list = navigation.querySelector("ol");
    expect(list).toBeInTheDocument();
    expect(list).not.toHaveClass("tw-min-w-max");
    expect(list).not.toHaveClass("tw-overflow-x-auto");
    expect(
      screen
        .getAllByRole("link")
        .every((link) => link.className.includes("tw-min-h-11"))
    ).toBe(true);
    expect(
      screen.getByText(
        "A work title that remains readable when the viewport is 390 pixels wide"
      )
    ).toHaveAttribute("aria-current", "page");
    expect(
      navigation.querySelectorAll('span[aria-hidden="true"]')[0]
    ).toHaveClass("tw-hidden", "sm:tw-inline");
  });
});

import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { MuseumShell } from "@/components/museum/MuseumShell";

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

jest.mock("@/components/museum/MuseumSourceContribution", () => ({
  MuseumSourceContribution: () => null,
}));

describe("MuseumShell", () => {
  it("does not speculatively prefetch Museum section routes", () => {
    render(
      <MuseumShell
        view={{
          sourceState: "fresh",
          publicationIdentity: null,
          pageSources: [],
        }}
      >
        <p>Collection record</p>
      </MuseumShell>
    );

    for (const name of [
      "6529 Network Museum",
      "Collection",
      "Artists",
      "Programs",
      "Stories & Research",
      "About",
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "data-prefetch",
        "false"
      );
    }
  });
});

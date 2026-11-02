import About from "@/components/about/About";
import { AboutSection } from "@/types/enums";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";

const mockUseSetTitle = jest.fn();

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: (title: string) => mockUseSetTitle(title),
}));

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: ({
    currentSection,
  }: {
    readonly currentSection: string;
  }) => <nav data-testid="about-contents" data-current={currentSection} />,
}));

jest.mock("@/components/about/AboutMemes", () => ({
  __esModule: true,
  default: () => <div data-testid="about-memes" />,
}));

const readSource = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("About", () => {
  beforeEach(() => {
    mockUseSetTitle.mockClear();
  });

  it("renders the contents menu and only the selected section", () => {
    render(<About section={AboutSection.LICENSE} />);

    expect(screen.getByTestId("about-contents")).toHaveAttribute(
      "data-current",
      AboutSection.LICENSE
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "License" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("about-memes")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /terms of service/i })
    ).not.toBeInTheDocument();
  });

  it("claims the section document title through the title context", () => {
    render(<About section={AboutSection.LICENSE} />);

    expect(mockUseSetTitle).toHaveBeenCalledWith("License | About");
  });

  it("keeps the dedicated full-height layout for The Memes", () => {
    const { container } = render(<About section={AboutSection.MEMES} />);

    expect(container.firstElementChild).toHaveClass(
      "tw-min-h-[calc(100dvh-100px)]"
    );
    expect(screen.getByTestId("about-memes")).toBeInTheDocument();
    expect(mockUseSetTitle).toHaveBeenCalledWith("The Memes | About");
  });

  it("renders only the contents menu for sections without a body", () => {
    render(<About section={AboutSection.MISSION} />);

    expect(screen.getByTestId("about-contents")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});

describe("About server/client boundary", () => {
  const hasUseClientDirective = (relativePath: string) =>
    readSource(relativePath).trimStart().startsWith('"use client"');

  it("keeps the section switch a Server Component", () => {
    // A "use client" directive here would bundle every section into every
    // /about/<section> route again.
    expect(hasUseClientDirective("components/about/About.tsx")).toBe(false);
  });

  it.each([
    "components/about/AboutDocumentTitle.tsx",
    "components/about/AboutContentsDropdown.tsx",
    "components/about/AboutHTML.tsx",
    "components/about/AboutMemes.tsx",
    "components/about/AboutSubscriptions.tsx",
    // Restricted purchasing copy must reach the browser only through the
    // client-gated chunk, never through Server Component output.
    "components/about/AboutMinting.tsx",
  ])("keeps %s a client leaf", (relativePath) => {
    expect(hasUseClientDirective(relativePath)).toBe(true);
  });
});

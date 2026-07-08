import Page, { generateMetadata } from "@/app/om/instruction-manual/page";
import { omInstructionManualMigratedWordPressPage } from "@/app/om/instruction-manual/content";
import { render, screen } from "@testing-library/react";

describe("OM Instruction Manual Page (migrated WordPress static page)", () => {
  it("renders the instruction manual title and guide sections", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "OM Instruction Manual" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "QUICK GUIDE TO NAVIGATING OM",
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Use Arrow Keys or WASD keys (if you are a gamer)")
    ).toHaveLength(2);
  });

  it("marks the page with its auditable migration source", () => {
    render(<Page />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("OM Instruction Manual - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "OM Instruction Manual - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(omInstructionManualMigratedWordPressPage.path).toBe(
      "/om/instruction-manual"
    );
    expect(omInstructionManualMigratedWordPressPage.source).toBe(
      "migrated-wordpress"
    );
  });
});

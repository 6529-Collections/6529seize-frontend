import { render, screen } from "@testing-library/react";
import AboutGDRC1 from "@/components/about/AboutGDRC1";
import { fetchAboutSectionFile } from "@/components/about/about.helpers";

jest.mock("@/components/about/about.helpers", () => ({
  fetchAboutSectionFile: jest.fn(),
}));

describe("AboutGDRC1", () => {
  const html = "<p>Charter Content</p>";

  beforeEach(() => {
    (fetchAboutSectionFile as jest.Mock).mockResolvedValue(html);
  });

  it("shows charter heading and link", () => {
    render(<AboutGDRC1 />);
    expect(
      screen.getByRole("heading", { name: /Global Digital Rights Charter/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /The Global Digital Rights Charter 1/i,
    });
    expect(link).toHaveAttribute("href", "https://digitalrightscharter.org/");
  });

  it("renders provided html", async () => {
    render(<AboutGDRC1 />);
    expect(await screen.findByText("Charter Content")).toBeInTheDocument();
  });

  it("removes the duplicated source header without removing charter content", async () => {
    (fetchAboutSectionFile as jest.Mock).mockResolvedValue(
      "<div><h2>The Global Digital Rights Charter</h2><div>Version 1.0 - March 2023</div></div><div><h3>Preamble</h3><p>Charter Content</p></div>"
    );

    render(<AboutGDRC1 />);

    expect(await screen.findByText("Charter Content")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "The Global Digital Rights Charter",
      })
    ).toHaveLength(1);
    expect(screen.getAllByText("Version 1.0 - March 2023")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Preamble" })
    ).toBeInTheDocument();
  });

  it("sanitizes fetched html", async () => {
    (fetchAboutSectionFile as jest.Mock).mockResolvedValue(
      '<div onclick="alert(1)"><p>Safe content</p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a></div>'
    );

    render(<AboutGDRC1 />);

    const safeContent = await screen.findByText("Safe content");
    expect(safeContent.parentElement).not.toHaveAttribute("onclick");
    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(screen.queryByText("Unsafe link")).not.toBeInTheDocument();
  });
});

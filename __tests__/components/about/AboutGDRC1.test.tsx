import { render, screen } from "@testing-library/react";
import AboutGDRC1 from "@/components/about/AboutGDRC1";
import { fetchAboutSectionFile } from "@/components/about/about.helpers";

jest.mock("@/components/about/about.helpers", () => ({
  fetchAboutSectionFile: jest.fn(),
}));

describe("AboutGDRC1", () => {
  const html = '<div data-testid="content">Charter Content</div>';

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
    expect(await screen.findByTestId("content")).toBeInTheDocument();
  });
});

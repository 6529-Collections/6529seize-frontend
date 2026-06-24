import { render } from "@testing-library/react";
import LogoIcon from "@/components/common/icons/LogoIcon";

describe("LogoIcon", () => {
  it("renders the white logo asset with a custom class", () => {
    const { container } = render(<LogoIcon className="brand" />);
    const image = container.querySelector("img");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/6529.svg");
    expect(image).toHaveAttribute("aria-hidden", "true");
    expect(image).toHaveClass("brand");
  });

  it("renders the black logo asset when requested", () => {
    const { container } = render(<LogoIcon color="black" />);
    const image = container.querySelector("img");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/6529-black.svg");
  });
});

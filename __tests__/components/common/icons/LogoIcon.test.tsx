import { render } from "@testing-library/react";
import LogoIcon from "@/components/common/icons/LogoIcon";

describe("LogoIcon", () => {
  it("preloads both logo assets with a custom wrapper class", () => {
    const { container } = render(<LogoIcon className="brand" />);
    const wrapper = container.querySelector("span");
    const images = container.querySelectorAll("img");

    expect(wrapper).toHaveClass("brand");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/6529.svg");
    expect(images[1]).toHaveAttribute("src", "/6529-black.svg");
    expect(images[0]).toHaveAttribute("aria-hidden", "true");
    expect(images[0]).toHaveClass("tw-opacity-100");
    expect(images[1]).toHaveClass("tw-opacity-0");
  });

  it("shows the black logo asset when requested", () => {
    const { container } = render(<LogoIcon color="black" />);
    const images = container.querySelectorAll("img");

    expect(images[0]).toHaveAttribute("src", "/6529.svg");
    expect(images[1]).toHaveAttribute("src", "/6529-black.svg");
    expect(images[0]).toHaveClass("tw-opacity-0");
    expect(images[1]).toHaveClass("tw-opacity-100");
  });
});

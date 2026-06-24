import { render } from "@testing-library/react";
import LogoIcon from "@/components/common/icons/LogoIcon";

describe("LogoIcon", () => {
  it("renders one current-color masked logo with a custom wrapper class", () => {
    const { container } = render(<LogoIcon className="brand" />);
    const wrapper = container.querySelector("span");
    const images = container.querySelectorAll("img");

    expect(wrapper).toHaveClass("brand");
    expect(wrapper).toHaveClass("tw-bg-current");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper?.getAttribute("style")).toContain(
      "mask-image: url('/6529.svg')"
    );
    expect(wrapper?.getAttribute("style")).not.toContain("6529-black.svg");
    expect(images).toHaveLength(0);
  });
});

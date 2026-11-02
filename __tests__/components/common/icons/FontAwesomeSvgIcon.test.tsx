import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons/faBellSlash";
import { faWater } from "@fortawesome/free-solid-svg-icons/faWater";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { render } from "@testing-library/react";

const svgOf = (ui: React.ReactElement): SVGSVGElement => {
  const { container } = render(ui);
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("No svg rendered");
  }
  return svg;
};

const classTokens = (svg: SVGSVGElement): string[] =>
  (svg.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).sort();

describe("FontAwesomeSvgIcon", () => {
  it.each([faBellSlash, faWater])(
    "renders the same SVG as FontAwesomeIcon for $iconName",
    (icon) => {
      const reference = svgOf(
        <FontAwesomeIcon icon={icon} className="tw-size-3 tw-text-iron-400" />
      );
      const svg = svgOf(
        <FontAwesomeSvgIcon
          icon={icon}
          className="tw-size-3 tw-text-iron-400"
        />
      );

      for (const attribute of [
        "viewBox",
        "data-prefix",
        "data-icon",
        "aria-hidden",
        "focusable",
        "role",
      ]) {
        expect(svg.getAttribute(attribute)).toBe(
          reference.getAttribute(attribute)
        );
      }
      expect(classTokens(svg)).toEqual(classTokens(reference));
      expect(
        Array.from(svg.querySelectorAll("path"), (path) =>
          path.getAttribute("d")
        )
      ).toEqual(
        Array.from(reference.querySelectorAll("path"), (path) =>
          path.getAttribute("d")
        )
      );
    }
  );

  it("passes SVG attributes such as size, style and test ids through", () => {
    const svg = svgOf(
      <FontAwesomeSvgIcon
        icon={faWater}
        height={16}
        width={16}
        style={{ height: 24 }}
        data-testid="wave-fallback-icon"
      />
    );

    expect(svg.getAttribute("height")).toBe("16");
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.style.height).toBe("24px");
    expect(svg.dataset["testid"]).toBe("wave-fallback-icon");
  });
});

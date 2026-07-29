import { fireEvent, render, screen } from "@testing-library/react";

import { SolidityReferenceSectionNavigation } from "@/components/public-review/SolidityReferenceSectionNavigation";

const panels = {
  "solidity-generation-provenance": <div>Generated panel</div>,
  "solidity-auditor-evidence": <div>Auditor panel</div>,
  "solidity-release-readiness": <div>Release panel</div>,
  "solidity-risk-register": <div>Risk panel</div>,
  "solidity-governed-parameters": <div>Parameters panel</div>,
  "solidity-natspec-gaps": <div>Documentation panel</div>,
  "solidity-global-declarations": <div>Declarations panel</div>,
  "solidity-definition-inventory": <div>Definitions panel</div>,
};

describe("SolidityReferenceSectionNavigation", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", window.location.pathname);
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it("opens the section selected by the URL hash", () => {
    window.history.replaceState({}, "", "#solidity-risk-register");

    render(<SolidityReferenceSectionNavigation panels={panels} />);

    expect(screen.getByRole("tab", { name: "Risk register" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Risk panel")).toBeInTheDocument();
    expect(screen.queryByText("Generated panel")).not.toBeInTheDocument();
  });

  it("updates the hash without a page refresh when a tab is selected", () => {
    render(<SolidityReferenceSectionNavigation panels={panels} />);

    fireEvent.click(screen.getByRole("tab", { name: "Definitions" }));

    expect(window.location.hash).toBe("#solidity-definition-inventory");
    expect(screen.getByText("Definitions panel")).toBeInTheDocument();
    expect(screen.queryByText("Generated panel")).not.toBeInTheDocument();
  });

  it("responds to browser history navigation", () => {
    render(<SolidityReferenceSectionNavigation panels={panels} />);

    window.history.pushState({}, "", "#solidity-auditor-evidence");
    fireEvent.popState(window);

    expect(
      screen.getByRole("tab", { name: "Auditor evidence" })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Auditor panel")).toBeInTheDocument();
  });

  it("reveals and operates the horizontal scroll controls", () => {
    render(<SolidityReferenceSectionNavigation panels={panels} />);

    const scrollContainer = screen.getByRole("tablist").parentElement;
    if (!scrollContainer) {
      throw new Error("Reference tab scroll container is missing");
    }
    const scrollBy = jest.fn();
    Object.defineProperties(scrollContainer, {
      clientWidth: { configurable: true, value: 200 },
      scrollBy: { configurable: true, value: scrollBy },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollWidth: { configurable: true, value: 600 },
    });

    fireEvent.scroll(scrollContainer);
    const scrollRight = screen.getByRole("button", {
      name: "Scroll reference sections right",
    });
    expect(
      screen.queryByRole("button", {
        name: "Scroll reference sections left",
      })
    ).not.toBeInTheDocument();

    fireEvent.click(scrollRight);
    expect(scrollBy).toHaveBeenCalledWith({
      behavior: "smooth",
      left: 140,
    });

    scrollContainer.scrollLeft = 200;
    fireEvent.scroll(scrollContainer);
    expect(
      screen.getByRole("button", {
        name: "Scroll reference sections left",
      })
    ).toBeInTheDocument();
  });
});

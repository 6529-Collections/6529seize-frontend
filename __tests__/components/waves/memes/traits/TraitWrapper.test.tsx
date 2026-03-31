import { render, screen } from "@testing-library/react";
import React from "react";
import { TraitWrapper } from "@/components/waves/memes/traits/TraitWrapper";

describe("TraitWrapper", () => {
  it("shows a neutral required marker for standard fields", () => {
    render(
      <TraitWrapper label="Label">
        <input />
      </TraitWrapper>
    );

    const requiredMarker = screen.getByText("*");
    expect(requiredMarker).toHaveClass("tw-text-iron-500");
  });

  it("shows a neutral required marker for boolean fields", () => {
    render(
      <TraitWrapper label="Toggle" isBoolean>
        <button type="button">Yes</button>
      </TraitWrapper>
    );

    const requiredMarker = screen.getByText("*");
    expect(requiredMarker).toHaveClass("tw-text-iron-500");
  });

  it("hides the required marker for read-only fields", () => {
    render(
      <TraitWrapper label="Read Only" readOnly>
        <input />
      </TraitWrapper>
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});

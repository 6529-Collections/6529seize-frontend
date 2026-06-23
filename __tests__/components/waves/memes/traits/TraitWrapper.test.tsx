import { render, screen } from "@testing-library/react";
import React from "react";
import { TraitWrapper } from "@/components/waves/memes/traits/TraitWrapper";

describe("TraitWrapper", () => {
  it("shows a neutral required marker for standard fields", () => {
    render(
      <TraitWrapper label="Label" showRequiredMarker>
        <input />
      </TraitWrapper>
    );

    const requiredMarker = screen.getByText("*");
    expect(requiredMarker).toHaveClass("tw-text-iron-500");
  });

  it("does not show a required marker for boolean fields", () => {
    render(
      <TraitWrapper label="Toggle" isBoolean showRequiredMarker>
        <button type="button">Yes</button>
      </TraitWrapper>
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
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

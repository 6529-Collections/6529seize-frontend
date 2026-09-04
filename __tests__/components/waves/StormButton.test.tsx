import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import StormButton from "@/components/waves/StormButton";

describe("StormButton", () => {
  it("starts an empty storm on click", () => {
    const fn = jest.fn();
    render(
      <StormButton
        isStormMode={false}
        isPollActive={false}
        submitting={false}
        breakIntoStorm={fn}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalled();
  });

  it("is disabled while submitting", () => {
    const fn = jest.fn();
    render(
      <StormButton
        isStormMode={false}
        isPollActive={false}
        submitting={true}
        breakIntoStorm={fn}
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled while a poll is active", () => {
    const fn = jest.fn();
    render(
      <StormButton
        isStormMode={false}
        isPollActive={true}
        submitting={false}
        breakIntoStorm={fn}
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("keeps the storm action icon-only at the 751px transition", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 751,
    });

    try {
      render(
        <StormButton
          isStormMode={false}
          isPollActive={false}
          submitting={false}
          breakIntoStorm={jest.fn()}
        />
      );

      const button = screen.getByRole("button", { name: "Break into storm" });
      expect(button).toHaveClass("tw-size-8", "tw-px-0");
      expect(
        within(button).queryByText("Break into storm")
      ).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalWidth,
      });
    }
  });
});

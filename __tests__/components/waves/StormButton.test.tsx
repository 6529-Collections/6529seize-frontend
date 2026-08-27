import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
});

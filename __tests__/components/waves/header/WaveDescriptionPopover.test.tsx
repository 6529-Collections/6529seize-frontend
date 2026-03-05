import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WaveDescriptionPopover from "@/components/waves/header/WaveDescriptionPopover";

jest.mock("@/components/waves/drops/Drop", () => {
  const MockDrop = () => <div data-testid="mock-drop">Drop</div>;
  return {
    __esModule: true,
    default: MockDrop,
    DropLocation: {
      WAVE: "WAVE",
    },
  };
});

jest.mock("@/helpers/waves/drop.helpers", () => ({
  DropSize: {
    FULL: "FULL",
  },
}));

describe("WaveDescriptionPopover", () => {
  const wave = {
    description_drop: {
      id: "drop-1",
      parts: [{ content: "Description" }],
    },
  } as any;

  it("opens and closes the panel from trigger", async () => {
    render(
      <WaveDescriptionPopover
        wave={wave}
        ariaLabel="Show wave description"
        triggerClassName="test-trigger"
      >
        <span>Open</span>
      </WaveDescriptionPopover>
    );

    const trigger = screen.getByRole("button", {
      name: "Show wave description",
    });

    fireEvent.click(trigger);
    expect(await screen.findByTestId("mock-drop")).toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByTestId("mock-drop")).not.toBeInTheDocument();
    });
  });

  it("closes when clicking outside", async () => {
    render(
      <WaveDescriptionPopover
        wave={wave}
        ariaLabel="Show wave description"
        triggerClassName="test-trigger"
      >
        <span>Open</span>
      </WaveDescriptionPopover>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Show wave description" })
    );
    expect(await screen.findByTestId("mock-drop")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByTestId("mock-drop")).not.toBeInTheDocument();
    });
  });

  it("does not render trigger when description drop id is missing", () => {
    render(
      <WaveDescriptionPopover
        wave={{ description_drop: { parts: [{ content: "x" }] } } as any}
        ariaLabel="Show wave description"
        triggerClassName="test-trigger"
      >
        <span>Open</span>
      </WaveDescriptionPopover>
    );

    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
  });
});

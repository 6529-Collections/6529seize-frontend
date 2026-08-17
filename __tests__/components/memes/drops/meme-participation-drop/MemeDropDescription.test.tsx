import { render, screen } from "@testing-library/react";
import React from "react";
import MemeDropDescription from "@/components/memes/drops/meme-participation-drop/MemeDropDescription";
import DropContext from "@/components/waves/drops/DropContext";
import { DropLocation } from "@/components/waves/drops/drop.types";

jest.mock(
  "@/components/waves/drops/CollapsibleDropBody",
  () =>
    ({ children }: { readonly children: React.ReactNode }) => (
      <div data-testid="collapsible-drop-body">{children}</div>
    )
);

test("renders provided description without feed collapsing by default", () => {
  render(<MemeDropDescription description="hello" />);

  expect(screen.getByText("hello")).toBeInTheDocument();
  expect(screen.queryByTestId("collapsible-drop-body")).not.toBeInTheDocument();
});

test("uses the shared collapsible body in Wave feeds", () => {
  render(
    <DropContext.Provider
      value={{
        drop: { id: "drop-1" } as never,
        location: DropLocation.WAVE,
      }}
    >
      <MemeDropDescription description="Wave description" />
    </DropContext.Provider>
  );

  expect(screen.getByTestId("collapsible-drop-body")).toHaveTextContent(
    "Wave description"
  );
});

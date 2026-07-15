import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/drops/view/part/DropPartMarkdown", () => () => (
  <div data-testid="markdown" />
));

import CreateDropStormPart from "@/components/waves/CreateDropStormPart";

const part = { content: "hello", media: [] } as any;

describe("CreateDropStormPart", () => {
  it("renders part info and handles remove", async () => {
    const onRemove = jest.fn();
    const onEdit = jest.fn();
    const onMove = jest.fn();
    render(
      <CreateDropStormPart
        partIndex={0}
        partsCount={2}
        part={part}
        mentionedUsers={[]}
        mentionedGroups={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        isEditing={false}
        controlsDisabled={false}
        canEdit={true}
        onEditPart={onEdit}
        onMovePart={onMove}
        onRemovePart={onRemove}
      />
    );

    expect(screen.getByText("Part 1")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove part 1" })
    );
    expect(onRemove).toHaveBeenCalledWith(0);
    await userEvent.click(screen.getByRole("button", { name: "Edit part 1" }));
    expect(onEdit).toHaveBeenCalledWith(0);
    await userEvent.click(
      screen.getByRole("button", { name: "Move part 1 later" })
    );
    expect(onMove).toHaveBeenCalledWith(0, 1);
    expect(screen.getByTestId("markdown")).toBeInTheDocument();
  });
});

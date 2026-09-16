import { fireEvent, render, screen } from "@testing-library/react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { CurationOrder } from "@/hooks/useCurationOrder";
import CurationOrganize from "@/components/brain/my-stream/curations/CurationOrganize";
import CurationOrganizeCard from "@/components/brain/my-stream/curations/CurationOrganizeCard";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const drops = ["a", "b", "c", "d"].map((id) => ({ id }) as ExtendedDrop);

function makeOrder(move = jest.fn()): CurationOrder {
  return {
    drops,
    startIndex: 0,
    canAuthenticate: true,
    busy: false,
    revealRequest: null,
    saved: false,
    isSaving: false,
    error: "",
    move,
    hold: jest.fn(),
    release: jest.fn(),
    revealDrop: jest.fn(),
  } as unknown as CurationOrder;
}

it("places the previewed keyboard move with Space", () => {
  const move = jest.fn().mockResolvedValue(undefined);
  const order = makeOrder(move);
  render(
    <CurationOrganize order={order} enabled onDone={jest.fn()}>
      {drops.map((drop, index) => (
        <CurationOrganizeCard key={drop.id} id={drop.id} position={index + 1}>
          <span>{drop.id}</span>
        </CurationOrganizeCard>
      ))}
    </CurationOrganize>
  );

  const firstHandle = screen.getByLabelText("Select Post #1 to move");
  fireEvent.click(firstHandle);
  fireEvent.keyDown(firstHandle, { key: "ArrowDown" });
  fireEvent.keyDown(firstHandle, { key: "ArrowDown" });
  fireEvent.keyDown(firstHandle, { key: " " });

  expect(move).toHaveBeenCalledWith("a", {
    anchorDropId: "c",
    placement: "after",
  });
});

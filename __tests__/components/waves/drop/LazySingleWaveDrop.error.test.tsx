import LazySingleWaveDrop from "@/components/waves/drop/LazySingleWaveDrop";
import { render, waitFor } from "@testing-library/react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/components/waves/drop/SingleWaveDrop", () => {
  throw new Error("chunk failed to load");
});

describe("LazySingleWaveDrop when its chunk fails to load", () => {
  it("closes the panel so the drop can be opened again", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const onClose = jest.fn();

    render(
      <LazySingleWaveDrop
        drop={{ id: "drop-1", wave: { id: "wave-1" } } as ExtendedDrop}
        onClose={onClose}
      />
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    consoleError.mockRestore();
  });
});

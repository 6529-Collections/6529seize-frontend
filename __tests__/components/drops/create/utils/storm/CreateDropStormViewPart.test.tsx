import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CreateDropStormViewPart from "@/components/drops/create/utils/storm/CreateDropStormViewPart";

jest.mock("@/components/drops/view/part/DropPart", () =>
  jest.fn(() => <div data-testid="drop-part" />)
);
jest.mock(
  "@/components/drops/create/utils/storm/CreateDropStormViewPartQuote",
  () => jest.fn(() => <div data-testid="quote" />)
);

const DropPartMock = require("@/components/drops/view/part/DropPart");
const QuoteMock = require("@/components/drops/create/utils/storm/CreateDropStormViewPartQuote");

describe("CreateDropStormViewPart", () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    createObjectURLMock = jest.fn(() => "blob:url");
    revokeObjectURLMock = jest.fn();
    (global as any).URL.createObjectURL = createObjectURLMock;
    (global as any).URL.revokeObjectURL = revokeObjectURLMock;
    jest.clearAllMocks();
  });

  const baseProps = {
    profile: {} as any,
    part: {
      content: "c",
      quoted_drop: null,
      media: [new File(["1"], "f.png", { type: "image/png" })],
    },
    mentionedUsers: [],
    mentionedGroups: [],
    mentionedWaves: [],
    referencedNfts: [],
    createdAt: 1,
    wave: null,
    dropTitle: null,
    partIndex: 0,
    removePart: jest.fn(),
  };

  const getLastDropPartCall = (): any => {
    const calls = (DropPartMock as jest.Mock).mock.calls;
    const lastCall = calls[calls.length - 1];

    if (!lastCall) {
      throw new Error("DropPart was not called");
    }

    return lastCall[0];
  };

  it("passes transformed media to DropPart", async () => {
    render(<CreateDropStormViewPart {...baseProps} />);

    await waitFor(() => {
      expect(getLastDropPartCall().partMedias).toEqual([
        { mimeType: "image/png", mediaSrc: "blob:url" },
      ]);
    });
  });

  it("reuses transformed media URLs on rerender", async () => {
    const { rerender } = render(
      <CreateDropStormViewPart {...baseProps} dropTitle="first" />
    );

    await waitFor(() => {
      expect(getLastDropPartCall().partMedias).toEqual([
        { mimeType: "image/png", mediaSrc: "blob:url" },
      ]);
    });
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    rerender(<CreateDropStormViewPart {...baseProps} dropTitle="second" />);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });
    expect(getLastDropPartCall().partMedias).toEqual([
      { mimeType: "image/png", mediaSrc: "blob:url" },
    ]);
  });

  it("revokes transformed media URLs on unmount", async () => {
    const { unmount } = render(<CreateDropStormViewPart {...baseProps} />);

    await waitFor(() => {
      expect(getLastDropPartCall().partMedias).toEqual([
        { mimeType: "image/png", mediaSrc: "blob:url" },
      ]);
    });

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:url");
  });

  it("revokes old transformed media URLs when media changes", async () => {
    const nextFile = new File(["2"], "g.png", { type: "image/png" });
    createObjectURLMock
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");

    const { rerender } = render(<CreateDropStormViewPart {...baseProps} />);

    await waitFor(() => {
      expect(getLastDropPartCall().partMedias).toEqual([
        { mimeType: "image/png", mediaSrc: "blob:first" },
      ]);
    });

    rerender(
      <CreateDropStormViewPart
        {...baseProps}
        part={{ ...baseProps.part, media: [nextFile] }}
      />
    );

    await waitFor(() => {
      expect(getLastDropPartCall().partMedias).toEqual([
        { mimeType: "image/png", mediaSrc: "blob:second" },
      ]);
    });
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first");
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
  });

  it("renders quoted drop when provided", () => {
    render(
      <CreateDropStormViewPart
        {...baseProps}
        part={{ ...baseProps.part, quoted_drop: { id: "q" } }}
      />
    );
    expect(QuoteMock).toHaveBeenCalled();
  });

  it("calls removePart on click", () => {
    const removePart = jest.fn();
    render(
      <CreateDropStormViewPart
        {...baseProps}
        removePart={removePart}
        partIndex={3}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /remove part/i }));
    expect(removePart).toHaveBeenCalledWith(3);
  });

  it("does not remove part when disabled", () => {
    const removePart = jest.fn();
    render(
      <CreateDropStormViewPart
        {...baseProps}
        disabled
        removePart={removePart}
        partIndex={3}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /remove part/i }));
    expect(removePart).not.toHaveBeenCalled();
  });
});

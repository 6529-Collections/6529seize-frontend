import CreateDropStormParts from "@/components/waves/CreateDropStormParts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/waves/CreateDropStormPart", () => ({
  __esModule: true,
  default: ({ partIndex }: any) => <div data-testid={`part-${partIndex}`} />,
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  domAnimation: {},
  useReducedMotion: () => false,
  m: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    li: ({
      children,
      layout,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: any) => <li {...props}>{children}</li>,
  },
}));

describe("CreateDropStormParts", () => {
  it("renders a distinct draft surface and confirms discard", async () => {
    const parts = [{ content: "a" }, { content: "b" }] as any;
    const onDiscardStorm = jest.fn();
    render(
      <CreateDropStormParts
        parts={parts}
        mentionedUsers={[]}
        mentionedGroups={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        editingPartIndex={null}
        controlsDisabled={false}
        canEditParts={true}
        onEditPart={jest.fn()}
        onCancelPartEdit={jest.fn()}
        onMovePart={jest.fn()}
        onRemovePart={jest.fn()}
        onDiscardStorm={onDiscardStorm}
      />
    );
    expect(screen.getByTestId("part-0")).toBeInTheDocument();
    expect(screen.getByTestId("part-1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Storm draft" })).toBeVisible();
    expect(screen.getByText("2 parts")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(
      screen.getByText("Discard every saved part and the part you are writing?")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Keep draft" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Keep draft" }));
    expect(screen.getByRole("button", { name: "Discard" })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Discard draft" })
    );
    expect(onDiscardStorm).toHaveBeenCalledTimes(1);
  });
});

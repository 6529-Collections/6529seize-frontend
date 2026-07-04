import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import {
  useWaveDropMobileMenu,
  WaveDropMobileMenuProvider,
} from "@/components/waves/drops/WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "@/components/waves/drops/useWaveDropMobileMenuController";

const menuRender = jest.fn();

jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => ({
  __esModule: true,
  default: (props: any) => {
    menuRender(props);
    return (
      <div
        data-testid="shared-menu"
        data-drop-id={props.drop.id}
        data-open={String(props.isOpen)}
      >
        <button
          type="button"
          data-testid="close-menu"
          onClick={() => props.setOpen(false)}
        />
      </div>
    );
  },
}));

const createDrop = (id: string) =>
  ({
    id,
    author: { handle: "alice" },
    wave: { id: "wave" },
  }) as any;

function OpenMenuButton({
  dropId,
  onOpenChange,
}: {
  readonly dropId: string;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  const mobileMenu = useWaveDropMobileMenu();

  return (
    <button
      type="button"
      data-testid={`open-${dropId}`}
      onClick={() =>
        mobileMenu?.open({
          drop: createDrop(dropId),
          longPressTriggered: false,
          showReplyAndQuote: true,
          onOpenChange,
          onReply: jest.fn(),
          onAddReaction: jest.fn(),
        })
      }
    />
  );
}

function ControlledMenuOwner({
  dropId,
  onOpenChange,
}: {
  readonly dropId: string;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  useWaveDropMobileMenuController({
    drop: createDrop(dropId),
    enabled: true,
    isOpen: true,
    longPressTriggered: false,
    showReplyAndQuote: true,
    onOpenChange,
    onReply: jest.fn(),
    onAddReaction: jest.fn(),
  });

  return null;
}

describe("WaveDropMobileMenuProvider", () => {
  beforeEach(() => {
    menuRender.mockClear();
  });

  it("uses one shared menu host for different drops", async () => {
    const onDropAOpenChange = jest.fn();
    render(
      <WaveDropMobileMenuProvider>
        <OpenMenuButton dropId="drop-a" onOpenChange={onDropAOpenChange} />
        <OpenMenuButton dropId="drop-b" />
      </WaveDropMobileMenuProvider>
    );

    fireEvent.click(screen.getByTestId("open-drop-a"));
    expect(await screen.findByTestId("shared-menu")).toHaveAttribute(
      "data-drop-id",
      "drop-a"
    );
    expect(screen.getAllByTestId("shared-menu")).toHaveLength(1);

    fireEvent.click(screen.getByTestId("open-drop-b"));
    expect(screen.getByTestId("shared-menu")).toHaveAttribute(
      "data-drop-id",
      "drop-b"
    );
    expect(screen.getAllByTestId("shared-menu")).toHaveLength(1);
    expect(onDropAOpenChange).toHaveBeenCalledWith(false);
  });

  it("notifies the active opener when the shared menu closes", async () => {
    const onOpenChange = jest.fn();
    render(
      <WaveDropMobileMenuProvider>
        <OpenMenuButton dropId="drop-a" onOpenChange={onOpenChange} />
      </WaveDropMobileMenuProvider>
    );

    fireEvent.click(screen.getByTestId("open-drop-a"));
    await screen.findByTestId("shared-menu");
    fireEvent.click(screen.getByTestId("close-menu"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears the shared menu when its opener unmounts", async () => {
    const onOpenChange = jest.fn();

    function TestHarness() {
      const [showOwner, setShowOwner] = React.useState(true);

      return (
        <WaveDropMobileMenuProvider>
          {showOwner && (
            <ControlledMenuOwner dropId="drop-a" onOpenChange={onOpenChange} />
          )}
          <button
            type="button"
            data-testid="unmount-owner"
            onClick={() => setShowOwner(false)}
          />
        </WaveDropMobileMenuProvider>
      );
    }

    render(<TestHarness />);

    expect(await screen.findByTestId("shared-menu")).toHaveAttribute(
      "data-drop-id",
      "drop-a"
    );

    fireEvent.click(screen.getByTestId("unmount-owner"));

    expect(screen.queryByTestId("shared-menu")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

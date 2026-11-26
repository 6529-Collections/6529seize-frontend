import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import {
  useWaveDropMobileMenu,
  WaveDropMobileMenuProvider,
} from "@/components/waves/drops/WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "@/components/waves/drops/useWaveDropMobileMenuController";
import type { QuickCurationAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import {
  useWavesMoveScope,
  WavesMoveScope,
} from "@/components/waves-move/WavesMoveScope";

const menuRender = jest.fn();

jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => ({
  __esModule: true,
  default: function MockMenu(props: any) {
    menuRender(props);
    // The scope the menu reads, as its pause and lines do.
    const scope = useWavesMoveScope();
    return (
      <div
        data-testid="shared-menu"
        data-drop-id={props.drop.id}
        data-open={String(props.isOpen)}
        data-waves-move-scope={scope}
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

const createDrop = (id: string, staysOnSite?: boolean) =>
  ({
    id,
    author: { handle: "alice" },
    wave:
      staysOnSite === undefined
        ? { id: "wave" }
        : { id: "wave", stays_on_site: staysOnSite },
  }) as any;

function OpenMenuButton({
  dropId,
  onOpenChange,
  staysOnSite,
}: {
  readonly dropId: string;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly staysOnSite?: boolean | undefined;
}) {
  const mobileMenu = useWaveDropMobileMenu();

  return (
    <button
      type="button"
      data-testid={`open-${dropId}`}
      onClick={() =>
        mobileMenu?.open({
          drop: createDrop(dropId, staysOnSite),
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
  standaloneQuickRemoveCuration,
}: {
  readonly dropId: string;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly standaloneQuickRemoveCuration?: QuickCurationAction | undefined;
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
    showOnlyQuickRemove: Boolean(standaloneQuickRemoveCuration),
    standaloneQuickRemoveCuration,
  });

  return null;
}

describe("WaveDropMobileMenuProvider", () => {
  beforeEach(() => {
    menuRender.mockClear();
  });

  it.each([
    [true, "moves", "stays"],
    [false, "stays", "moves"],
  ] as const)(
    "gives the menu its drop's own wave scope (stays_on_site %s inside a wave that %s)",
    async (staysOnSite, around, expected) => {
      render(
        <WavesMoveScope
          wave={{ id: "outer", stays_on_site: around === "stays" }}
          waveId="outer"
        >
          <WaveDropMobileMenuProvider>
            <OpenMenuButton dropId="drop-a" staysOnSite={staysOnSite} />
          </WaveDropMobileMenuProvider>
        </WavesMoveScope>
      );

      fireEvent.click(screen.getByTestId("open-drop-a"));
      expect(await screen.findByTestId("shared-menu")).toHaveAttribute(
        "data-waves-move-scope",
        expected
      );
    }
  );

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

  it("passes the confirmed curation removal action through the shared mobile menu", async () => {
    const action = { id: "curation-1", name: "Marketplace" };
    render(
      <WaveDropMobileMenuProvider>
        <ControlledMenuOwner
          dropId="drop-a"
          standaloneQuickRemoveCuration={action}
        />
      </WaveDropMobileMenuProvider>
    );

    await screen.findByTestId("shared-menu");
    expect(menuRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        showOnlyQuickRemove: true,
        standaloneQuickRemoveCuration: action,
      })
    );
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

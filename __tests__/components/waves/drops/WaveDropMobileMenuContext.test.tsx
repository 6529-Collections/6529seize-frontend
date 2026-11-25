import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import {
  useWaveDropMobileMenu,
  WaveDropMobileMenuProvider,
} from "@/components/waves/drops/WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "@/components/waves/drops/useWaveDropMobileMenuController";
import type { QuickCurationAction } from "@/hooks/drops/useCanShowDropCurationsAction";

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
  ownerId,
  onOpenChange,
}: {
  readonly dropId: string;
  readonly ownerId?: string;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  const mobileMenu = useWaveDropMobileMenu();

  return (
    <button
      type="button"
      data-testid={`open-${dropId}${ownerId ? `-${ownerId}` : ""}`}
      onClick={() =>
        mobileMenu?.open({
          drop: createDrop(dropId),
          ownerId,
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
  isOpen = true,
}: {
  readonly dropId: string;
  readonly isOpen?: boolean;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly standaloneQuickRemoveCuration?: QuickCurationAction | undefined;
}) {
  useWaveDropMobileMenuController({
    drop: createDrop(dropId),
    enabled: true,
    isOpen,
    interactionScopeKey: "own-profile",
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

it("does not let an inactive duplicate controller close another instance's sheet", async () => {
  const view = render(
    <WaveDropMobileMenuProvider>
      <ControlledMenuOwner dropId="same-drop" />
      <ControlledMenuOwner dropId="same-drop" isOpen={false} />
    </WaveDropMobileMenuProvider>
  );
  expect(await screen.findByTestId("shared-menu")).toHaveAttribute(
    "data-open",
    "true"
  );
  view.rerender(
    <WaveDropMobileMenuProvider>
      <ControlledMenuOwner dropId="same-drop" />
      <ControlledMenuOwner dropId="same-drop" isOpen={false} />
    </WaveDropMobileMenuProvider>
  );
  expect(screen.getByTestId("shared-menu")).toHaveAttribute(
    "data-open",
    "true"
  );
});

it("retires the previous opener when another instance opens the same drop", async () => {
  const onFirstOpenChange = jest.fn();
  const onSecondOpenChange = jest.fn();
  render(
    <WaveDropMobileMenuProvider>
      <OpenMenuButton
        dropId="same-drop"
        ownerId="first"
        onOpenChange={onFirstOpenChange}
      />
      <OpenMenuButton
        dropId="same-drop"
        ownerId="second"
        onOpenChange={onSecondOpenChange}
      />
    </WaveDropMobileMenuProvider>
  );
  fireEvent.click(screen.getByTestId("open-same-drop-first"));
  await screen.findByTestId("shared-menu");
  fireEvent.click(screen.getByTestId("open-same-drop-second"));
  expect(onFirstOpenChange).toHaveBeenCalledTimes(1);
  expect(onFirstOpenChange).toHaveBeenCalledWith(false);
  expect(onSecondOpenChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("close-menu"));
  expect(onSecondOpenChange).toHaveBeenCalledWith(false);
});

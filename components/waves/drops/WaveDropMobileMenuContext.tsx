"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WaveDropMobileMenuProps } from "./WaveDropMobileMenu";

export type WaveDropMobileMenuRequest = Omit<
  WaveDropMobileMenuProps,
  "isOpen" | "setOpen"
> & {
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
};

interface WaveDropMobileMenuContextValue {
  readonly open: (request: WaveDropMobileMenuRequest) => void;
  readonly close: () => void;
}

const WaveDropMobileMenuContext =
  createContext<WaveDropMobileMenuContextValue | null>(null);

const LazyWaveDropMobileMenu = dynamic<WaveDropMobileMenuProps>(
  () => import("./WaveDropMobileMenu"),
  { ssr: false, loading: () => null }
);

export const useWaveDropMobileMenu = () =>
  useContext(WaveDropMobileMenuContext);

export const WaveDropMobileMenuProvider: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const parentContext = useWaveDropMobileMenu();

  if (parentContext) {
    return <>{children}</>;
  }

  return (
    <WaveDropMobileMenuProviderRoot>{children}</WaveDropMobileMenuProviderRoot>
  );
};

const WaveDropMobileMenuProviderRoot: React.FC<{
  readonly children: ReactNode;
}> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<
    (WaveDropMobileMenuRequest & { readonly isOpen: boolean }) | null
  >(null);
  const activeMenuRef = useRef<typeof activeMenu>(null);

  const open = useCallback((request: WaveDropMobileMenuRequest) => {
    const current = activeMenuRef.current;
    if (current?.isOpen && current.drop.id !== request.drop.id) {
      current.onOpenChange?.(false);
    }

    const nextActiveMenu = { ...request, isOpen: true };
    activeMenuRef.current = nextActiveMenu;
    setActiveMenu(nextActiveMenu);
  }, []);

  const setOpen = useCallback((isOpen: boolean) => {
    const current = activeMenuRef.current;
    current?.onOpenChange?.(isOpen);

    const nextActiveMenu = current ? { ...current, isOpen } : current;
    activeMenuRef.current = nextActiveMenu;
    setActiveMenu(nextActiveMenu);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const value = useMemo<WaveDropMobileMenuContextValue>(
    () => ({ open, close }),
    [close, open]
  );

  return (
    <WaveDropMobileMenuContext.Provider value={value}>
      {children}
      {activeMenu && (
        <LazyWaveDropMobileMenu
          drop={activeMenu.drop}
          isOpen={activeMenu.isOpen}
          longPressTriggered={activeMenu.longPressTriggered}
          showReplyAndQuote={activeMenu.showReplyAndQuote}
          setOpen={setOpen}
          onReply={activeMenu.onReply}
          onAddReaction={activeMenu.onAddReaction}
          onEdit={activeMenu.onEdit}
          onBoostAnimation={activeMenu.onBoostAnimation}
          showOpenOption={activeMenu.showOpenOption}
          showCopyOption={activeMenu.showCopyOption}
          showVoting={activeMenu.showVoting}
        />
      )}
    </WaveDropMobileMenuContext.Provider>
  );
};

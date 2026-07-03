"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WaveDropMobileMenuProps } from "./WaveDropMobileMenu";

type WaveDropMobileMenuRequest = Omit<
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

  useEffect(() => {
    activeMenuRef.current = activeMenu;
  }, [activeMenu]);

  const open = useCallback((request: WaveDropMobileMenuRequest) => {
    setActiveMenu({ ...request, isOpen: true });
  }, []);

  const setOpen = useCallback((isOpen: boolean) => {
    activeMenuRef.current?.onOpenChange?.(isOpen);
    setActiveMenu((current) => {
      return current ? { ...current, isOpen } : current;
    });
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

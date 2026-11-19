"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export const WAVE_NAME_EDIT_VIEW = "wave-name-edit";
export const WAVE_OPTIONS_VIEW = "wave-options";

/** Editors share the information sheet's surface, focus trap and Back history. */
export const WaveInformationPanelContext = createContext<{
  readonly view: string;
  readonly contentId: string;
  readonly container: HTMLDivElement | null;
  readonly open: (view: string, title: string) => void;
  readonly back: () => void;
  readonly prepareNavigation?: (destination: string) => void;
} | null>(null);

export function useWaveInformationPanel(title: string, viewId?: string) {
  const sheet = useContext(WaveInformationPanelContext);
  const generatedId = useId();
  const id = viewId ?? generatedId;
  const [standaloneOpen, setStandaloneOpen] = useState(false);
  const isOpen = sheet ? sheet.view === id : standaloneOpen;
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  const open = useCallback(
    (trigger?: HTMLElement | null) => {
      opener.current =
        trigger ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      if (sheet) sheet.open(id, title);
      else setStandaloneOpen(true);
    },
    [sheet, id, title]
  );
  const close = useCallback(() => {
    if (sheet) sheet.back();
    else setStandaloneOpen(false);
  }, [sheet]);

  useEffect(() => {
    const restoreFocus = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;
    if (!restoreFocus) return;
    const frame = requestAnimationFrame(() => {
      if (opener.current?.isConnected)
        opener.current.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    isInSheet: sheet !== null,
    container: sheet?.container,
    contentId: sheet?.contentId ?? id,
  };
}

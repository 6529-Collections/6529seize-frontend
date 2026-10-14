import { useCallback, useEffect, useRef, useState } from "react";

/** Give the nested choices their own Back entry without leaving About. */
export function useNotificationSettingsDialog(id: string) {
  const [isOpen, setIsOpen] = useState(false);
  const openedUrl = useRef<string | null>(null);
  const ownsEntry = useCallback(
    () =>
      openedUrl.current === globalThis.location.href &&
      (
        globalThis.history.state as {
          waveNotificationSettings?: unknown;
        } | null
      )?.waveNotificationSettings === id,
    [id]
  );
  const close = useCallback(() => {
    const shouldGoBack = ownsEntry();
    openedUrl.current = null;
    if (shouldGoBack) globalThis.history.back();
    setIsOpen(false);
  }, [ownsEntry]);
  const open = () => {
    openedUrl.current = globalThis.location.href;
    globalThis.history.pushState(
      { ...globalThis.history.state, waveNotificationSettings: id },
      "",
      openedUrl.current
    );
    setIsOpen(true);
  };

  useEffect(() => {
    const onBack = () => {
      if (!ownsEntry()) {
        openedUrl.current = null;
        setIsOpen(false);
      }
    };
    globalThis.addEventListener("popstate", onBack);
    return () => {
      globalThis.removeEventListener("popstate", onBack);
      if (ownsEntry()) globalThis.history.back();
    };
  }, [ownsEntry]);

  return { isOpen, open, close };
}

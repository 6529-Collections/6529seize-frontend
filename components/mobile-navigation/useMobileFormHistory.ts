"use client";

import { useEffect, useLayoutEffect, useId, useRef } from "react";

const activeForms: string[] = [];

/** Browser Back follows the same guarded Cancel/Back path as the phone header. */
export function useMobileFormHistory(enabled: boolean, onBack: () => void) {
  const id = useId();
  const callback = useRef(onBack);
  useLayoutEffect(() => {
    callback.current = onBack;
  }, [onBack]);
  useEffect(() => {
    if (!enabled) return;
    const history = window.history;
    if ((history.state as { mobileForm?: unknown } | null)?.mobileForm !== id) {
      history.pushState(
        { ...history.state, mobileForm: id },
        "",
        window.location.href
      );
    }
    activeForms.push(id);
    let restoring = false;
    const onPop = (event: PopStateEvent) => {
      if (activeForms.at(-1) !== id) return;
      if (
        !restoring &&
        (event.state as { mobileForm?: unknown } | null)?.mobileForm === id
      )
        return;
      event.stopImmediatePropagation();
      if (restoring) {
        restoring = false;
        callback.current();
      } else {
        restoring = true;
        history.forward();
      }
    };
    window.addEventListener("popstate", onPop, true);
    return () => {
      window.removeEventListener("popstate", onPop, true);
      const index = activeForms.lastIndexOf(id);
      if (index >= 0) activeForms.splice(index, 1);
      // Strict Mode replays effects. Do not pop an entry reclaimed by that replay.
      queueMicrotask(() => {
        if (
          !activeForms.includes(id) &&
          (history.state as { mobileForm?: unknown } | null)?.mobileForm === id
        )
          history.back();
      });
    };
  }, [enabled, id]);
}

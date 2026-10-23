"use client";
import { useEffect, useRef, useState } from "react";
import { recordForgeFunding } from "@/services/api/drop-forge-settings";

export function useFundingReports(prefix: string) {
  const volatile = useRef(new Map<string, string>());
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [storageError, setStorageError] = useState(false);
  function retainHash(hash: string) {
    volatile.current.set(prefix + hash, hash);
    try {
      localStorage.setItem(prefix + hash, hash);
    } catch {
      setStorageError(true);
    }
    setPending(true);
    setRevision((value) => value + 1);
  }
  useEffect(() => {
    let active = true;
    const isActive = () => active;
    let busy = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    function hashes() {
      const values = new Map(volatile.current);
      try {
        for (const key of Object.keys(localStorage).filter((value) =>
          value.startsWith(prefix)
        )) {
          const hash = localStorage.getItem(key);
          if (hash) values.set(key, hash);
        }
      } catch {
        /* In-memory proofs can still be registered without browser storage. */
      }
      return values;
    }
    async function report() {
      if (busy || !isActive()) return;
      busy = true;
      try {
        for (const [key, hash] of hashes()) {
          if (!isActive()) return;
          await recordForgeFunding(hash);
          volatile.current.delete(key);
          try {
            localStorage.removeItem(key);
          } catch {
            /* The server has acknowledged this immutable hash. */
          }
        }
        if (isActive()) setPending(false);
        if (timer) clearInterval(timer);
      } catch {
        if (isActive()) setPending(true);
      } finally {
        busy = false;
      }
    }
    if (hashes().size > 0) {
      timer = setInterval(() => {
        void report();
      }, 5000);
      void report();
    }
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [prefix, revision]);
  return { pending, storageError, retainHash };
}

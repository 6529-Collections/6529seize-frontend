"use client";

import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  listLocalDevicePublicKeys,
  readDeviceKey,
  subscribeToDeviceGrantChanges,
} from "@/lib/device-signing/device-key-store";
import { useEffect, useState } from "react";

interface LocalDeviceKeys {
  readonly loaded: boolean;
  /** This browser's grant for the wallet, if it holds one. */
  readonly grant: ApiDeviceGrant | null;
  /** Public keys of every device key this browser holds (lowercase hex). */
  readonly publicKeys: readonly string[];
}

const NOT_LOADED: LocalDeviceKeys = {
  loaded: false,
  grant: null,
  publicKeys: [],
};

/** Reads this browser's device keys and follows local grant changes. */
export function useLocalDeviceKeys(address: string | null): LocalDeviceKeys {
  const [state, setState] = useState<{
    readonly address: string | null;
    readonly keys: LocalDeviceKeys;
  }>({ address: null, keys: NOT_LOADED });

  useEffect(() => {
    if (!address) {
      return;
    }
    let active = true;
    const load = async () => {
      let next: LocalDeviceKeys;
      try {
        const [record, publicKeys] = await Promise.all([
          readDeviceKey(address),
          listLocalDevicePublicKeys(),
        ]);
        next = { loaded: true, grant: record?.grant ?? null, publicKeys };
      } catch {
        next = { loaded: true, grant: null, publicKeys: [] };
      }
      if (active) {
        setState({ address, keys: next });
      }
    };
    void load();
    const unsubscribe = subscribeToDeviceGrantChanges(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [address]);

  return state.address === address ? state.keys : NOT_LOADED;
}

"use client";

import { useCallback, useMemo } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import useDeviceInfo from "./useDeviceInfo";

export const CREATE_QUERY_KEY = "create";
export const CREATE_WAVE_VALUE = "wave";
export const CREATE_DIRECT_MESSAGE_VALUE = "dm";

type CreateModalMode =
  | typeof CREATE_WAVE_VALUE
  | typeof CREATE_DIRECT_MESSAGE_VALUE
  | null;

export default function useCreateModalState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();

  const mode = useMemo<CreateModalMode>(() => {
    const value = searchParams?.get(CREATE_QUERY_KEY);
    if (value === CREATE_WAVE_VALUE || value === CREATE_DIRECT_MESSAGE_VALUE) {
      return value;
    }
    return null;
  }, [searchParams]);

  const buildDestination = useCallback(
    (value: CreateModalMode) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (value) {
        params.set(CREATE_QUERY_KEY, value);
      } else {
        params.delete(CREATE_QUERY_KEY);
      }

      const basePath = pathname || "/discover";
      const query = params.toString();

      return query ? `${basePath}?${query}` : basePath;
    },
    [pathname, searchParams]
  );

  const updateMode = useCallback(
    (value: CreateModalMode) => {
      if (isApp) {
        if (value === CREATE_WAVE_VALUE) {
          router.push("/waves/create");
        } else if (value === CREATE_DIRECT_MESSAGE_VALUE) {
          router.push("/messages/create");
        }
        return;
      }

      const destination = buildDestination(value);
      router.replace(destination, { scroll: false });
    },
    [buildDestination, isApp, router]
  );

  const openWave = useCallback(
    () => updateMode(CREATE_WAVE_VALUE),
    [updateMode]
  );
  const openDirectMessage = useCallback(
    () => updateMode(CREATE_DIRECT_MESSAGE_VALUE),
    [updateMode]
  );
  const close = useCallback(() => updateMode(null), [updateMode]);

  const getHrefForMode = useCallback(
    (value: CreateModalMode) => {
      if (isApp) {
        if (value === CREATE_WAVE_VALUE) {
          return "/waves/create";
        }
        if (value === CREATE_DIRECT_MESSAGE_VALUE) {
          return "/messages/create";
        }
        return pathname || "/discover";
      }

      return buildDestination(value);
    },
    [buildDestination, isApp, pathname]
  );

  return {
    mode,
    isWaveModalOpen: !isApp && mode === CREATE_WAVE_VALUE,
    isDirectMessageModalOpen: !isApp && mode === CREATE_DIRECT_MESSAGE_VALUE,
    openWave,
    openDirectMessage,
    close,
    getHrefForMode,
    isApp,
  };
}

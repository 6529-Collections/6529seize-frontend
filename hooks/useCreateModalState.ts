"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useDeviceInfo from "./useDeviceInfo";
import { useClientNavigation } from "./useClientNavigation";

const CREATE_QUERY_KEY = "create";
const CREATE_WAVE_VALUE = "wave";
const CREATE_DIRECT_MESSAGE_VALUE = "dm";

type CreateModalMode =
  | typeof CREATE_WAVE_VALUE
  | typeof CREATE_DIRECT_MESSAGE_VALUE
  | null;

function getCreateModalMode(
  params: Pick<URLSearchParams, "get">
): CreateModalMode {
  const value = params.get(CREATE_QUERY_KEY);
  if (value === CREATE_WAVE_VALUE || value === CREATE_DIRECT_MESSAGE_VALUE) {
    return value;
  }
  return null;
}

function getCreateModalModeFromWindow(): CreateModalMode {
  return getCreateModalMode(
    new URLSearchParams(globalThis.window.location.search)
  );
}

function buildCreateModalUrl({
  pathname,
  search,
  value,
}: {
  readonly pathname: string | null;
  readonly search: string;
  readonly value: CreateModalMode;
}) {
  const params = new URLSearchParams(search);

  if (value) {
    params.set(CREATE_QUERY_KEY, value);
  } else {
    params.delete(CREATE_QUERY_KEY);
  }

  const basePath = pathname ?? "/waves";
  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export default function useCreateModalState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();

  const urlMode = useMemo<CreateModalMode>(
    () => getCreateModalMode(searchParams),
    [searchParams]
  );

  const buildDestination = useCallback(
    (value: CreateModalMode) => {
      return buildCreateModalUrl({
        pathname,
        search: searchParams.toString(),
        value,
      });
    },
    [pathname, searchParams]
  );

  const buildNavigationUrl = useCallback((value: CreateModalMode) => {
    return buildCreateModalUrl({
      pathname: globalThis.window.location.pathname,
      search: globalThis.window.location.search,
      value,
    });
  }, []);

  const canUsePushState = useCallback((targetUrl: string) => {
    const target = new URL(targetUrl, globalThis.window.location.origin);
    return target.pathname === globalThis.window.location.pathname;
  }, []);

  const { state: clientMode, navigate } = useClientNavigation<
    CreateModalMode,
    object
  >({
    initialState: urlMode,
    buildUrl: buildNavigationUrl,
    parseUrl: getCreateModalModeFromWindow,
    canUsePushState,
  });

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

      navigate(value, { replace: value === null });
    },
    [isApp, navigate, router]
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
        return pathname;
      }

      return buildDestination(value);
    },
    [buildDestination, isApp, pathname]
  );

  return {
    mode: isApp ? urlMode : clientMode,
    isWaveModalOpen: !isApp && clientMode === CREATE_WAVE_VALUE,
    isDirectMessageModalOpen:
      !isApp && clientMode === CREATE_DIRECT_MESSAGE_VALUE,
    openWave,
    openDirectMessage,
    close,
    getHrefForMode,
    isApp,
  };
}

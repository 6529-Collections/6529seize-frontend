import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_SOURCES: readonly Blob[] = [];

type ObjectUrlMap = ReadonlyMap<Blob, string>;

function getObjectUrlApi(): typeof globalThis.URL | null {
  const urlApi = globalThis.URL;

  if (
    typeof urlApi?.createObjectURL !== "function" ||
    typeof urlApi.revokeObjectURL !== "function"
  ) {
    return null;
  }

  return urlApi;
}

export function useObjectUrl(source: Blob | null | undefined): string | null {
  const sources = useMemo(() => (source ? [source] : EMPTY_SOURCES), [source]);
  const objectUrls = useObjectUrls(sources);

  return source ? (objectUrls[0] ?? null) : null;
}

export function useObjectUrls(
  sources: readonly Blob[]
): readonly (string | null)[] {
  const [urlBySource, setUrlBySource] = useState<ObjectUrlMap>(() => new Map());
  const latestUrlBySource = useRef<ObjectUrlMap>(urlBySource);

  useEffect(() => {
    latestUrlBySource.current = urlBySource;
  }, [urlBySource]);

  useEffect(() => {
    const urlApi = getObjectUrlApi();

    if (!urlApi) {
      if (urlBySource.size) {
        const emptyUrls = new Map<Blob, string>();
        latestUrlBySource.current = emptyUrls;
        // Object URLs must be created after commit; this state publishes the ready URLs.
        setUrlBySource(emptyUrls);
      }
      return;
    }

    const activeSources = new Set(sources);
    let nextUrls: Map<Blob, string> | null = null;
    const getNextUrls = () => {
      nextUrls ??= new Map(urlBySource);
      return nextUrls;
    };

    for (const [source, url] of urlBySource) {
      if (!activeSources.has(source)) {
        urlApi.revokeObjectURL(url);
        getNextUrls().delete(source);
      }
    }

    for (const source of sources) {
      if (!(nextUrls ?? urlBySource).has(source)) {
        getNextUrls().set(source, urlApi.createObjectURL(source));
      }
    }

    if (nextUrls) {
      const resolvedUrls = nextUrls;
      latestUrlBySource.current = resolvedUrls;
      // Object URLs must be created after commit; this state publishes the ready URLs.
      setUrlBySource(resolvedUrls);
    }
  }, [sources, urlBySource]);

  useEffect(
    () => () => {
      const urlApi = getObjectUrlApi();

      if (!urlApi) {
        return;
      }

      for (const url of latestUrlBySource.current.values()) {
        urlApi.revokeObjectURL(url);
      }
      latestUrlBySource.current = new Map();
    },
    []
  );

  return sources.map((source) => urlBySource.get(source) ?? null);
}

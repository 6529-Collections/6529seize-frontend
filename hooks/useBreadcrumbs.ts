import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Crumb } from "../components/breadcrumb/Breadcrumb"; // Adjust path if needed
import { BreadcrumbQueueItem } from "./breadcrumbs.types";
import { buildStaticCrumbs } from "./breadcrumbs.utils";
import {
  DYNAMIC_ROUTE_CONFIGS,
  DeterminedRouteInfo,
} from "./breadcrumbs.config";

/**
 * Determines the appropriate route configuration (dynamic or static) based on the current path.
 * For dynamic routes, it iterates through `DYNAMIC_ROUTE_CONFIGS` to find a match.
 * Special handling for `/my-stream?wave=ID` is included to prioritize wave config if applicable.
 *
 * @param routeSegments Segments from `pathname` (e.g., `["profile", "[handle]"]`).
 * @param pathSegments Segments from `asPath` (e.g., `["profile", "user123"]`).
 * @param activePathname The current Next.js `pathname`.
 * @param activeQuery The current Next.js `query` object.
 * @returns A `DeterminedRouteInfo` object, which is either a specific dynamic config with params, or `{ type: "static" }`.
 */
const determineRouteConfig = (
  routeSegments: readonly string[],
  pathSegments: readonly string[],
  activePathname: string,
  activeQuery: Readonly<Record<string, string | string[]>>
): DeterminedRouteInfo => {
  if (
    activePathname === "/my-stream" &&
    activeQuery.wave &&
    typeof activeQuery.wave === "string"
  ) {
    const waveConfig = DYNAMIC_ROUTE_CONFIGS.find((c) => c.type === "wave");
    if (waveConfig) {
      const params = waveConfig.paramExtractor(pathSegments, activeQuery);
      if (params !== undefined) {
        return { config: waveConfig, params };
      }
    }
  }

  for (const config of DYNAMIC_ROUTE_CONFIGS) {
    if (routeSegments.length > 0 && config.pathPattern.test(routeSegments[0])) {
      const params = config.paramExtractor(pathSegments, activeQuery);
      if (params !== undefined) {
        return { config, params };
      }
    }
  }

  return { type: "static" };
};

// --- Main Hook ---
/**
 * Generates breadcrumbs for the current Next.js route.
 * It uses a configuration-driven approach defined in `DYNAMIC_ROUTE_CONFIGS`.
 * For dynamic routes, it matches the path against these configurations, extracts parameters,
 * fetches necessary data using react-query, and then builds the crumbs using a specific `crumbBuilder`.
 * For static routes, it generates a simple breadcrumb path from the URL segments.
 * The hook handles memoization and reacts to route changes.
 *
 * @returns An array of `Crumb` objects representing the breadcrumb trail.
 */
export const useBreadcrumbs = (): Crumb[] => {
  const router = useRouter();
  const { pathname, query, asPath } = router;

  const [activeItem, setActiveItem] = useState<BreadcrumbQueueItem>(() => {
    const filteredQuery: Record<string, string | string[]> = {};
    for (const key in query) {
      if (
        Object.prototype.hasOwnProperty.call(query, key) &&
        query[key] !== undefined
      ) {
        filteredQuery[key] = query[key]!;
      }
    }
    return { pathname, asPath, query: filteredQuery, timestamp: Date.now() };
  });

  const queryString = JSON.stringify(query);

  useEffect(() => {
    const filteredQuery: Record<string, string | string[]> = {};
    for (const key in query) {
      if (
        Object.prototype.hasOwnProperty.call(query, key) &&
        query[key] !== undefined
      ) {
        filteredQuery[key] = query[key]!;
      }
    }
    const newItem: BreadcrumbQueueItem = {
      pathname,
      asPath,
      query: filteredQuery,
      timestamp: Date.now(),
    };
    setActiveItem(newItem);
  }, [pathname, asPath, queryString]);

  const baseCrumbs: Crumb[] = useMemo(
    () => [{ display: "Home", href: "/" }],
    []
  );

  const activePathname = activeItem?.pathname ?? pathname;
  const activeAsPath = activeItem?.asPath ?? asPath;
  const activeQuery = activeItem?.query ?? query;

  const pathSegments = useMemo(
    () => activeAsPath.split("?")[0].split("/").filter(Boolean),
    [activeAsPath]
  );

  const routeSegments = useMemo(
    () => activePathname.split("/").filter(Boolean),
    [activePathname]
  );

  const determinedRouteInfo: DeterminedRouteInfo = useMemo(() => {
    return determineRouteConfig(
      routeSegments,
      pathSegments,
      activePathname,
      activeQuery
    );
  }, [activePathname, routeSegments, pathSegments, activeQuery]);

  // --- Centralized React Query Hook for Dynamic Data ---
  const getQueryKey = (info: DeterminedRouteInfo): readonly unknown[] => {
    if ("config" in info && info.config) {
      // The 'as any' is a pragmatic choice here. While DeterminedRouteInfo ensures config and params are
      // correlated types from DYNAMIC_ROUTE_CONFIGS, TypeScript can struggle to infer this specific
      // correlation for every config.queryKeyBuilder call directly within this generic helper.
      // Type safety is primarily enforced at the definition of each RouteDynamicConfig.
      return info.config.queryKeyBuilder(info.params);
    }
    return ["breadcrumb", "static", activePathname, activeQuery];
  };

  const fetchQueryData = async (
    info: DeterminedRouteInfo
  ): Promise<any | null> => {
    if ("config" in info && info.config) {
      // Similar to getQueryKey, 'as any' is used for params. The TParams generic in RouteDynamicConfig
      // and the specific params from paramExtractor ensure type safety within each config's fetcher.
      return info.config.fetcher(info.params);
    }
    return Promise.resolve(null);
  };

  const { data: dynamicData, isLoading: isLoadingDynamicData } = useQuery({
    queryKey: getQueryKey(determinedRouteInfo),
    queryFn: () => fetchQueryData(determinedRouteInfo),
    enabled: "config" in determinedRouteInfo && !!determinedRouteInfo.config,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // --- Assemble Crumbs ---
  const finalCrumbs = useMemo(() => {
    if ("config" in determinedRouteInfo && determinedRouteInfo.config) {
      // Similar to getQueryKey/fetchQueryData, 'as any' casts help manage the complexity of
      // calling a method from a union of configs with a union of params.
      // Type safety is largely enforced at the definition of each RouteDynamicConfig.
      const dynamicCrumbs = (determinedRouteInfo.config.crumbBuilder)(
        determinedRouteInfo.params,
        dynamicData,
        isLoadingDynamicData,
        pathSegments,
        activeQuery
      );
      return [...baseCrumbs, ...dynamicCrumbs];
    } else {
      return [...baseCrumbs, ...buildStaticCrumbs(pathSegments)];
    }
  }, [
    baseCrumbs,
    determinedRouteInfo,
    dynamicData,
    isLoadingDynamicData,
    pathSegments,
    activeQuery,
  ]);

  return finalCrumbs;
};

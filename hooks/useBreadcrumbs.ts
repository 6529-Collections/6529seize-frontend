"use client";

import { useMemo, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Crumb } from "../components/breadcrumb/Breadcrumb";
import { BreadcrumbQueueItem } from "./breadcrumbs.types";
import { buildStaticCrumbs } from "./breadcrumbs.utils";
import {
  DYNAMIC_ROUTE_CONFIGS,
  DeterminedRouteInfo,
} from "./breadcrumbs.config";

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

export const useBreadcrumbs = (): Crumb[] => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse query from URLSearchParams into a plain object
  const query = useMemo(() => {
    const q: Record<string, string | string[]> = {};
    if (!searchParams) return q;

    for (const [key, value] of Array.from(searchParams.entries())) {
      if (q[key]) {
        q[key] = Array.isArray(q[key]) ? [...q[key], value] : [q[key], value];
      } else {
        q[key] = value;
      }
    }
    return q;
  }, [searchParams]);

  const [activeItem, setActiveItem] = useState<BreadcrumbQueueItem>(() => ({
    pathname: pathname ?? "",
    asPath:
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
    query,
    timestamp: Date.now(),
  }));

  useEffect(() => {
    setActiveItem({
      pathname: pathname ?? "",
      asPath:
        pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
      query,
      timestamp: Date.now(),
    });
  }, [pathname, searchParams]);

  const baseCrumbs: Crumb[] = useMemo(
    () => [{ display: "Home", href: "/" }],
    []
  );

  const activePathname = activeItem.pathname;
  const activeAsPath = activeItem.asPath;
  const activeQuery = activeItem.query;

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

  const getQueryKey = (info: DeterminedRouteInfo): readonly unknown[] => {
    if ("config" in info && info.config) {
      return info.config.queryKeyBuilder(info.params);
    }
    return ["breadcrumb", "static", activePathname, activeQuery];
  };

  const fetchQueryData = async (
    info: DeterminedRouteInfo
  ): Promise<any | null> => {
    if ("config" in info && info.config) {
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

  const finalCrumbs = useMemo(() => {
    if ("config" in determinedRouteInfo && determinedRouteInfo.config) {
      const dynamicCrumbs = determinedRouteInfo.config.crumbBuilder(
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

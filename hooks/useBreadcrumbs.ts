import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Crumb } from "../components/breadcrumb/Breadcrumb"; // Adjust path if needed
import { commonApiFetch } from "../services/api/common-api"; // Import commonApiFetch
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "../constants"; // Import MEMES_CONTRACT
import { NextGenToken } from "../entities/INextgen";

/**
 * Represents a single breadcrumb item.
 * This type is imported from `../components/breadcrumb/Breadcrumb.tsx`.
 * The actual interface is:
 * export interface Crumb {
 *   display: string;
 *   href?: string;
 * }
 */

/**
 * Defines the recognized types for dynamic routes within the breadcrumb system.
 */
export type DynamicRouteType =
  | "gradient"
  | "profile"
  | "meme"
  | "collection"
  | "wave"
  | "nextgen"
  | "meme-lab"
  | "rememe";
// Add other specific dynamic route type strings here as they are defined

/**
 * Holds the configurations for all recognized dynamic route types.
 * Each element in this array defines how a specific dynamic route pattern
 * should be handled for breadcrumb generation, including parameter extraction,
 * data fetching, and crumb construction.
 *
 * To add support for a new dynamic route, create a new object conforming to
 * the `RouteDynamicConfig` interface (ensuring its `type` property is unique
 * and added to `DynamicRouteType`) and add it to this array. The order matters
 * for route matching if patterns could overlap, though specific patterns are preferred.
 */
export const DYNAMIC_ROUTE_CONFIGS: ReadonlyArray<RouteDynamicConfig> = [
  // Configuration for the "gradient" route type
  {
    type: "gradient",
    pathPattern: /^6529-gradient$/,
    paramExtractor: (pathSegments, query) => {
      // Assumes the ID is the segment after "6529-gradient" or from query.id
      const id = getDynamicParam(pathSegments, "6529-gradient", 1, query.id);
      return id ? { id } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchGradientName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "gradient", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [
        { display: "6529 Gradient", href: "/6529-gradient" },
      ];
      const displayName = isLoading
        ? "Loading..."
        : // Make sure to handle the case where data might be null/undefined if fetch fails or params were invalid
          data?.name ?? `Gradient ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
    // No parentCrumbs needed as this builder creates the full path from its base
  },
  // Configuration for the "profile" route type
  {
    type: "profile",
    pathPattern: /^profile$/,
    paramExtractor: (pathSegments, query) => {
      const handle = getDynamicParam(pathSegments, "profile", 1, query.handle);
      return handle ? { handle } : undefined;
    },
    fetcher: async (params: { readonly handle: string }) =>
      fetchProfileHandle(params.handle),
    queryKeyBuilder: (params: { readonly handle: string }) =>
      ["breadcrumb", "profile", params.handle] as const,
    crumbBuilder: (
      params: { readonly handle: string },
      data: { handle: string } | null | undefined,
      isLoading: boolean
    ) => {
      const displayName = isLoading
        ? "Loading..."
        : data?.handle ?? params.handle;
      // Profile pages are often terminal in breadcrumbs or have a simpler structure.
      // The original buildProfileCrumbs just returned [{ display: displayName }].
      return [{ display: displayName }];
    },
  },
  // Configuration for the "meme" route type (corresponds to /the-memes/:id)
  {
    type: "meme",
    pathPattern: /^the-memes$/,
    paramExtractor: (pathSegments, query) => {
      // ID is the segment after "the-memes" or from query.id
      const id = getDynamicParam(pathSegments, "the-memes", 1, query.id);
      return id ? { id } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchMemeName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "meme", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [{ display: "The Memes", href: "/the-memes" }];
      // paramExtractor ensures params.id exists if we are using this builder for a specific meme
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Meme ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Configuration for the "nextgen" route type
  {
    type: "nextgen",
    pathPattern: /^nextgen$/,
    paramExtractor: (pathSegments, query) => {
      // Path: /nextgen/tokens/:id. "nextgen" is segment 0.
      // `getDynamicParam` with baseSegment "nextgen" and offset 2 will look for pathSegments[0+2] which is the ID.
      // It correctly handles the case where "tokens" might be missing or path is shorter.
      const id = getDynamicParam(pathSegments, "nextgen", 2, query.id);
      return id ? { id } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchNextgenName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "nextgen", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [
        { display: "Nextgen", href: "/nextgen" }, // Base Nextgen page
        // If there was a browse page like /nextgen/tokens, it could be added here or by parentCrumbs
      ];
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Nextgen ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Configuration for the "rememe" route type
  {
    type: "rememe",
    pathPattern: /^rememes$/,
    paramExtractor: (pathSegments, query) => {
      const contract = getDynamicParam(
        pathSegments,
        "rememes",
        1,
        query.contract
      );
      const id = getDynamicParam(pathSegments, "rememes", 2, query.id);
      return contract && id ? { contract, id } : undefined;
    },
    fetcher: async (params: {
      readonly contract: string;
      readonly id: string;
    }) => fetchRememeName(params.contract, params.id),
    queryKeyBuilder: (params: {
      readonly contract: string;
      readonly id: string;
    }) => ["breadcrumb", "rememe", params.contract, params.id] as const,
    crumbBuilder: (
      params: { readonly contract: string; readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [{ display: "Rememes", href: "/rememes" }];
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Rememe ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Configuration for the "meme-lab" route type
  {
    type: "meme-lab",
    pathPattern: /^meme-lab$/,
    paramExtractor: (pathSegments, query) => {
      const id = getDynamicParam(pathSegments, "meme-lab", 1, query.id);
      return id ? { id } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchMemeLabName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "meme-lab", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [{ display: "Meme Lab", href: "/meme-lab" }];
      const displayName = isLoading
        ? "Loading..."
        : data?.name
        ? `Card ${params.id} - ${data.name}`
        : `Card ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Configuration for the "collection" route type
  {
    type: "collection",
    pathPattern: /^collections$/,
    paramExtractor: (pathSegments, query) => {
      // ID is the segment after "collections" or from query.id
      const id = getDynamicParam(pathSegments, "collections", 1, query.id);
      return id ? { id } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchCollectionName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "collection", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [
        { display: "Collections", href: "/collections" },
      ];
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Collection ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Configuration for the "wave" route type
  {
    type: "wave",
    pathPattern: /^waves$/,
    paramExtractor: (pathSegments, query) => {
      // Prioritize query.wave (for /my-stream?wave=ID)
      const idFromQuery = query.wave;
      if (idFromQuery && typeof idFromQuery === "string") {
        return { id: idFromQuery };
      }
      // Then try to get from path (for /waves/:id)
      const idFromPath = getDynamicParam(pathSegments, "waves", 1, query.id);
      return idFromPath ? { id: idFromPath } : undefined;
    },
    fetcher: async (params: { readonly id: string }) =>
      fetchWaveName(params.id),
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "wave", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean,
      pathSegments: readonly string[]
    ) => {
      const isMyStream = pathSegments[0] === "my-stream";
      const crumbs: Crumb[] = [
        {
          display: isMyStream ? "My Stream" : "Waves",
          href: isMyStream ? "/my-stream" : "/waves",
        },
      ];
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Wave ${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Other route configurations will be added here in subsequent steps
] as const;

/**
 * Represents the outcome of determining the route configuration.
 * `SpecificDeterminedRouteInfo` is a union of all possible specific configurations,
 * pairing each `config` object from `DYNAMIC_ROUTE_CONFIGS` with its correctly typed `params`.
 * `DeterminedRouteInfo` then unions this with a simple `{ type: "static" }` for non-dynamic routes.
 */
// New definition for DeterminedRouteInfo
export type SpecificDeterminedRouteInfo =
  (typeof DYNAMIC_ROUTE_CONFIGS)[number] extends infer C
    ? C extends { paramExtractor: (...args: any[]) => infer P | undefined } // P is the specific param type for config C
      ? { readonly config: C; readonly params: P }
      : never
    : never;

export type DeterminedRouteInfo =
  | SpecificDeterminedRouteInfo
  | { readonly type: "static" };

/**
 * Configuration for a dynamic route type used in breadcrumb generation.
 * @template TData The expected type of data resolved by the fetcher. This is typically an object
 *                 containing fields needed for display (e.g., `{ name: string }`) or null.
 * @template TParams The expected type of parameters extracted from the route by `paramExtractor`.
 *                   This is typically an object mapping param names to string values (e.g., `{ id: string }`).
 */
interface RouteDynamicConfig<TData = any, TParams = any> {
  /** A unique identifier for the route type, constrained by `DynamicRouteType`. Used for discriminating configs. */
  readonly type: DynamicRouteType;
  /**
   * A regular expression to match the primary path segment(s) that identify this route type.
   * For example, `/^the-memes$/` for a route starting with "the-memes".
   */
  readonly pathPattern: RegExp;
  /**
   * Extracts necessary parameters (like IDs or handles) from the route's path segments and query.
   * @param pathSegments readonly array of URL path segments (e.g., `["the-memes", "123"]`).
   * @param query readonly record of URL query parameters (e.g., `{ handle: "user1" }`).
   * @returns The extracted parameters (TParams) if successful, otherwise undefined.
   */
  readonly paramExtractor: (
    pathSegments: readonly string[],
    query: Readonly<Record<string, string | string[]>>
  ) => TParams | undefined;
  /**
   * Asynchronously fetches data required for the breadcrumb display (e.g., item name).
   * @param params The parameters extracted by paramExtractor.
   * @returns A promise that resolves to the fetched data (TData) or null if not found/error.
   */
  readonly fetcher: (params: TParams) => Promise<TData | null>;
  /**
   * Builds the react-query query key for fetching data for this route type.
   * @param params The parameters extracted by paramExtractor.
   * @returns A readonly array representing the query key.
   */
  readonly queryKeyBuilder: (params: TParams) => readonly unknown[];
  /**
   * Constructs the array of Crumb objects for this dynamic route.
   * @param params The parameters extracted by paramExtractor.
   * @param data The data resolved by the fetcher (TData).
   * @param isLoading Boolean indicating if the data is currently being fetched.
   * @param pathSegments readonly array of URL path segments (can be used for context).
   * @param query readonly record of URL query parameters (can be used for context).
   * @returns An array of Crumb objects specific to this route.
   */
  readonly crumbBuilder: (
    params: TParams,
    data: TData | null | undefined,
    isLoading: boolean,
    pathSegments: readonly string[],
    query: Readonly<Record<string, string | string[]>>
  ) => Crumb[];
  /** Optional array of static parent crumbs that should always precede crumbs generated by this configuration. */
  readonly parentCrumbs?: readonly Crumb[];
}

// Helper function to format path segments
const formatCrumbDisplay = (segment: string): string => {
  if (!segment) return "";
  return segment
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

// --- API Fetcher Functions ---
// Define functions to fetch minimal data needed for display names

const fetchGradientName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<{
      data?: [{ name: string }]; // Assume data array structure
    }>({
      endpoint: "nfts/gradients",
      params: { id },
    });
    const nftData = response?.data?.[0];
    return nftData ? { name: nftData.name } : null;
  } catch (error) {
    console.error("Error fetching gradient name:", error);
    return { name: `Gradient ${id}` }; // Fallback
  }
};

// Example: Fetch profile data (replace with actual implementation)
const fetchProfileHandle = async (
  handle: string
): Promise<{ handle: string } | null> => {
  if (!handle || typeof handle !== "string") return null;
  try {
    // Replace with actual API call for profile display name/handle
    // const response = await fetchUrl(`${process.env.API_ENDPOINT}/api/profile/${handle}`);
    // const profile = (response as any)?.data;
    // return profile ? { handle: profile.display_name ?? profile.handle } : null;
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
    return { handle: handle }; // Placeholder
  } catch (error) {
    console.error("Error fetching profile handle:", error);
    return { handle: handle }; // Fallback
  }
};

// NEW: Fetcher for Wave Name
const fetchWaveName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<{ name: string }>({
      endpoint: `waves/${id}`,
    });
    return response ? { name: response.name } : null;
  } catch (error) {
    // Fallback display
    console.error("Error fetching wave name:", error);
    return { name: `Wave ${id}` };
  }
};

// NEW: Fetcher for Meme Name
const fetchMemeName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<{
      data?: [{ name: string }]; // Assume data array structure
    }>({
      endpoint: "nfts",
      params: { contract: MEMES_CONTRACT, id },
    });
    const nftData = response?.data?.[0];
    return nftData?.name ? { name: nftData.name } : null;
  } catch (error) {
    console.error("Error fetching meme name:", error);
    return { name: `Meme ${id}` }; // Fallback display
  }
};

// NEW: Fetcher for Nextgen Name
const fetchNextgenName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<NextGenToken>({
      endpoint: `nextgen/tokens/${id}`,
    });
    return response?.name ? { name: response.name } : null;
  } catch (error) {
    console.error("Error fetching nextgen name:", error);
    return { name: `Nextgen ${id}` }; // Fallback display
  }
};

const fetchRememeName = async (
  contract: string,
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<any>({
      endpoint: `rememes`,
      params: { contract, id },
    });
    if (response?.data?.length > 0) {
      return { name: response.data[0].metadata?.name };
    }
    return { name: `Rememe ${id}` };
  } catch (error) {
    console.error("Error fetching meme name:", error);
    return { name: `Rememe ${id}` }; // Fallback display
  }
};

// NEW: Fetcher for Meme Lab Name
const fetchMemeLabName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<any>({
      endpoint: `nfts_memelab`,
      params: {
        contract: MEMELAB_CONTRACT,
        id,
      },
    });
    if (response?.data?.length > 0) {
      return { name: response.data[0].name };
    }
    return { name: `Meme Lab ${id}` };
  } catch (error) {
    console.error("Error fetching meme lab name:", error);
    return { name: `Meme Lab ${id}` }; // Fallback display
  }
};

// NEW: Fetcher for Collection Name
const fetchCollectionName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Use commonApiFetch
    const response = await commonApiFetch<{
      data?: [{ name: string }];
    }>({
      endpoint: "collections", // Assuming this is the correct endpoint
      params: { id },
    });
    const collectionData = response?.data?.[0];
    return collectionData?.name ? { name: collectionData.name } : null;
  } catch (error) {
    console.error("Error fetching collection name:", error);
    return { name: `Collection ${id}` }; // Fallback display
  }
};

// Helper function to safely extract dynamic segments
const getDynamicParam = (
  segments: readonly string[],
  baseSegment: string,
  offset: number = 1,
  queryParam?: string | string[]
): string | undefined => {
  const baseIndex = segments.indexOf(baseSegment);
  if (baseIndex === -1) return undefined;

  const paramIndex = baseIndex + offset;
  if (paramIndex >= segments.length) return undefined;

  if (queryParam) {
    if (Array.isArray(queryParam)) {
      return queryParam[0];
    }
    return queryParam;
  }
  return segments[paramIndex];
};

// Type definition for breadcrumb queue item
interface BreadcrumbQueueItem {
  pathname: string;
  asPath: string;
  query: Record<string, string | string[]>;
  timestamp: number;
}

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

// buildStaticCrumbs IS KEPT
const buildStaticCrumbs = (pathSegments: string[]): Crumb[] => {
  const crumbs: Crumb[] = [];
  let currentPath = "";
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    const display = formatCrumbDisplay(segment);
    if (i === pathSegments.length - 1) {
      crumbs.push({ display });
    } else {
      crumbs.push({ display, href: currentPath });
    }
  }
  return crumbs;
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
      // TS should now correlate info.config with info.params due to SpecificDeterminedRouteInfo structure.
      // The 'as any' is a pragmatic choice here because info.config is a union of all specific configs,
      // and info.params is a union of all specific param types. While they are correlated by DYNAMIC_ROUTE_CONFIGS as const,
      // TypeScript might struggle to infer this specific correlation for every config.queryKeyBuilder call directly.
      return info.config.queryKeyBuilder(info.params as any);
    }
    return ["breadcrumb", "static", activePathname, activeQuery];
  };

  const fetchQueryData = async (
    info: DeterminedRouteInfo
  ): Promise<any | null> => {
    if ("config" in info && info.config) {
      // Similar to getQueryKey, 'as any' is used for params. The generic TParams in RouteDynamicConfig
      // and the specific params extracted by paramExtractor ensure type safety within each config definition.
      return info.config.fetcher(info.params as any);
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
      // Dynamic route: use the crumbBuilder from the matched configuration
      // Similar to getQueryKey/fetchQueryData, the 'as any' cast on crumbBuilder and params
      // helps manage the complexity of calling a method from a union of configs with a union of params.
      // The type safety is largely enforced at the definition of each RouteDynamicConfig.
      const dynamicCrumbs = (determinedRouteInfo.config.crumbBuilder as any)(
        determinedRouteInfo.params as any,
        dynamicData,
        isLoadingDynamicData,
        pathSegments,
        activeQuery
      );
      return [...baseCrumbs, ...dynamicCrumbs];
    } else {
      // Static route or no match: use buildStaticCrumbs
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

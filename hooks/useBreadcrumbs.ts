import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Crumb } from "../components/breadcrumb/Breadcrumb"; // Adjust path if needed
import { commonApiFetch } from "../services/api/common-api"; // Import commonApiFetch
import { useWaveData } from "./useWaveData"; // Import useWaveData
import { ApiWave } from "../generated/models/ApiWave"; // Import ApiWave if needed for type checks
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "../constants"; // Import MEMES_CONTRACT
import { NextGenToken } from "../entities/INextgen";

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
    const response = await commonApiFetch<{
      data?: [{ name: string }]; // Assume data array structure
    }>({
      endpoint: "waves",
      params: { id },
    });
    const waveData = response?.data?.[0];
    return waveData ? { name: waveData.name } : null;
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

// --- Add more fetchers for other dynamic route types ---
// Helper function to safely extract dynamic segments
const getDynamicParam = (
  segments: string[],
  baseSegment: string,
  offset: number = 1,
  queryParam?: string | string[]
): string | undefined => {
  const baseIndex = segments.indexOf(baseSegment);
  if (baseIndex === -1) return undefined;

  const paramIndex = baseIndex + offset;
  if (paramIndex >= segments.length) return undefined;

  // First try query param, then fallback to URL segment
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

// Type definition for dynamic route configuration
type DynamicRouteConfig =
  | { type: "gradient"; id: string }
  | { type: "profile"; handle: string }
  | { type: "meme"; id: string }
  | { type: "collection"; contract: string; id?: string }
  | { type: "wave"; id: string }
  | { type: "nextgen"; id: string }
  | { type: "meme-lab"; id: string }
  | { type: "rememe"; contract: string; id: string }
  | { type: "static" };

// Helper function to determine dynamic route configuration
const determineRouteConfig = (
  routeSegments: string[],
  pathSegments: string[],
  activePathname: string,
  activeQuery: Record<string, string | string[]>
): DynamicRouteConfig => {
  const firstSegment = routeSegments[0];

  // Handle specific pathnames first
  if (
    activePathname === "/my-stream" &&
    activeQuery.wave &&
    typeof activeQuery.wave === "string"
  ) {
    return { type: "wave", id: activeQuery.wave };
  }

  switch (firstSegment) {
    case "6529-gradient": {
      const id = getDynamicParam(pathSegments, firstSegment, 1, activeQuery.id);
      return id ? { type: "gradient", id } : { type: "static" };
    }
    case "profile": {
      const handle = getDynamicParam(
        pathSegments,
        firstSegment,
        1,
        activeQuery.handle
      );
      return handle ? { type: "profile", handle } : { type: "static" };
    }
    case "the-memes": {
      const id = getDynamicParam(pathSegments, firstSegment, 1, activeQuery.id);
      return id ? { type: "meme", id } : { type: "static" };
    }
    case "collection": {
      const contract = getDynamicParam(
        pathSegments,
        firstSegment,
        1,
        activeQuery.contract
      );
      if (!contract) return { type: "static" };
      const id = getDynamicParam(pathSegments, firstSegment, 2, activeQuery.id);
      return { type: "collection", contract, id };
    }
    case "waves": {
      const id = getDynamicParam(pathSegments, firstSegment, 1, activeQuery.id);
      return id ? { type: "wave", id } : { type: "static" };
    }
    case "nextgen": {
      const id = getDynamicParam(pathSegments, firstSegment, 2, activeQuery.id);
      return id ? { type: "nextgen", id } : { type: "static" };
    }
    case "meme-lab": {
      const id = getDynamicParam(pathSegments, firstSegment, 1, activeQuery.id);
      return id ? { type: "meme-lab", id } : { type: "static" };
    }
    case "rememes": {
      const contract = getDynamicParam(pathSegments, firstSegment, 1, activeQuery.contract);
      const id = getDynamicParam(pathSegments, firstSegment, 2, activeQuery.id);
      return contract && id ? { type: "rememe", contract, id } : { type: "static" };
    }
    // Add more cases as needed
    default:
      return { type: "static" };
  }
};

// --- Crumb Building Helper Functions ---

const buildGradientCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "gradient" }>,
  isLoading: boolean,
  data: { name: string } | null | undefined
): Crumb[] => {
  const crumbs: Crumb[] = [
    { display: "6529 Gradient", href: "/6529-gradient" },
  ];
  const display = isLoading
    ? `Loading...`
    : data?.name ?? `Gradient ${config.id}`;
  crumbs.push({ display });
  return crumbs;
};

const buildProfileCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "profile" }>,
  isLoading: boolean,
  data: { handle: string } | null | undefined
): Crumb[] => {
  const display = isLoading ? `Loading...` : data?.handle ?? config.handle;
  return [{ display }];
};

const buildMemeCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "meme" }>,
  isLoading: boolean,
  data: { name: string } | null | undefined
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "The Memes", href: "/the-memes" }];
  if (config.id) {
    const display = isLoading
      ? `Loading...`
      : data?.name ?? `Meme ${config.id}`;
    crumbs.push({ display });
  }
  return crumbs;
};

const buildNextgenCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "nextgen" }>,
  isLoading: boolean,
  nextgenData: { name: string } | null | undefined
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "Nextgen", href: "/nextgen" }];
  if (config.id) {
    const display = isLoading
      ? `Loading...`
      : nextgenData?.name ?? `Nextgen ${config.id}`;
    crumbs.push({ display });
  }
  return crumbs;
};

const buildRememeCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "rememe" }>,
  isLoading: boolean,
  data: { name: string } | null | undefined
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "Rememes", href: "/rememes" }];

  if (config.contract && config.id) {
    const display = isLoading
      ? `Loading...`
      : data?.name ?? `Rememe ${config.id}`;
    crumbs.push({ display });
  }
  return crumbs;
};
const buildMemeLabCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "meme-lab" }>,
  isLoading: boolean,
  data: { name: string } | null | undefined
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "Meme Lab", href: "/meme-lab" }];
  if (config.id) {
    const display = isLoading
      ? `Loading...`
      : data?.name
      ? `Card ${config.id} - ${data.name}`
      : `Card ${config.id}`;
    crumbs.push({ display });
  }
  return crumbs;
};

const buildWaveCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "wave" }>,
  waveHookData: ReturnType<typeof useWaveData>
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "My Stream", href: "/my-stream" }];
  if (config.id) {
    const waveName = (waveHookData.data as ApiWave | undefined)?.name;
    const display = waveHookData.isLoading
      ? "Loading..."
      : waveName ?? `Wave ${config.id}`;
    crumbs.push({ display });
  }
  return crumbs;
};

const buildCollectionCrumbs = (
  config: Extract<DynamicRouteConfig, { type: "collection" }>
): Crumb[] => {
  const crumbs: Crumb[] = [{ display: "Collections", href: "/collections" }];
  if (config.contract) {
    crumbs.push({
      display: `Collection ${config.contract}`,
      href: config.id ? `/collection/${config.contract}` : undefined,
    });
    if (config.id) {
      crumbs.push({ display: `Item ${config.id}` });
    }
  }
  return crumbs;
};

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
export const useBreadcrumbs = (): Crumb[] => {
  const router = useRouter();
  const { pathname, query, asPath } = router;

  // Initialize activeItem state with initial route data using a function
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

  // Use stringified query for stable dependency
  const queryString = JSON.stringify(query);

  // Update activeItem whenever relevant router props change
  useEffect(() => {
    // Filter query params again inside effect to get current values
    const filteredQuery: Record<string, string | string[]> = {};
    for (const key in query) {
      if (
        Object.prototype.hasOwnProperty.call(query, key) &&
        query[key] !== undefined
      ) {
        filteredQuery[key] = query[key]!;
      }
    }

    // Create the new state based on current router values
    const newItem: BreadcrumbQueueItem = {
      pathname,
      asPath,
      query: filteredQuery,
      timestamp: Date.now(),
    };

    // Update the state
    setActiveItem(newItem);
  }, [pathname, asPath, queryString]); // Use stable queryString dependency

  // Base crumb: Always start with Home
  const baseCrumbs: Crumb[] = useMemo(
    () => [{ display: "Home", href: "/" }],
    []
  );

  // Use active item from queue if available, otherwise use current router state
  const activePathname = activeItem?.pathname ?? pathname;
  const activeAsPath = activeItem?.asPath ?? asPath;
  const activeQuery = activeItem?.query ?? query;

  // Determine route type and fetch data conditionally
  const pathSegments = useMemo(
    () => activeAsPath.split("?")[0].split("/").filter(Boolean),
    [activeAsPath]
  );

  const routeSegments = useMemo(
    () => activePathname.split("/").filter(Boolean),
    [activePathname]
  );

  // Extract route pattern using the helper function
  const dynamicRouteConfig = useMemo(() => {
    return determineRouteConfig(
      routeSegments,
      pathSegments,
      activePathname,
      activeQuery
    );
  }, [activePathname, routeSegments, pathSegments, activeQuery]);

  // --- React Query Hooks (Conditional) ---
  const { data: gradientData, isLoading: isLoadingGradient } = useQuery({
    queryKey: [
      "breadcrumb",
      "gradient",
      (() => {
        if (dynamicRouteConfig.type === "gradient") {
          return dynamicRouteConfig.id;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "gradient" && dynamicRouteConfig.id) {
        return fetchGradientName(dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === "gradient" && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: [
      "breadcrumb",
      "profile",
      (() => {
        if (dynamicRouteConfig.type === "profile") {
          return dynamicRouteConfig.handle;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "profile" && dynamicRouteConfig.handle) {
        return fetchProfileHandle(dynamicRouteConfig.handle);
      }
      return Promise.resolve(null);
    },
    enabled:
      dynamicRouteConfig.type === "profile" && !!dynamicRouteConfig.handle, // Ensure handle is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // RE-ADD: Query for Meme Name
  const { data: memeData, isLoading: isLoadingMeme } = useQuery({
    queryKey: [
      "breadcrumb",
      "meme",
      (() => {
        if (dynamicRouteConfig.type === "meme") {
          return dynamicRouteConfig.id;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "meme" && dynamicRouteConfig.id) {
        return fetchMemeName(dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === "meme" && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: nextgenData, isLoading: isLoadingNextgen } = useQuery({
    queryKey: [
      "breadcrumb",
      "nextgen",
      (() => {
        if (dynamicRouteConfig.type === "nextgen") {
          return dynamicRouteConfig.id;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "nextgen" && dynamicRouteConfig.id) {
        return fetchNextgenName(dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === "nextgen" && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: rememeData, isLoading: isLoadingRememe } = useQuery({
    queryKey: [
      "breadcrumb",
      "rememe",
      (() => {
        if (dynamicRouteConfig.type === "rememe") {
          return dynamicRouteConfig.id;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "rememe" && dynamicRouteConfig.id) {
        return fetchRememeName(dynamicRouteConfig.contract, dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === "rememe" && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: memeLabData, isLoading: isLoadingMemeLab } = useQuery({
    queryKey: [
      "breadcrumb",
      "meme-lab",
      (() => {
        if (dynamicRouteConfig.type === "meme-lab") {
          return dynamicRouteConfig.id;
        }
        return "invalid";
      })(),
    ],
    queryFn: () => {
      if (dynamicRouteConfig.type === "meme-lab" && dynamicRouteConfig.id) {
        return fetchMemeLabName(dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === "meme-lab" && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Use useWaveData hook conditionally
  const waveIdForHook = (() => {
    if (dynamicRouteConfig.type === "wave" && dynamicRouteConfig.id) {
      return dynamicRouteConfig.id;
    }
    return null;
  })();
  const waveDataFromHook = useWaveData({ waveId: waveIdForHook }); // Call the hook

  // --- Assemble Crumbs ---
  const finalCrumbs = useMemo(() => {
    if (dynamicRouteConfig.type === "static") {
      return [...baseCrumbs, ...buildStaticCrumbs(pathSegments)];
    }

    let dynamicCrumbs: Crumb[] = [];
    switch (dynamicRouteConfig.type) {
      case "gradient":
        dynamicCrumbs = buildGradientCrumbs(
          dynamicRouteConfig,
          isLoadingGradient,
          gradientData
        );
        break;
      case "profile":
        dynamicCrumbs = buildProfileCrumbs(
          dynamicRouteConfig,
          isLoadingProfile,
          profileData
        );
        break;
      case "meme":
        dynamicCrumbs = buildMemeCrumbs(
          dynamicRouteConfig,
          isLoadingMeme,
          memeData
        );
        break;
      case "wave":
        dynamicCrumbs = buildWaveCrumbs(dynamicRouteConfig, waveDataFromHook);
        break;
      case "collection":
        dynamicCrumbs = buildCollectionCrumbs(dynamicRouteConfig);
        break;
      case "nextgen":
        dynamicCrumbs = buildNextgenCrumbs(
          dynamicRouteConfig,
          isLoadingNextgen,
          nextgenData
        );
        break;
      case "rememe":
        dynamicCrumbs = buildRememeCrumbs(
          dynamicRouteConfig,
          isLoadingRememe,
          rememeData
        );
        break;
      case "meme-lab":
        dynamicCrumbs = buildMemeLabCrumbs(
          dynamicRouteConfig,
          isLoadingMemeLab,
          memeLabData
        );
        break;
      // No default needed as 'static' is handled above
    }
    return [...baseCrumbs, ...dynamicCrumbs];
  }, [
    baseCrumbs,
    dynamicRouteConfig,
    pathSegments,
    gradientData,
    isLoadingGradient,
    profileData,
    isLoadingProfile,
    waveDataFromHook,
    memeData, // Ensure dependency is present
    isLoadingMeme, // Ensure dependency is present
  ]);

  return finalCrumbs;
};

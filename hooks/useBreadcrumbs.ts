import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Crumb } from "../components/breadcrumb/Breadcrumb"; // Adjust path if needed
import { fetchUrl } from "../services/6529api"; // Adjust path if needed
import { useWaveData } from "./useWaveData"; // Import useWaveData
import { ApiWave } from "../generated/models/ApiWave"; // Import ApiWave if needed for type checks

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
    // TODO: Optimize API call if possible (e.g., dedicated endpoint or field selection)
    const response = await fetchUrl(
      `${process.env.API_ENDPOINT}/api/nfts/gradients?id=${id}`
    );
    const nftData = (response as any)?.data?.[0]; // Use safe parsing
    return nftData ? { name: nftData.name } : null;
  } catch (error) {
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
    return { handle: handle }; // Fallback
  }
};

// NEW: Fetcher for Wave Name
const fetchWaveName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    // Adjust endpoint if needed based on useWaveData.ts or actual API
    const response = await fetchUrl(
      `${process.env.API_ENDPOINT}/api/waves?id=${id}`
    );
    // Assuming response structure { data: [{ name: '...' }] }
    const waveData = (response as any)?.data?.[0];
    return waveData ? { name: waveData.name } : null;
  } catch (error) {
    // Fallback display
    return { name: `Wave ${id}` };
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
  return queryParam
    ? Array.isArray(queryParam)
      ? queryParam[0]
      : queryParam
    : segments[paramIndex];
};

// Type definition for breadcrumb queue item
interface BreadcrumbQueueItem {
  pathname: string;
  asPath: string;
  query: Record<string, string | string[]>;
  timestamp: number;
}

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
  const activePathname = activeItem?.pathname || pathname;
  const activeAsPath = activeItem?.asPath || asPath;
  const activeQuery = activeItem?.query || query;

  // Determine route type and fetch data conditionally
  const pathSegments = useMemo(
    () => activeAsPath.split("?")[0].split("/").filter(Boolean),
    [activeAsPath]
  );

  const routeSegments = useMemo(
    () => activePathname.split("/").filter(Boolean),
    [activePathname]
  );

  // Extract route pattern from router.pathname (contains [placeholders] for dynamic segments)
  const dynamicRouteConfig = useMemo(() => {
    // Check specific dedicated routes first
    if (routeSegments[0] === "6529-gradient") {
      const id = getDynamicParam(
        pathSegments,
        "6529-gradient",
        1,
        activeQuery.id
      );
      if (id) return { type: "gradient", id: id.toString() };
    }
    if (routeSegments[0] === "profile") {
      const handle = getDynamicParam(
        pathSegments,
        "profile",
        1,
        activeQuery.handle
      );
      if (handle) return { type: "profile", handle: handle.toString() };
    }
    if (routeSegments[0] === "the-memes") {
      const id = getDynamicParam(pathSegments, "the-memes", 1, activeQuery.id);
      if (id) return { type: "meme", id: id.toString() };
    }
    if (routeSegments[0] === "collection") {
      const contract = getDynamicParam(
        pathSegments,
        "collection",
        1,
        activeQuery.contract
      );
      if (contract) {
        const id = getDynamicParam(
          pathSegments,
          "collection",
          2,
          activeQuery.id
        );
        return {
          type: "collection",
          contract: contract.toString(),
          id: id?.toString(),
        };
      }
    }

    // --- NEW: Check for /my-stream with wave query parameter ---
    if (
      activePathname === "/my-stream" &&
      activeQuery.wave &&
      typeof activeQuery.wave === "string"
    ) {
      return { type: "wave", id: activeQuery.wave };
    }
    // --- End New Check ---

    // Handle dedicated /waves/[id] route (if it exists elsewhere, keep for robustness)
    if (routeSegments[0] === "waves") {
      const id = getDynamicParam(pathSegments, "waves", 1, activeQuery.id);
      if (id) return { type: "wave", id: id.toString() };
    }

    // Add more dynamic route patterns as needed

    return { type: "static" }; // Default for non-matching or static routes
  }, [activePathname, routeSegments, pathSegments, activeQuery]);

  // --- React Query Hooks (Conditional) ---
  const { data: gradientData, isLoading: isLoadingGradient } = useQuery({
    queryKey: [
      "breadcrumb",
      "gradient",
      dynamicRouteConfig.type === "gradient"
        ? dynamicRouteConfig.id
        : "invalid",
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
      dynamicRouteConfig.type === "profile"
        ? dynamicRouteConfig.handle
        : "invalid",
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

  // Use useWaveData hook conditionally
  const waveIdForHook =
    dynamicRouteConfig.type === "wave" && dynamicRouteConfig.id
      ? dynamicRouteConfig.id
      : null;
  const waveDataFromHook = useWaveData({ waveId: waveIdForHook }); // Call the hook

  // --- Assemble Crumbs ---
  const finalCrumbs = useMemo(() => {
    const generatedCrumbs: Crumb[] = [...baseCrumbs];

    if (dynamicRouteConfig.type !== "static") {
      switch (dynamicRouteConfig.type) {
        case "gradient": {
          // Add parent crumb
          generatedCrumbs.push({
            display: "6529 Gradient",
            href: "/6529-gradient",
          });

          // Add dynamic entity crumb
          const id = dynamicRouteConfig.id;
          if (id) {
            const display = isLoadingGradient
              ? `Loading...`
              : gradientData?.name || `Gradient ${id}`;
            generatedCrumbs.push({ display });
          }
          break;
        }
        case "profile": {
          // For profile pages, just add the profile crumb
          const handle = dynamicRouteConfig.handle;
          if (handle) {
            const display = isLoadingProfile
              ? `Loading...`
              : profileData?.handle || handle;
            generatedCrumbs.push({ display });
          }
          break;
        }
        case "meme": {
          // Add parent crumb
          generatedCrumbs.push({
            display: "The Memes",
            href: "/the-memes",
          });

          // Add dynamic entity crumb ONLY if an ID exists
          const id = dynamicRouteConfig.id;
          if (id) {
            generatedCrumbs.push({ display: `Meme ${id}` });
          }
          break;
        }
        case "wave": {
          const id = dynamicRouteConfig.id;
          // Add parent crumbs: Home -> My Stream
          generatedCrumbs.push({ display: "My Stream", href: "/my-stream" });

          // Add dynamic wave crumb if ID exists
          if (id) {
            // Use data and loading state from useWaveData hook
            const waveName = (waveDataFromHook.data as ApiWave | undefined)
              ?.name; // Adjust '.name' if property is different
            const display = waveDataFromHook.isLoading
              ? "Loading..." // Updated loading text
              : waveName || `Wave ${id}`; // Use fetched name or fallback
            generatedCrumbs.push({ display }); // Last crumb is not clickable
          }
          break;
        }
        case "collection": {
          // Add parent crumb
          generatedCrumbs.push({
            display: "Collections",
            href: "/collections",
          });

          // Add collection crumb
          const contract = dynamicRouteConfig.contract;
          const id = dynamicRouteConfig.id;

          if (contract) {
            generatedCrumbs.push({
              display: `Collection ${contract}`,
              href: id ? `/collection/${contract}` : undefined,
            });

            // Add item crumb if available
            if (id) {
              generatedCrumbs.push({ display: `Item ${id}` });
            }
          }
          break;
        }
        // Add more case handlers for other dynamic route types
      }

      return generatedCrumbs;
    }

    // For static routes, build breadcrumbs from path segments
    let currentPath = "";
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const display = formatCrumbDisplay(segment);

      // Last segment doesn't get a link
      if (i === pathSegments.length - 1) {
        generatedCrumbs.push({ display });
      } else {
        generatedCrumbs.push({ display, href: currentPath });
      }
    }

    return generatedCrumbs;
  }, [
    baseCrumbs,
    dynamicRouteConfig,
    gradientData,
    isLoadingGradient,
    profileData,
    isLoadingProfile,
    waveDataFromHook.data,
    waveDataFromHook.isLoading,
  ]);

  return finalCrumbs;
};

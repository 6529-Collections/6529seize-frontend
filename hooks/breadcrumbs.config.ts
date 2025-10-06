import { idStringToDisplay } from "@/helpers/Helpers";
import { Crumb } from "@/components/breadcrumb/Breadcrumb"; // Still needed by crumbBuilders
import {
  fetchCollectionName,
  fetchGradientName,
  fetchMemeLabName,
  fetchMemeName,
  fetchNextgenName,
  fetchProfileHandle,
  fetchRememeName,
  fetchWaveName,
} from "./breadcrumbs.api";
import { RouteDynamicConfig } from "./breadcrumbs.types";
import { getDynamicParam } from "./breadcrumbs.utils";

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
        : data?.name ?? `Gradient #${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Profile
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
      return [{ display: displayName }];
    },
  },
  // Meme
  {
    type: "meme",
    pathPattern: /^the-memes$/,
    paramExtractor: (pathSegments, query) => {
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
      let displayName: string;

      if (isLoading) {
        displayName = "Loading...";
      } else if (params.id === "mint") {
        displayName = "Mint";
      } else {
        displayName = data?.name ?? `Meme #${idStringToDisplay(params.id)}`;
      }
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Nextgen
  {
    type: "nextgen",
    pathPattern: /^nextgen$/,
    paramExtractor: (pathSegments, query) => {
      const id = getDynamicParam(pathSegments, "nextgen", 2, query.id);
      const isCollection = !pathSegments.includes("token");
      return id ? { id, isCollection } : undefined;
    },
    fetcher: async (params: {
      readonly id: string;
      readonly isCollection: boolean;
    }) => {
      return fetchNextgenName(params.id, params.isCollection);
    },
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "nextgen", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [{ display: "Nextgen", href: "/nextgen" }];
      const displayName = isLoading
        ? "Loading..."
        : data?.name ?? `Nextgen #${params.id}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Rememe
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
        : data?.name ?? `Rememe #${idStringToDisplay(params.id)}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Meme Lab
  {
    type: "meme-lab",
    pathPattern: /^meme-lab$/,
    paramExtractor: (pathSegments, query) => {
      const id = getDynamicParam(pathSegments, "meme-lab", 1, query.id);
      if (id === "collection") {
        const collection = getDynamicParam(
          pathSegments,
          "meme-lab",
          2,
          query.collection
        );
        return collection ? { collection } : undefined;
      }
      return id ? { id } : undefined;
    },
    fetcher: async (params: {
      readonly id: string;
      readonly collection: string;
    }) => {
      if (params.collection) {
        return undefined;
      }
      return fetchMemeLabName(params.id);
    },
    queryKeyBuilder: (params: { readonly id: string }) =>
      ["breadcrumb", "meme-lab", params.id] as const,
    crumbBuilder: (
      params: { readonly id: string; readonly collection: string },
      data: { name: string } | null | undefined,
      isLoading: boolean
    ) => {
      const crumbs: Crumb[] = [{ display: "Meme Lab", href: "/meme-lab" }];
      if (params.collection) {
        const collectionName = params.collection.replaceAll("-", " ");
        crumbs.push({
          display: `Collections`,
          href: "/meme-lab?sort=collections",
        });
        crumbs.push({
          display: collectionName,
        });
      } else {
        const displayName = isLoading
          ? "Loading..."
          : data?.name
          ? `Card #${idStringToDisplay(params.id)} - ${data.name}`
          : `Card #${idStringToDisplay(params.id)}`;
        crumbs.push({ display: displayName });
      }
      return crumbs;
    },
  },
  // Collection
  {
    type: "collection",
    pathPattern: /^collections$/,
    paramExtractor: (pathSegments, query) => {
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
        : data?.name ?? `Collection #${idStringToDisplay(params.id)}`;
      crumbs.push({ display: displayName });
      return crumbs;
    },
  },
  // Wave
  {
    type: "wave",
    pathPattern: /^waves$/,
    paramExtractor: (pathSegments, query) => {
      const idFromQuery = query.wave;
      if (idFromQuery && typeof idFromQuery === "string") {
        return { id: idFromQuery };
      }
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
] as const;

/**
 * Represents the outcome of determining the route configuration.
 * `SpecificDeterminedRouteInfo` is a union of all possible specific configurations,
 * pairing each `config` object from `DYNAMIC_ROUTE_CONFIGS` with its correctly typed `params`.
 * `DeterminedRouteInfo` then unions this with a simple `{ type: "static" }` for non-dynamic routes.
 */
export type SpecificDeterminedRouteInfo =
  (typeof DYNAMIC_ROUTE_CONFIGS)[number] extends infer C
    ? C extends { paramExtractor: (...args: any[]) => infer P | undefined }
      ? { readonly config: C; readonly params: P }
      : never
    : never;

export type DeterminedRouteInfo =
  | SpecificDeterminedRouteInfo
  | { readonly type: "static" };

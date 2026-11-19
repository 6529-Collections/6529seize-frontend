"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getProfileCmsAssetProxyUrl } from "@/lib/profile-cms/runtime/mediaProxy";

const EMOJI_CDN_BASE = "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji";
const S3_EMOJI_URL = getProfileCmsAssetProxyUrl(
  `${EMOJI_CDN_BASE}/emoji-list.json`
);

interface BaseEmoji {
  id: string;
  name: string;
  keywords: string;
}

export interface NativeEmoji extends BaseEmoji {
  skins: { native: string }[];
}

export interface Emoji extends BaseEmoji {
  skins: { src: string }[];
}

export type EmojiCategory = {
  id: string;
  name: string;
  category: string;
  emojis: Emoji[];
};

export type EmojiMartData = Record<string, unknown> & {
  emojis?: Record<string, NativeEmoji>;
};

interface EmojiContextType {
  emojiMap: EmojiCategory[];
  loading: boolean;
  categories: string[];
  categoryIcons: Record<string, { src: string }>;
  emojiData: EmojiMartData | null;
  findNativeEmoji: (emojiId: string) => NativeEmoji | null;
  findCustomEmoji: (emojiId: string) => Emoji | null;
  loadCustomEmojis: () => Promise<EmojiCategory[]>;
  loadNativeEmojis: () => Promise<EmojiMartData | null>;
  loadEmojiData: () => Promise<void>;
}

const EmojiContext = createContext<EmojiContextType | undefined>(undefined);

const EMOJI_CATEGORIES = [
  "frequent",
  "6529",
  "people",
  "nature",
  "foods",
  "activity",
  "places",
  "objects",
  "symbols",
  "flags",
];

const EMOJI_CATEGORY_ICONS = {
  "6529": {
    src: getProfileCmsAssetProxyUrl(`${EMOJI_CDN_BASE}/6529white.webp`),
  },
};

// After a failed custom emoji list load, wait before the next request, doubling
// the wait on each consecutive failure. Callers re-request on render (the
// composer's EmojiPlugin, DropPartMarkdown, the picker), so without a wait a
// fast-failing request is retried by every caller, every time.
const CUSTOM_EMOJI_RETRY_BASE_MS = 2_000;
const CUSTOM_EMOJI_RETRY_MAX_MS = 5 * 60_000;

// One shared empty map. Returning a new [] on each failure changed the
// provider's emojiMap identity, which re-ran EmojiPlugin's load effect and
// refetched the list in a loop that froze the page.
const NO_CUSTOM_EMOJIS: EmojiCategory[] = [];

let customEmojiMapCache: EmojiCategory[] | null = null;
let customEmojiMapPromise: Promise<EmojiCategory[]> | null = null;
let customEmojiFailureCount = 0;
let customEmojiRetryAt = 0;
let nativeEmojiDataCache: EmojiMartData | null = null;
let nativeEmojiDataPromise: Promise<EmojiMartData | null> | null = null;

const isCustomEmojiRetryDeferred = (): boolean =>
  customEmojiMapPromise === null && Date.now() < customEmojiRetryAt;

const recordCustomEmojiFailure = () => {
  customEmojiFailureCount += 1;
  customEmojiRetryAt =
    Date.now() +
    Math.min(
      CUSTOM_EMOJI_RETRY_BASE_MS * 2 ** (customEmojiFailureCount - 1),
      CUSTOM_EMOJI_RETRY_MAX_MS
    );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const mapCustomEmojiList = (emojiList: readonly string[]): EmojiCategory[] => {
  const mappedEmojis = emojiList.map((id) => ({
    id,
    name: id,
    keywords: id.replaceAll("_", " "),
    skins: [
      {
        src: getProfileCmsAssetProxyUrl(`${EMOJI_CDN_BASE}/${id}.webp`),
      },
    ],
  }));

  return [
    {
      id: "6529",
      name: "6529",
      category: "6529",
      emojis: mappedEmojis,
    },
  ];
};

const fetchCustomEmojiMap = async (): Promise<EmojiCategory[]> => {
  if (customEmojiMapCache !== null) {
    return customEmojiMapCache;
  }
  if (isCustomEmojiRetryDeferred()) {
    return NO_CUSTOM_EMOJIS;
  }

  customEmojiMapPromise ??= (async () => {
    try {
      const response = await fetch(S3_EMOJI_URL);
      if (!response.ok) throw new Error("Failed to load emoji list");

      const emojiList: unknown = await response.json();
      const emojiIds = Array.isArray(emojiList)
        ? emojiList.filter((id): id is string => typeof id === "string")
        : [];

      const loadedEmojiMap = mapCustomEmojiList(emojiIds);
      customEmojiMapCache = loadedEmojiMap;
      customEmojiFailureCount = 0;
      customEmojiRetryAt = 0;
      return loadedEmojiMap;
    } catch (error) {
      recordCustomEmojiFailure();
      console.error("Error fetching emoji list:", error);
      return NO_CUSTOM_EMOJIS;
    } finally {
      customEmojiMapPromise = null;
    }
  })();

  return customEmojiMapPromise;
};

const getEmojiMartDataFromModule = (module: unknown): EmojiMartData | null => {
  const defaultExport = isRecord(module) ? module["default"] : undefined;
  const candidate =
    isRecord(module) && isRecord(defaultExport) ? defaultExport : module;

  if (!isRecord(candidate)) {
    return null;
  }

  const emojis = candidate["emojis"];
  if (emojis !== undefined && !isRecord(emojis)) {
    return null;
  }

  return candidate as EmojiMartData;
};

const importNativeEmojiData = async (): Promise<EmojiMartData | null> => {
  if (nativeEmojiDataCache !== null) {
    return nativeEmojiDataCache;
  }

  nativeEmojiDataPromise ??= (async () => {
    try {
      const emojiMartDataModule = await import("@emoji-mart/data");
      const loadedEmojiData = getEmojiMartDataFromModule(emojiMartDataModule);
      nativeEmojiDataCache = loadedEmojiData;
      return loadedEmojiData;
    } catch (error) {
      console.error("Error loading emoji data:", error);
      return null;
    } finally {
      nativeEmojiDataPromise = null;
    }
  })();

  return nativeEmojiDataPromise;
};

const resetEmojiContextCachesForTests = () => {
  customEmojiMapCache = null;
  customEmojiMapPromise = null;
  customEmojiFailureCount = 0;
  customEmojiRetryAt = 0;
  nativeEmojiDataCache = null;
  nativeEmojiDataPromise = null;
};

declare global {
  var __resetEmojiContextCachesForTests: (() => void) | undefined;
}

if ("expect" in globalThis && "afterEach" in globalThis) {
  globalThis.__resetEmojiContextCachesForTests =
    resetEmojiContextCachesForTests;
}

export const EmojiProvider = ({ children }: { children: ReactNode }) => {
  const [emojiMap, setEmojiMap] = useState<EmojiCategory[]>(
    () => customEmojiMapCache ?? NO_CUSTOM_EMOJIS
  );
  const [emojiData, setEmojiData] = useState<EmojiMartData | null>(
    () => nativeEmojiDataCache
  );
  const [customEmojiLoading, setCustomEmojiLoading] = useState(false);
  const [nativeEmojiLoading, setNativeEmojiLoading] = useState(false);

  const loadCustomEmojis = useCallback(async () => {
    if (customEmojiMapCache !== null) {
      setEmojiMap(customEmojiMapCache);
      return customEmojiMapCache;
    }
    // While a failed load backs off, skip the request and the loading state
    // updates, so repeated callers do not re-render every emoji consumer.
    if (isCustomEmojiRetryDeferred()) {
      return NO_CUSTOM_EMOJIS;
    }

    setCustomEmojiLoading(true);
    try {
      const loadedEmojiMap = await fetchCustomEmojiMap();
      setEmojiMap(loadedEmojiMap);
      return loadedEmojiMap;
    } finally {
      setCustomEmojiLoading(false);
    }
  }, []);

  const loadNativeEmojis = useCallback(async () => {
    if (nativeEmojiDataCache !== null) {
      setEmojiData(nativeEmojiDataCache);
      return nativeEmojiDataCache;
    }

    setNativeEmojiLoading(true);
    try {
      const loadedEmojiData = await importNativeEmojiData();
      setEmojiData(loadedEmojiData);
      return loadedEmojiData;
    } finally {
      setNativeEmojiLoading(false);
    }
  }, []);

  const loadEmojiData = useCallback(async () => {
    await Promise.all([loadCustomEmojis(), loadNativeEmojis()]);
  }, [loadCustomEmojis, loadNativeEmojis]);

  const customEmojiIndex = useMemo(() => {
    const index = new Map<string, Emoji>();
    for (const category of emojiMap) {
      for (const emoji of category.emojis) {
        index.set(emoji.id, emoji);
      }
    }
    return index;
  }, [emojiMap]);

  const findCustomEmoji = useCallback(
    (emojiId: string) =>
      customEmojiIndex.get(emojiId.replaceAll(":", "")) ?? null,
    [customEmojiIndex]
  );

  const findNativeEmoji = useCallback(
    (emojiId: string) => {
      const normalizedId = emojiId.replaceAll(":", "");
      return emojiData?.emojis?.[normalizedId] ?? null;
    },
    [emojiData]
  );

  const value = useMemo(
    () => ({
      emojiMap,
      loading: customEmojiLoading || nativeEmojiLoading,
      categories: EMOJI_CATEGORIES,
      categoryIcons: EMOJI_CATEGORY_ICONS,
      emojiData,
      findNativeEmoji,
      findCustomEmoji,
      loadCustomEmojis,
      loadNativeEmojis,
      loadEmojiData,
    }),
    [
      emojiMap,
      customEmojiLoading,
      nativeEmojiLoading,
      emojiData,
      findNativeEmoji,
      findCustomEmoji,
      loadCustomEmojis,
      loadNativeEmojis,
      loadEmojiData,
    ]
  );

  return (
    <EmojiContext.Provider value={value}>{children}</EmojiContext.Provider>
  );
};

export const useEmoji = () => {
  const context = useContext(EmojiContext);
  if (!context) {
    throw new Error("useEmoji must be used within an EmojiProvider");
  }
  return context;
};

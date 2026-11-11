"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EmojiCategory } from "@/contexts/EmojiContext";
import type { EmojiMartData } from "@emoji-mart/data";
import {
  E2EE_EMOJI_PACK_PATH,
  parseE2eeEmojiPack,
  type E2eeCustomEmoji,
} from "@/lib/e2ee/emoji-pack";

interface EmojiState {
  readonly emojis: readonly E2eeCustomEmoji[];
  readonly native: ReadonlyMap<string, string>;
  readonly failed: boolean;
}
interface EmojiContextValue {
  readonly sources: ReadonlyMap<string, string>;
  readonly native: ReadonlyMap<string, string>;
  readonly categories: EmojiCategory[];
  readonly failed: boolean;
  readonly retry: () => void;
}
const EMPTY: EmojiState = { emojis: [], native: new Map(), failed: false };
const E2eeEmojiContext = createContext<EmojiContextValue>({
  sources: new Map(),
  native: new Map(),
  categories: [],
  failed: false,
  retry: () => undefined,
});
let pack: Promise<E2eeCustomEmoji[]> | null = null;
let nativePack: Promise<ReadonlyMap<string, string>> | null = null;

async function loadNativePack(): Promise<ReadonlyMap<string, string>> {
  const nativeModule = await import("@emoji-mart/data");
  // This is the version-pinned, bundled package, never message-provided data.
  const data = (
    "default" in nativeModule ? nativeModule.default : nativeModule
  ) as EmojiMartData;
  const native = new Map<string, string>();
  for (const [id, emoji] of Object.entries(data.emojis)) {
    const glyph = emoji.skins[0]?.native;
    if (glyph) native.set(id, glyph);
  }
  for (const [alias, id] of Object.entries(data.aliases)) {
    const glyph = native.get(id);
    if (glyph) native.set(alias, glyph);
  }
  return native;
}

async function fetchPack(): Promise<E2eeCustomEmoji[]> {
  const response = await fetch(E2EE_EMOJI_PACK_PATH, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("Emoji pack unavailable");
  return parseE2eeEmojiPack(await response.json());
}

/** Load the whole catalog when chat or notification UI mounts, never by shortcode. */
export function E2eeEmojiProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<EmojiState>(EMPTY);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);
  useEffect(() => {
    let current = true;
    const load = async () => {
      try {
        pack ??= fetchPack();
        nativePack ??= loadNativePack().catch(() => {
          nativePack = null;
          return new Map<string, string>();
        });
        const [emojis, native] = await Promise.all([pack, nativePack]);
        if (current) setState({ emojis, native, failed: false });
      } catch {
        pack = null;
        if (current) setState({ ...EMPTY, failed: true });
      }
    };
    void load();
    return () => {
      current = false;
    };
  }, [attempt]);
  const value = useMemo<EmojiContextValue>(
    () => ({
      sources: new Map(state.emojis.map(({ id, src }) => [id, src])),
      native: state.native,
      categories: [
        {
          id: "6529",
          name: "6529",
          category: "6529",
          emojis: state.emojis.map(({ id, src }) => ({
            id,
            name: id,
            keywords: id.replaceAll("_", " "),
            skins: [{ src }],
          })),
        },
      ],
      failed: state.failed,
      retry,
    }),
    [state, retry]
  );
  return (
    <E2eeEmojiContext.Provider value={value}>
      {children}
    </E2eeEmojiContext.Provider>
  );
}

export const useE2eeEmojis = () => useContext(E2eeEmojiContext);

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
import {
  E2EE_EMOJI_PACK_PATH,
  parseE2eeEmojiPack,
  type E2eeCustomEmoji,
} from "@/lib/e2ee/emoji-pack";

interface EmojiState {
  readonly emojis: readonly E2eeCustomEmoji[];
  readonly failed: boolean;
}
interface EmojiContextValue {
  readonly sources: ReadonlyMap<string, string>;
  readonly categories: EmojiCategory[];
  readonly failed: boolean;
  readonly retry: () => void;
}
const EMPTY: EmojiState = { emojis: [], failed: false };
const E2eeEmojiContext = createContext<EmojiContextValue>({
  sources: new Map(),
  categories: [],
  failed: false,
  retry: () => undefined,
});
let pack: Promise<E2eeCustomEmoji[]> | null = null;

async function fetchPack(): Promise<E2eeCustomEmoji[]> {
  const response = await fetch(E2EE_EMOJI_PACK_PATH, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("Emoji pack unavailable");
  return parseE2eeEmojiPack(await response.json());
}

/** Loading depends only on mounting encrypted chat UI, never on message contents. */
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
        const emojis = await pack;
        if (current) setState({ emojis, failed: false });
      } catch {
        pack = null;
        if (current) setState({ emojis: [], failed: true });
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

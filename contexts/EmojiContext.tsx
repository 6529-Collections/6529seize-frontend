import { createContext, useContext, useEffect, useMemo, useState } from "react";

const S3_EMOJI_URL = `https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/emoji-list.json?t=${Date.now()}`;

interface Emoji {
  id: string;
  name: string;
  keywords: string;
  skins: { src: string }[];
}

interface EmojiContextType {
  emojiMap: { id: string; name: string; category: string; emojis: Emoji[] }[];
  loading: boolean;
  categories: string[];
  categoryIcons: Record<string, { src: string }>;
}

const EmojiContext = createContext<EmojiContextType | undefined>(undefined);

export const EmojiProvider = ({ children }: { children: React.ReactNode }) => {
  const [emojiMap, setEmojiMap] = useState<EmojiContextType["emojiMap"]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
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

  const categoryIcons = {
    "6529": {
      src: "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/6529white.webp",
    },
  };

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        const response = await fetch(S3_EMOJI_URL);
        if (!response.ok) throw new Error("Failed to load emoji list");

        const emojiList: string[] = await response.json();

        const mappedEmojis = emojiList.map((id) => ({
          id,
          name: id,
          keywords: id.replace(/_/g, " "),
          skins: [
            {
              src: `https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/${id}.webp`,
            },
          ],
        }));

        setEmojiMap([
          {
            id: "6529",
            name: "6529",
            category: "6529",
            emojis: mappedEmojis,
          },
        ]);
      } catch (error) {
        console.error("Error fetching emoji list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmojis();
  }, []);

  const value = useMemo(
    () => ({ emojiMap, loading, categories, categoryIcons }),
    [emojiMap, loading, categories, categoryIcons]
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

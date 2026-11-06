/** @jest-environment node */
import type { EmojiCategory, EmojiMartData } from "@/contexts/EmojiContext";
const mockNative = {
  categories: [{ id: "people", emojis: ["grinning"] }],
  emojis: { grinning: { id: "grinning", skins: [{ native: "😀" }] } },
};
let mockData: Record<string, unknown>;
const mockReset = jest.fn();
jest.mock("emoji-mart", () => ({
  get Data() {
    return mockData;
  },
  init: jest.fn(async ({ data }) => {
    mockData = { ...data, originalCategories: data.categories };
  }),
  SearchIndex: { reset: mockReset },
}));
import { prepareEmojiMartData } from "@/components/waves/prepareEmojiMartData";

it("removes old custom objects/search data and accepts a pack arriving after native-only initialization", async () => {
  const data = mockNative as unknown as EmojiMartData;
  const publicCategory: EmojiCategory = {
    id: "6529",
    name: "6529",
    category: "6529",
    emojis: [
      {
        id: "gm",
        name: "gm",
        keywords: "gm",
        skins: [{ src: "https://example.com/gm.webp" }],
      },
    ],
  };
  await prepareEmojiMartData(data, [publicCategory]);
  Object.assign(mockData, {
    emojis: { stale: { skins: [{ src: "https://example.com/old.webp" }] } },
  });
  await prepareEmojiMartData(data, []);
  expect(mockData["originalCategories"]).toEqual(mockNative.categories);
  expect(mockData["emojis"]).toEqual(mockNative.emojis);
  const privateCategory = {
    ...publicCategory,
    emojis: [
      {
        ...publicCategory.emojis[0]!,
        skins: [{ src: "data:image/webp;base64,UklGRg==" }],
      },
    ],
  };
  await prepareEmojiMartData(data, [privateCategory]);
  expect(JSON.stringify(mockData)).not.toContain("https://");
  expect(mockData["originalCategories"]).toEqual([
    ...mockNative.categories,
    privateCategory,
  ]);
  expect(mockReset).toHaveBeenCalledTimes(3);
  expect(mockNative).toEqual({
    categories: [{ id: "people", emojis: ["grinning"] }],
    emojis: { grinning: { id: "grinning", skins: [{ native: "😀" }] } },
  });
});

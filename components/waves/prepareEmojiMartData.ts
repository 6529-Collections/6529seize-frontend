import type { EmojiCategory, EmojiMartData } from "@/contexts/EmojiContext";

type MartCategory = { id: string; name?: string; emojis: unknown[] };
type MartData = EmojiMartData & {
  categories: MartCategory[];
  originalCategories: MartCategory[];
};
let nativeBaseline: Promise<MartData> | null = null;

/** Emoji Mart keeps one mutable catalog/search index across all picker mounts. */
export async function prepareEmojiMartData(
  data: EmojiMartData,
  custom: EmojiCategory[]
): Promise<void> {
  const mart = await import("emoji-mart");
  nativeBaseline ??= (async () => {
    // Keep the context's native JSON pristine: Emoji Mart augments its input.
    await mart.init({ data: structuredClone(data) });
    return structuredClone(mart.Data as MartData);
  })();
  const clean = structuredClone(await nativeBaseline);
  // Its originalCategories array otherwise retains the first picker's custom
  // objects, including image URLs, even after the custom prop changes.
  clean.originalCategories = [
    ...clean.originalCategories.filter((category) => !category.name),
    ...custom,
  ];
  clean.categories = clean.originalCategories;
  Object.assign(mart.Data as MartData, clean);
  mart.SearchIndex.reset();
}

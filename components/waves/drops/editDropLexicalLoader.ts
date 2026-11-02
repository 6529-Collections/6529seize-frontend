import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";

import type { EditDropLexicalProps } from "./EditDropLexical";

// Kept apart from LazyEditDropLexical so pages can warm the editor chunk
// without importing the placeholder UI.
export const editDropLexicalLoader =
  createLazyComponentLoader<EditDropLexicalProps>(
    () => import("./EditDropLexical")
  );

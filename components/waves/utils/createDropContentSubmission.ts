export const shouldUseInitialDropConfig = (
  markdown: string | null,
  fileCount: number
): boolean => !markdown?.length && fileCount === 0;

export const hasCurrentDropPartContent = (
  markdown: string | null,
  fileCount: number
): boolean => Boolean(markdown?.trim().length || fileCount);

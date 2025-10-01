import { TRANSFORMERS, type Transformer } from "@lexical/markdown";

const UNDERSCORE_TAGS = new Set(["__", "___", "_"]);

const isObjectTransformer = (
  transformer: unknown
): transformer is Transformer =>
  typeof transformer === "object" && transformer !== null;

const BASE_SAFE_TRANSFORMERS = TRANSFORMERS.filter((transformer) => {
  if (!isObjectTransformer(transformer)) {
    return true;
  }

  const maybeTag = (transformer as { tag?: unknown }).tag;
  if (typeof maybeTag !== "string") {
    return true;
  }

  return !UNDERSCORE_TAGS.has(maybeTag);
});

const isCodeTransformer = (transformer: Transformer): boolean => {
  const dependencies = (transformer as { dependencies?: unknown }).dependencies;
  if (!Array.isArray(dependencies)) {
    return false;
  }

  return dependencies.some((dependency) => {
    if (
      !dependency ||
      typeof dependency !== "object" ||
      typeof (dependency as { getType?: unknown }).getType !== "function"
    ) {
      return false;
    }

    return (dependency as { getType: () => string }).getType() === "code";
  });
};

export const SAFE_MARKDOWN_TRANSFORMERS = BASE_SAFE_TRANSFORMERS;

export const SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE =
  BASE_SAFE_TRANSFORMERS.filter(
    (transformer) =>
      !isObjectTransformer(transformer) || !isCodeTransformer(transformer)
  );

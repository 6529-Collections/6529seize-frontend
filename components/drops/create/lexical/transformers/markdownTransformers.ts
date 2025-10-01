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
  if (!Array.isArray(transformer.dependencies)) {
    return false;
  }

  return transformer.dependencies.some((dependency) => {
    if (!dependency || typeof dependency.getType !== "function") {
      return false;
    }

    return dependency.getType() === "code";
  });
};

// Strip underscore-triggered shortcuts so pasting code keeps underscores intact.
export const SAFE_MARKDOWN_TRANSFORMERS = BASE_SAFE_TRANSFORMERS;

// Variant that keeps fenced code fences as raw markdown (useful for edit mode).
export const SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE =
  BASE_SAFE_TRANSFORMERS.filter(
    (transformer) =>
      !isObjectTransformer(transformer) || !isCodeTransformer(transformer)
  );

import { inferPlaywrightEnvironment } from "./readonlyMutationGuard";

export const TEST_SIZE_TAGS = Object.freeze({
  large: "@large",
  medium: "@medium",
  small: "@small",
});

export type TestSize = keyof typeof TEST_SIZE_TAGS;

export function tagTestTitle(size: TestSize, title: string) {
  return `${TEST_SIZE_TAGS[size]} ${title}`;
}

export function resolvePlaywrightTestSize(baseURL?: string): TestSize {
  const environment = inferPlaywrightEnvironment(baseURL);
  return environment === "staging" || environment === "production"
    ? "large"
    : "medium";
}

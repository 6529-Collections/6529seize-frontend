import type { AiUseImageKey } from "../useImages";

export type AiUseBlock =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "h3"; readonly id: string; readonly title: string }
  | {
      readonly kind: "steps";
      readonly items: readonly {
        readonly text: string;
        readonly blocks?: readonly AiUseBlock[] | undefined;
      }[];
    }
  | {
      readonly kind: "code";
      /** Where it runs, or "Output" for what it prints. */
      readonly label: string;
      readonly code: string;
      /** What a command printed: no copy button. */
      readonly output?: boolean | undefined;
    }
  | {
      readonly kind: "image";
      readonly image: AiUseImageKey;
      readonly alt: string;
    }
  | { readonly kind: "list"; readonly items: readonly string[] };

export type AiUseSection = {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly AiUseBlock[];
};

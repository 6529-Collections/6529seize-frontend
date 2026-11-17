import type { AiUseImageKey } from "../useImages";

export type AiUseBlock =
  | { readonly kind: "p"; readonly text: string }
  /** What to expect from a step: how long it takes, how big it gets. */
  | { readonly kind: "note"; readonly text: string }
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
      /**
       * `<version>` in it is the newest release's version, and
       * `<deb-version>` the same as Debian writes it (0.1.0~rc.2).
       */
      readonly code: string;
      /** What a command printed: no copy button. */
      readonly output?: boolean | undefined;
    }
  | {
      readonly kind: "image";
      readonly image: AiUseImageKey;
      readonly alt: string;
      /** What a phone's picture shows, where it is another capture. */
      readonly phoneAlt?: string | undefined;
    }
  | { readonly kind: "list"; readonly items: readonly string[] };

export type AiUseSection = {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly AiUseBlock[];
};

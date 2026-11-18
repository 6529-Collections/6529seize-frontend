import type { AiUseImageKey } from "../useImages";
import type { AiUseBlock } from "./types";

// Short forms of the walk-through's blocks, so its sections read as text.

/** A paragraph. */
export function p(text: string): AiUseBlock {
  return { kind: "p", text };
}

/** A heading inside a section, with its anchor. */
export function h3(id: string, title: string): AiUseBlock {
  return { kind: "h3", id, title };
}

/** What to expect from a step: how long it takes, how big it gets. */
export function note(text: string): AiUseBlock {
  return { kind: "note", text };
}

/** A picture, with what it shows, and what a phone's shows where that differs. */
export function image(
  key: AiUseImageKey,
  alt: string,
  phoneAlt?: string
): AiUseBlock {
  return phoneAlt === undefined
    ? { kind: "image", image: key, alt }
    : { kind: "image", image: key, alt, phoneAlt };
}

/** A command to copy, with where it runs: "Terminal", "PowerShell". */
export function command(label: string, code: string): AiUseBlock {
  return { kind: "code", label, code };
}

/** What a command printed: no copy button. */
export function printed(code: string, label = "Output"): AiUseBlock {
  return { kind: "code", label, code, output: true };
}

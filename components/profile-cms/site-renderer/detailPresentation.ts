import type { RendererContext } from "./types";

const INHERITED_TEXT = "tw-text-inherit";

const STUDIO_DETAIL_CLASSES = {
  unavailable:
    "tw-flex tw-min-h-48 tw-items-center tw-justify-center tw-border tw-border-dashed tw-border-[color:var(--cms-line)] tw-p-6 tw-text-sm",
  title: INHERITED_TEXT,
  text: INHERITED_TEXT,
  muted: INHERITED_TEXT,
  label: INHERITED_TEXT,
  value: INHERITED_TEXT,
  accent: INHERITED_TEXT,
  panel:
    "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[color:var(--cms-line)] tw-pt-5",
  tile: "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[color:var(--cms-line)] tw-pt-3",
  figure: "!tw-m-0 !tw-bg-transparent",
  frame: "!tw-aspect-auto !tw-bg-transparent",
  image: "!tw-h-auto tw-max-h-[80vh] tw-object-contain",
  link: "tw-text-inherit tw-underline tw-underline-offset-4 hover:tw-opacity-70",
};

const STANDARD_DETAIL_CLASSES = {
  unavailable:
    "tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400",
  title: "tw-text-white",
  text: "tw-text-iron-300",
  muted: "tw-text-iron-400",
  label: "tw-text-iron-500",
  value: "tw-text-iron-100",
  accent: "tw-text-primary-300",
  panel: "tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5",
  tile: "tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3",
  figure: "tw-border tw-border-solid tw-border-iron-800",
  frame: "tw-min-h-[min(72dvh,48rem)] tw-bg-black",
  image: "tw-object-contain",
  link: "hover:tw-text-primary-200",
};

export function getCmsDetailClasses(context?: RendererContext) {
  return context?.appearance === "studio"
    ? STUDIO_DETAIL_CLASSES
    : STANDARD_DETAIL_CLASSES;
}

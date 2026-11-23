// The shapes of the setup guide's text under /validator/guide.

/** One page as written: its Markdown, one string per line. */
export type ValidatorGuidePageSource = {
  /** The path after /validator/guide; empty for the start page. */
  readonly slug: string;
  readonly title: string;
  /** The page's name in the guide's list of pages. */
  readonly navTitle: string;
  readonly description: string;
  readonly lines: readonly string[];
};

/** One page as the site shows it. */
export type ValidatorGuidePageText = Omit<ValidatorGuidePageSource, "lines"> & {
  readonly markdown: string;
};

/** One way to run the validator, as a card on the start page. */
export type ValidatorGuidePath = {
  readonly title: string;
  readonly href: string;
  readonly summary: string;
  readonly facts: readonly { readonly label: string; readonly value: string }[];
};

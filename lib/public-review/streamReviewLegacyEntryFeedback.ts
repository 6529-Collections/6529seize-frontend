// Preserve feedback targets from the superseded current-only entry guides.
export const STREAM_REVIEW_LEGACY_ENTRY_FEEDBACK_VERSION = "2026-08-01.1";

export const STREAM_REVIEW_LEGACY_ENTRY_SECTIONS: Readonly<
  Record<string, readonly string[]>
> = {
  overview: [
    "what-kinds-of-art-can-it-support",
    "how-does-a-release-work",
    "what-lasts",
    "choose-what-you-want-to-understand",
    "help-shape-it",
  ],
  "for-artists": [
    "decide-what-you-are-releasing",
    "know-what-your-approval-covers",
    "understand-who-gets-paid",
    "decide-what-can-change-and-what-should-become-permanent",
    "what-would-work-for-your-practice",
  ],
  "for-collectors": [
    "know-the-artwork-you-would-receive",
    "understand-the-sale",
    "know-where-your-bid-and-refund-go",
    "understand-what-can-change-after-minting",
    "consider-long-term-access",
    "what-would-you-want-answered-before-collecting",
  ],
  "review-the-code": [
    "start-with-the-actual-connections",
    "check-the-most-consequential-claims-first",
    "follow-claims-to-evidence",
    "leave-a-finding-someone-can-act-on",
  ],
};

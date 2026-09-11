import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getRequiredEditorialMatch,
  replaceRequiredEditorialMarkdown,
} from "@/lib/public-review/editorialReplacement";

const RANDOMNESS_EXPECTED_INTRO = `For generative art, randomness is part of the work's provenance. A collector
should be able to determine which provider produced the input, which request it
answered, which token and collection it belonged to, how callbacks were
handled, whether anyone requested new randomness, and why the final seed is
permanent.

Stream therefore treats randomness as a lifecycle. Requests, delays, failures,
provider changes, retries, and disputed outputs all receive durable state.`;
const RANDOMNESS_EXPECTED_END =
  /9\. Does every supported provider give artists and collectors an equally clear\s+provenance record even though its trust model differs\?\s*$/;
const RANDOMNESS_EDITORIAL = /^# Randomness[\s\S]*$/;

type RandomnessSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentRandomnessEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: RandomnessSource;
}): string {
  getRequiredEditorialMatch(
    editorialMarkdown,
    RANDOMNESS_EXPECTED_END,
    "randomness ending"
  );
  const withVerifiedIntro = replaceRequiredEditorialMarkdown(
    editorialMarkdown,
    RANDOMNESS_EXPECTED_INTRO,
    RANDOMNESS_EXPECTED_INTRO,
    "randomness introduction"
  );
  return replaceRequiredEditorialMarkdown(
    withVerifiedIntro,
    RANDOMNESS_EDITORIAL,
    t(locale, "publicReview.pages.randomness.currentEditorial", {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }),
    "randomness editorial"
  );
}

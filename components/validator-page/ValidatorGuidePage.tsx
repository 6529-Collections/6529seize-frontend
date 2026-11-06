import Link from "next/link";

import { VALIDATOR_GUIDE_FOLDS } from "@/lib/validator-page/content/guideMarkdown";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import ValidatorFold from "./ValidatorFold";
import ValidatorFoldOpener from "./ValidatorFoldOpener";
import ValidatorMarkdown from "./ValidatorMarkdown";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";
import {
  ValidatorFeedback,
  ValidatorNeeds,
  ValidatorUpgrade,
} from "./ValidatorSections";
import ValidatorSteps, { type ValidatorDebs } from "./ValidatorSteps";
import { LINK, SECTION_HEADING } from "./validatorStyles";

/**
 * The tester guide: the same three steps as the download page, then closed
 * sections for what the app doesn't show on its own screens.
 */
export default function ValidatorGuidePage({
  platform,
  debs,
  newest,
}: {
  readonly platform: VisitorPlatform;
  readonly debs: ValidatorDebs;
  /** The signed list's newest version, for the upgrade note. */
  readonly newest: string | undefined;
}) {
  return (
    <ValidatorPageFrame current="guide">
      <ValidatorFoldOpener />
      <ValidatorPageHeader
        eyebrow="Tester guide"
        title="Set up the 6529 validator"
      >
        <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
          Download it from the{" "}
          <Link href="/validator" className={LINK}>
            download page
          </Link>
          . The app walks you through the rest.
        </p>
      </ValidatorPageHeader>

      <ValidatorUpgrade newest={newest} />

      <section aria-labelledby="steps">
        <h2 id="steps" className="tw-sr-only">
          Three steps
        </h2>
        <ValidatorSteps initial={platform} debs={debs} />
      </section>

      <ValidatorNeeds />
      <ValidatorFeedback />

      <section aria-labelledby="more" className="tw-mt-14">
        <h2 id="more" className={SECTION_HEADING}>
          More
        </h2>
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3">
          {VALIDATOR_GUIDE_FOLDS.map((fold) => (
            <ValidatorFold key={fold.id} id={fold.id} title={fold.title}>
              <ValidatorMarkdown markdown={fold.markdown} />
            </ValidatorFold>
          ))}
        </div>
      </section>
    </ValidatorPageFrame>
  );
}

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_USE_FOOTNOTE,
  AI_USE_INTRO,
  AI_USE_LEAD,
  AI_USE_SECTIONS,
  type AiUseBlock,
} from "@/lib/ai-page/content/use";
import AiPageFrame, { AI_BODY, AI_H2 } from "../AiPageFrame";
import AiReportProblem from "../AiReportProblem";
import InlineText from "../InlineText";
import AiUseBlocks from "./AiUseBlocks";
import AiUseContents from "./AiUseContents";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * The newest release's version in what the commands print, where the
 * walk-through writes `<version>`; Debian writes a pre-release with "~".
 * Without a feed, the placeholders stay.
 */
function withVersion(
  blocks: readonly AiUseBlock[],
  version: string | undefined
): readonly AiUseBlock[] {
  if (!version) {
    return blocks;
  }
  const deb = version.replace(/-(?=[a-z])/, "~");
  return blocks.map((block) => {
    if (block.kind === "code") {
      return {
        ...block,
        code: block.code
          .replaceAll("<deb-version>", deb)
          .replaceAll("<version>", version),
      };
    }
    if (block.kind === "steps") {
      return {
        ...block,
        items: block.items.map((item) =>
          item.blocks
            ? { ...item, blocks: withVersion(item.blocks, version) }
            : item
        ),
      };
    }
    return block;
  });
}

/**
 * /ai/use: real use of 6529 AI once it is installed, section by section,
 * with its contents beside it from 1024 px and in a bar at the top of a
 * phone.
 */
export default function AiUsePage({
  version,
}: {
  /** The newest release's version, for the eyebrow. */
  readonly version: string | undefined;
}) {
  const sections = AI_USE_SECTIONS.map(({ id, title }) => ({ id, title }));
  const contents = t(LOCALE, "ai.use.contents");
  const backToTop = t(LOCALE, "ai.use.backToTop");
  return (
    <AiPageFrame
      current="use"
      wide
      eyebrow={t(LOCALE, "ai.use.eyebrow")}
      version={version}
      title={t(LOCALE, "ai.use.title")}
      lead={AI_USE_LEAD}
    >
      <div className="tw-mt-8 lg:tw-grid lg:tw-grid-cols-[13rem_minmax(0,1fr)] lg:tw-gap-12">
        <div className="tw-hidden lg:tw-block">
          <div className="tw-sticky tw-top-6">
            <AiUseContents
              sections={sections}
              label={contents}
              backToTop={backToTop}
              layout="column"
            />
          </div>
        </div>
        <div className="tw-min-w-0">
          <AiUseContents
            sections={sections}
            label={contents}
            backToTop={backToTop}
            layout="bar"
          />
          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-4 lg:tw-mt-2">
            <AiUseBlocks blocks={AI_USE_INTRO} />
          </div>
          {AI_USE_SECTIONS.map((section, index) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="tw-mt-14 tw-flex tw-flex-col tw-gap-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-10"
            >
              <h2
                id={section.id}
                className={`tw-mb-1 tw-flex tw-scroll-mt-16 tw-items-baseline tw-gap-3 ${AI_H2}`}
              >
                <span className="tw-text-base tw-font-medium tw-tabular-nums tw-text-iron-500">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              <AiUseBlocks blocks={withVersion(section.blocks, version)} />
            </section>
          ))}
          <p
            className={`tw-mb-0 tw-mt-14 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-10 ${AI_BODY}`}
          >
            <InlineText text={t(LOCALE, "ai.use.issues")} />
          </p>
          <div className="tw-mt-8">
            <AiReportProblem />
          </div>
          <p className="tw-mb-0 tw-mt-8 tw-max-w-3xl tw-text-xs tw-leading-5 tw-text-iron-500">
            <InlineText text={AI_USE_FOOTNOTE} />
          </p>
        </div>
      </div>
    </AiPageFrame>
  );
}

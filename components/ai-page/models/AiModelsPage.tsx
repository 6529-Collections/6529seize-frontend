import { formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getAiModelCounts,
  getAiModelFacets,
  getAiModelSections,
  type AiModelFacets,
} from "@/lib/ai-page/models";
import ValidatorFold from "@/components/validator-page/ValidatorFold";
import AiPageFrame, { AI_H2, AI_MUTED } from "../AiPageFrame";
import InlineText from "../InlineText";
import AiModelCard, { formatGB } from "./AiModelCard";
import {
  AiModelFilterBar,
  AiModelFilterItem,
  AiModelFilterProvider,
  AiModelJumpList,
  AiModelNoMatch,
  AiModelSectionFilter,
  type AiModelFilterText,
} from "./AiModelFilters";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

function filterText(): AiModelFilterText {
  return {
    label: t(LOCALE, "ai.models.filter.label"),
    runs: t(LOCALE, "ai.models.filter.runs"),
    reads: {
      label: t(LOCALE, "ai.models.filter.reads"),
      choices: {
        any: t(LOCALE, "ai.models.filter.reads.any"),
        text: t(LOCALE, "ai.models.filter.reads.text"),
        image: t(LOCALE, "ai.models.filter.reads.image"),
        audio: t(LOCALE, "ai.models.filter.reads.audio"),
      },
    },
    makes: {
      label: t(LOCALE, "ai.models.filter.makes"),
      choices: {
        any: t(LOCALE, "ai.models.filter.makes.any"),
        text: t(LOCALE, "ai.models.filter.makes.text"),
        image: t(LOCALE, "ai.models.filter.makes.image"),
        audio: t(LOCALE, "ai.models.filter.makes.audio"),
      },
    },
    memory: t(LOCALE, "ai.models.filter.memory"),
    anySize: t(LOCALE, "ai.models.filter.anySize"),
    upTo: [8, 16, 24, 48, 80].map((size) =>
      t(LOCALE, "ai.models.filter.upTo", { size: formatGB(size) })
    ),
    count: t(LOCALE, "ai.models.filter.count", {
      shown: "{shown}",
      total: "{total}",
    }),
    clear: t(LOCALE, "ai.models.filter.clear"),
    none: t(LOCALE, "ai.models.filter.none"),
    section: t(LOCALE, "ai.models.filter.section"),
    allSections: t(LOCALE, "ai.models.filter.allSections"),
  };
}

/**
 * /ai/models: every model in the 6529 AI registry by section, with a
 * filter for what the app runs today, what a model reads and makes, and
 * how much memory it needs.
 */
export default function AiModelsPage() {
  const counts = getAiModelCounts();
  const sections = getAiModelSections();
  const facets: Record<string, AiModelFacets> = {};
  for (const section of sections) {
    for (const model of section.models) {
      facets[model.id] = getAiModelFacets(model);
    }
  }
  const jump = sections.map((section) => ({
    id: section.id,
    title: section.title,
    ids: section.models.map((model) => model.id),
  }));
  const jumpLabel = t(LOCALE, "ai.models.jump");
  return (
    <AiPageFrame
      current="models"
      wide
      eyebrow={t(LOCALE, "ai.models.eyebrow")}
      title={t(LOCALE, "ai.models.title")}
      lead={t(LOCALE, "ai.models.lead", {
        models: formatNumber(LOCALE, counts.models),
        entries: formatNumber(LOCALE, counts.entries),
        runnableEntries: formatNumber(LOCALE, counts.entriesRunnableToday),
        runnableModels: formatNumber(LOCALE, counts.modelsRunnableToday),
      })}
    >
      <div className="tw-mt-6">
        <ValidatorFold
          id="how-to-read"
          title={t(LOCALE, "ai.models.howToRead")}
          small
        >
          <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-pl-5">
            {(
              [
                "ai.models.howToRead.today",
                "ai.models.howToRead.memory",
                "ai.models.howToRead.scores",
                "ai.models.howToRead.measured",
              ] as const
            ).map((key) => (
              <li key={key} className={`${AI_MUTED} marker:tw-text-iron-600`}>
                <InlineText text={t(LOCALE, key)} />
              </li>
            ))}
          </ul>
        </ValidatorFold>
      </div>
      <AiModelFilterProvider facets={facets}>
        <div className="tw-mt-8">
          <div className="tw-min-w-0">
            <AiModelFilterBar text={filterText()} sections={jump} />
            <div className="tw-mt-4 xl:tw-hidden">
              <AiModelJumpList sections={jump} label={jumpLabel} />
            </div>
            <AiModelNoMatch text={filterText()} />
            {sections.map((section) => (
              <AiModelSectionFilter
                key={section.id}
                ids={section.models.map((model) => model.id)}
              >
                <section
                  aria-labelledby={section.id}
                  className="tw-mt-12 tw-flex tw-flex-col tw-gap-4"
                >
                  <header className="tw-flex tw-flex-col tw-gap-1">
                    <h2 id={section.id} className={`tw-scroll-mt-24 ${AI_H2}`}>
                      {section.title}
                    </h2>
                    <p className={`tw-m-0 tw-max-w-3xl ${AI_MUTED}`}>
                      {section.line}{" "}
                      <span className="tw-text-iron-500">
                        {section.runnable > 0
                          ? t(LOCALE, "ai.models.section.count", {
                              models: formatNumber(
                                LOCALE,
                                section.models.length
                              ),
                              runnable: formatNumber(LOCALE, section.runnable),
                            })
                          : t(LOCALE, "ai.models.section.countNone", {
                              models: formatNumber(
                                LOCALE,
                                section.models.length
                              ),
                            })}
                      </span>
                    </p>
                  </header>
                  <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
                    {section.models.map((model) => (
                      <AiModelFilterItem key={model.id} id={model.id}>
                        <AiModelCard model={model} />
                      </AiModelFilterItem>
                    ))}
                  </ul>
                </section>
              </AiModelSectionFilter>
            ))}
          </div>
        </div>
      </AiModelFilterProvider>
    </AiPageFrame>
  );
}

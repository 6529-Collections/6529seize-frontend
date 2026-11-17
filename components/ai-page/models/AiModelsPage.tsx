import { formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getAiModelCounts,
  getAiModelFacets,
  getAiModelSections,
  type AiModelSection,
} from "@/lib/ai-page/models";
import ValidatorFold from "@/components/validator-page/ValidatorFold";
import AiPageFrame, { AI_MUTED } from "../AiPageFrame";
import InlineText from "../InlineText";
import AiModelCard, { formatGB } from "./AiModelCard";
import AiModelsView, {
  type AiModelsSection,
  type AiModelsText,
} from "./AiModelsView";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

function choices(which: "reads" | "makes") {
  return {
    label: t(LOCALE, `ai.models.filter.${which}`),
    choices: {
      any: t(LOCALE, `ai.models.filter.${which}.any`),
      text: t(LOCALE, `ai.models.filter.${which}.text`),
      image: t(LOCALE, `ai.models.filter.${which}.image`),
      audio: t(LOCALE, `ai.models.filter.${which}.audio`),
    },
  };
}

function viewText(): AiModelsText {
  return {
    label: t(LOCALE, "ai.models.filter.label"),
    search: t(LOCALE, "ai.models.filter.search"),
    runs: t(LOCALE, "ai.models.filter.runs"),
    reads: choices("reads"),
    makes: choices("makes"),
    memory: t(LOCALE, "ai.models.filter.memory"),
    anySize: t(LOCALE, "ai.models.filter.anySize"),
    upTo: [8, 16, 24, 48, 80].map((size) =>
      t(LOCALE, "ai.models.filter.upTo", { size: formatGB(size) })
    ),
    memoryHint: t(LOCALE, "ai.models.filter.memoryHint"),
    sort: t(LOCALE, "ai.models.sort.label"),
    sorts: {
      memory: t(LOCALE, "ai.models.sort.memory"),
      newest: t(LOCALE, "ai.models.sort.newest"),
      name: t(LOCALE, "ai.models.sort.name"),
    },
    view: t(LOCALE, "ai.models.view.label"),
    views: {
      cards: t(LOCALE, "ai.models.view.cards"),
      table: t(LOCALE, "ai.models.view.table"),
    },
    section: t(LOCALE, "ai.models.filter.section"),
    sections: t(LOCALE, "ai.models.jump"),
    count: t(LOCALE, "ai.models.filter.count", {
      shown: "{shown}",
      total: "{total}",
    }),
    clear: t(LOCALE, "ai.models.filter.clear"),
    none: t(LOCALE, "ai.models.filter.none"),
    legend: t(LOCALE, "ai.models.legend"),
    filters: t(LOCALE, "ai.models.filter.title"),
    filtersCount: t(LOCALE, "ai.models.filter.button", { count: "{count}" }),
    showCount: t(LOCALE, "ai.models.filter.show", { shown: "{shown}" }),
    table: {
      model: t(LOCALE, "ai.models.table.model"),
      maker: t(LOCALE, "ai.models.table.maker"),
      size: t(LOCALE, "ai.models.table.size"),
      memory: t(LOCALE, "ai.models.table.memory"),
      memoryShort: t(LOCALE, "ai.models.table.memoryShort"),
      memoryNote: t(LOCALE, "ai.models.table.memoryNote"),
      inApp: t(LOCALE, "ai.models.table.inApp"),
      inAppShort: t(LOCALE, "ai.models.table.inAppShort"),
      yes: t(LOCALE, "ai.models.card.inApp"),
      open: t(LOCALE, "ai.models.table.open"),
    },
  };
}

function sectionCount(section: AiModelSection): string {
  return section.runnable > 0
    ? t(LOCALE, "ai.models.section.count", {
        models: formatNumber(LOCALE, section.models.length),
        runnable: formatNumber(LOCALE, section.runnable),
      })
    : t(LOCALE, "ai.models.section.countNone", {
        models: formatNumber(LOCALE, section.models.length),
      });
}

function viewSection(section: AiModelSection): AiModelsSection {
  return {
    id: section.id,
    title: section.title,
    line: section.line,
    count: sectionCount(section),
    rows: section.models.map((model) => {
      const smallest = model.variants.reduce((a, b) =>
        b.memoryGB < a.memoryGB ? b : a
      );
      return {
        id: model.id,
        name: model.name,
        maker: model.publisher,
        size: formatGB(smallest.sizeGB, smallest.bytes),
        memory: formatGB(smallest.memoryGB),
        facets: getAiModelFacets(model),
      };
    }),
  };
}

/**
 * /ai/models: every model in the 6529 AI registry by section, with a
 * search, filters, an order, and a table to compare them.
 */
export default function AiModelsPage({
  version,
}: {
  /** The newest release's version, for the eyebrow. */
  readonly version: string | undefined;
}) {
  const counts = getAiModelCounts();
  const sections = getAiModelSections();
  const cards = Object.fromEntries(
    sections.flatMap((section) =>
      section.models.map((model) => [
        model.id,
        <AiModelCard key={model.id} model={model} />,
      ])
    )
  );
  return (
    <AiPageFrame
      current="models"
      wide
      eyebrow={t(LOCALE, "ai.models.eyebrow")}
      version={version}
      title={t(LOCALE, "ai.models.title")}
      lead={t(LOCALE, "ai.models.lead", {
        models: formatNumber(LOCALE, counts.models),
        runnable: formatNumber(LOCALE, counts.modelsRunnableToday),
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
                "ai.models.howToRead.order",
              ] as const
            ).map((key) => (
              <li key={key} className={`${AI_MUTED} marker:tw-text-iron-600`}>
                <InlineText text={t(LOCALE, key)} />
              </li>
            ))}
          </ul>
        </ValidatorFold>
      </div>
      <div className="tw-mt-8 tw-min-w-0">
        <AiModelsView
          sections={sections.map(viewSection)}
          cards={cards}
          text={viewText()}
        />
      </div>
    </AiPageFrame>
  );
}

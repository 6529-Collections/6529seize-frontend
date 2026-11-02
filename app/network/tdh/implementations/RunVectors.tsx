"use client";

import { useState } from "react";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Glyph } from "@/components/explained/marks/glyphs";
import Tag from "@/components/explained/marks/Tag";
import { PUBLIC_VECTORS_JSON } from "@/components/explained/engine/publicVectors";
import {
  canonicalJson,
  isObject,
  parseJsonExact,
  type JsonObject,
  type JsonValue,
} from "@/components/explained/engine/json";
import { runVector } from "@/components/explained/engine/vectors";
import { EX_BUTTON } from "@/components/explained/tokens";
import { plain } from "@/components/explained/rich";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";

/**
 * Run the public vectors here (TDH-DESIGN.md §4.7): the five public vectors,
 * run in this browser by the same TDH v1.4 engine as the chapter's models,
 * each with its checks and its time. Break it: one expected value is moved
 * by one TDH, and the engine refuses the vector, naming the field.
 */
interface Result {
  readonly id: string;
  readonly pass: boolean;
  readonly checks: number;
  readonly ms: number;
  readonly failure: string | null;
}

/** The vector whose expected final the Break it moves, and its first identity. */
const BROKEN_VECTOR = "04-mid-period-transfer";

function vectors(): JsonObject {
  const all = parseJsonExact(PUBLIC_VECTORS_JSON);
  if (!isObject(all) || !isObject(all["vectors"])) {
    throw new Error("The public vectors have no vectors block.");
  }
  return all["vectors"];
}

/** The vector with its first identity's expected final one TDH higher. */
function moved(vector: JsonObject): JsonObject {
  const expected = vector["expected"];
  if (!isObject(expected) || !isObject(expected["identities"])) return vector;
  const identities = expected["identities"];
  const [first] = Object.keys(identities);
  const record = first === undefined ? undefined : identities[first];
  if (first === undefined || !isObject(record)) return vector;
  const final: JsonValue | undefined = record["final"];
  if (typeof final !== "number") return vector;
  return {
    ...vector,
    expected: {
      ...expected,
      identities: { ...identities, [first]: { ...record, final: final + 1 } },
    },
  };
}

function runAll(broken: boolean): Result[] {
  return Object.entries(vectors()).map(([id, vector]) => {
    const file =
      broken && id === BROKEN_VECTOR && isObject(vector)
        ? moved(vector)
        : vector;
    const began = performance.now();
    const run = runVector(id, canonicalJson(file));
    return {
      id,
      pass: run.status === "pass",
      checks: run.checks,
      ms: performance.now() - began,
      failure: run.failures[0] ?? null,
    };
  });
}

export default function RunVectors({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [results, setResults] = useState<Result[] | null>(null);
  const [broken, setBroken] = useState(false);
  const run = (nextBroken: boolean) => {
    setBroken(nextBroken);
    setResults(runAll(nextBroken));
  };
  const s = (
    key: Parameters<typeof plain>[1],
    params?: Readonly<Record<string, string | number>>
  ) => plain(locale, key, params);
  return (
    <section
      className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5"
      data-lens="run-vectors"
      data-broken={broken ? "1" : "0"}
      aria-label={s("explained.tdh.impl.here.label")}
      data-ex-allow-number=""
    >
      <div className="tw-grid tw-gap-3.5">
        <div>
          <b className="tw-block tw-text-base tw-font-semibold tw-text-iron-50">
            {s("explained.tdh.impl.here.label")}
          </b>
          <span className="tw-mt-1 tw-block tw-text-[15px] tw-leading-6 tw-text-iron-400">
            {s("explained.tdh.impl.here.body")}
          </span>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
          <button
            type="button"
            className={EX_BUTTON.cta}
            onClick={() => run(false)}
            data-run-vectors=""
          >
            {results === null
              ? s("explained.tdh.impl.here.run")
              : s("explained.tdh.impl.here.again")}
          </button>
          <BreakIt
            id="expected"
            pressed={broken}
            onToggle={() => run(!broken)}
            label={breakItLabel(locale, s("explained.tdh.impl.here.breakEdge"))}
          />
        </div>
      </div>
      {results !== null && (
        <ol
          className="tw-m-0 tw-mt-4 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-p-0"
          aria-live="polite"
        >
          {results.map((result) => (
            <li
              key={result.id}
              className="tw-grid tw-grid-cols-[16px_minmax(0,1fr)] tw-gap-x-2.5 tw-gap-y-1 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 tw-text-[15px] tw-leading-6 md:tw-grid-cols-[16px_minmax(0,1fr)_auto]"
              data-vector={result.id}
              data-pass={result.pass ? "1" : "0"}
            >
              <Glyph
                kind={result.pass ? "tested" : "shownFalse"}
                className="tw-mt-1.5 tw-size-3.5"
              />
              <span className="tw-min-w-0">
                <code className="tw-font-mono tw-text-[14px] tw-text-iron-50">
                  {result.id}
                </code>{" "}
                <span
                  className={result.pass ? "tw-text-green" : "tw-text-error"}
                >
                  {result.pass
                    ? s("explained.tdh.impl.here.pass")
                    : s("explained.tdh.impl.here.fail")}
                </span>
                {result.failure !== null && (
                  <span className="tw-block tw-font-mono tw-text-[13px] tw-text-iron-300 [overflow-wrap:anywhere]">
                    {result.failure}
                  </span>
                )}
              </span>
              <span className="tw-col-start-2 tw-text-sm tw-text-iron-400 md:tw-col-start-auto md:tw-text-right">
                {s("explained.tdh.impl.here.checks", {
                  checks: formatCount(locale, result.checks),
                  ms: formatCount(locale, Math.max(1, Math.round(result.ms))),
                })}
              </span>
            </li>
          ))}
        </ol>
      )}
      {broken && results !== null && (
        <p className="tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {/* A changed vector is constructed, as the other pages' failing
              states are: it carries the same Simulated tag. */}
          <Tag kind="simulated" locale={locale} />
          <span>{s("explained.tdh.impl.here.broken")}</span>
        </p>
      )}
    </section>
  );
}

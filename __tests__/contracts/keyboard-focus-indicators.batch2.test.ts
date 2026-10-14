/**
 * Batch 2 of the focus-visible sweep: every `focus:tw-outline-none` outside the
 * batch 1 directories keeps a visible keyboard indicator that reaches 3:1.
 *
 * Detection lives in `./support/keyboardFocusIndicators`. Batch 1 scopes its
 * own contract test to the shell directories it migrated; this one scans the
 * rest of `app/` and `components/`, so a new unindicated control anywhere
 * outside those directories fails here. After both batches land, the two tests
 * can be merged into one scan of `app/` and `components/`.
 */
import {
  type AuditedException,
  type FocusIndicatorHit,
  exceptionFor,
  findHits,
  literalHash,
  normalize,
  scanHits,
} from "./support/keyboardFocusIndicators";

const SCAN_ROOTS = ["app", "components"];
/** Migrated by batch 1; its contract test owns them. */
const BATCH_1_DIRECTORIES = [
  "components/header/",
  "components/layout/",
  "components/brain/",
  "components/waves/",
  "components/drops/",
  "components/utils/",
  "components/common/",
];

/** Literal-level exceptions; changing the class literal invalidates them. */
const OPTIONS_REASON =
  "Headless UI options container: focus stays on the container (or on the combobox input) while the active option is highlighted by the option classes. The option highlight contrast is a separate follow-up.";
const SCROLL_TARGET_REASON =
  "Hash-navigation scroll target (tabIndex -1 when it has an id): it receives focus programmatically and is neither a tab stop nor a control.";
const LIGHT_SURFACE_REASON =
  "Input on the white modal panel: the iron-950 ring measures about 18:1 against white, so the dark-surface model reports it incorrectly.";
const AUDITED_EXCEPTIONS: readonly AuditedException[] = [
  {
    file: "components/about/AboutFAQ.tsx",
    marker: "tw-scroll-mt-24 focus:tw-outline-none",
    literalHash:
      "ab3eb033a1738ab0e439f4fa409a1939b7db8bb7c2a8a0af17008abe269b16a5",
    reason: SCROLL_TARGET_REASON,
  },
  {
    file: "components/collect/CollectCollectionSelector.tsx",
    marker: "[--anchor-gap:0.5rem] focus:tw-outline-none",
    literalHash:
      "2cb3000ae2311c2060bbb30b73aabe7aa58cfd8e7398b6425d707a0803a4cc4d",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/collect/CollectGoalDefinitionMobilePicker.tsx",
    marker: "tw-flex-1 tw-overflow-y-auto focus:tw-outline-none",
    literalHash:
      "b8d719763334b640887f883710d9417742e9709d903a3d818e65ed30bf85c9a1",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/collect/CollectGoalDefinitionPicker.tsx",
    marker: "[--anchor-max-height:16rem] focus:tw-outline-none",
    literalHash:
      "175d8af1cac20732ec0f620107c3854dc5d71745eb0c8af464bb165d57a80d0b",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/collect/CollectOrderExpiryPicker.tsx",
    marker: "[--anchor-gap:0.5rem] focus:tw-outline-none",
    literalHash:
      "bed88b99ea2302b322f27a47376174290ee4501fae7e21a9044056340b57e5bc",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/collect/OfferPlanPricing.tsx",
    marker: "[--anchor-gap:0.5rem] focus:tw-outline-none",
    literalHash:
      "2cb3000ae2311c2060bbb30b73aabe7aa58cfd8e7398b6425d707a0803a4cc4d",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/compact-menu/constants.ts",
    marker: "tw-ring-white/10 focus:tw-outline-none",
    literalHash:
      "fc67692f96fa47ea517e75389f640e1b72ce241bce2aa5d34ad76f70249950d0",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/rememes/RememeAddComponent.tsx",
    marker: "tw-shadow-2xl focus:tw-outline-none",
    literalHash:
      "a8be3591c44d81e2b2ab577dd0c854361ed2196b3d385deaf6af14edc1262719",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/searchModal/SearchModal.tsx",
    marker: "focus:tw-ring-iron-950",
    literalHash:
      "d1c8e49498881149e692f89866b28f4d8cd267f6b0a2367d031769287ae02a8f",
    reason: LIGHT_SURFACE_REASON,
  },
  {
    file: "components/user/proxy/create/target/ProxyCreateTargetSearch.tsx",
    marker: "tw-ring-opacity-5 focus:tw-outline-none",
    literalHash:
      "38395627062cf57de2aa5f22903407f7d1dee38db62aaded55df0f2540b7b831",
    reason: OPTIONS_REASON,
  },
];

describe("controls that remove the focus outline keep a keyboard indicator", () => {
  const hits: FocusIndicatorHit[] = scanHits(SCAN_ROOTS, BATCH_1_DIRECTORIES);

  it("finds no unaudited focus:tw-outline-none without a 3:1 replacement", () => {
    const unaudited = hits
      .filter((hit) => !exceptionFor(hit, AUDITED_EXCEPTIONS))
      .map(({ file, problem, literal }) => ({
        file,
        problem,
        literal: normalize(literal),
        hash: literalHash(literal),
      }));

    expect(unaudited).toEqual([]);
  });

  it("keeps every exception explained and attached to exactly one hit", () => {
    for (const exception of AUDITED_EXCEPTIONS) {
      expect(exception.reason.length).toBeGreaterThan(40);
    }
    const detached = AUDITED_EXCEPTIONS.filter(
      (exception) =>
        hits.filter(
          (hit) => exceptionFor(hit, AUDITED_EXCEPTIONS) === exception
        ).length !== 1
    ).map(({ file, marker }) => ({ file, marker }));

    expect(detached).toEqual([]);
  });
});

describe("indicator detection", () => {
  const button = (classes: string) =>
    `const A = () => <button className="${classes}" />;`;

  it("flags a control that only removes the outline", () => {
    expect(findHits(button("tw-p-2 focus:tw-outline-none"))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
  });

  it("accepts the sweep pattern and any-modality focus rings", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("flags faint rings and Tailwind's default ring colour", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
    expect(
      findHits(button("focus:tw-outline-none focus-visible:tw-ring-2"))
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("default") }),
    ]);
  });

  it("does not count a background tint as an indicator", () => {
    expect(
      findHits(button("focus:tw-outline-none focus-visible:tw-bg-white/10"))
    ).toEqual([expect.objectContaining({ problem: "no focus indicator" })]);
  });

  it("lets a strong focus-visible ring override a faint pointer ring", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/40 focus-visible:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("requires a visible change when the resting ring already matches", () => {
    expect(
      findHits(
        button(
          "tw-ring-1 tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1"
        )
      )
    ).toEqual([expect.objectContaining({ problem: "no focus indicator" })]);
    expect(
      findHits(
        button(
          "tw-ring-1 tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("follows same-file class constants and template interpolations", () => {
    const source = `
      const FOCUS = "focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
      const A = () => <button className={\`tw-p-2 focus:tw-outline-none \${FOCUS}\`} />;
    `;
    expect(findHits(source)).toEqual([]);
  });

  it("credits a wrapping focus-within ring and the forms plugin", () => {
    const wrapped = `const A = () => (
      <div className="tw-ring-1 focus-within:tw-ring-2 focus-within:tw-ring-primary-400">
        <input className="tw-border-0 focus:tw-outline-none" />
      </div>
    );`;
    expect(findHits(wrapped)).toEqual([]);
    expect(
      findHits(
        button("tw-form-input tw-ring-1 focus:tw-outline-none focus:tw-ring-1")
      )
    ).toEqual([]);
  });

  it("measures an explicit forms-plugin ring instead of trusting the plugin", () => {
    expect(
      findHits(
        button(
          "tw-form-input tw-ring-1 focus:tw-outline-none focus:tw-ring-inset focus:tw-ring-iron-700"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
    expect(
      findHits(
        button(
          "tw-form-input tw-ring-1 focus:tw-outline-none focus:tw-ring-inset focus:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("covers the important spelling of the outline removal", () => {
    expect(findHits(button("tw-p-2 focus:!tw-outline-none"))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
    expect(
      findHits(
        button(
          "focus:!tw-outline-none focus-visible:!tw-ring-2 focus-visible:!tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("credits a has-[:focus-visible] wrapper ring for a bare control", () => {
    const wrapped = `const A = () => (
      <span className="focus-within:tw-ring-2 focus-within:tw-ring-primary-400/25 has-[:focus-visible]:tw-ring-primary-400">
        <select className="tw-appearance-none focus:tw-outline-none" />
      </span>
    );`;
    expect(findHits(wrapped)).toEqual([]);
    expect(
      findHits(wrapped.replace("has-[:focus-visible]:tw-ring-primary-400", ""))
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("faint") }),
    ]);
  });

  it("measures a class constant on the elements that wear it", () => {
    const constant = (use: string) => `
      const FIELD = "tw-appearance-none tw-ring-1 focus:tw-outline-none";
      const A = () => ${use};
    `;
    expect(
      findHits(
        constant(
          `<input className={\`\${FIELD} focus:tw-ring-primary-400\`} />`
        )
      )
    ).toEqual([]);
    expect(
      findHits(
        constant(
          `<label className="focus-within:tw-ring-2 focus-within:tw-ring-primary-400"><input className={FIELD} /></label>`
        )
      )
    ).toEqual([]);
    expect(findHits(constant(`<input className={FIELD} />`))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
    expect(findHits(constant(`<div className={FIELD} />`))).toEqual([]);
  });

  it("measures white and other 3-digit theme colours", () => {
    expect(
      findHits(
        button("focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white")
      )
    ).toEqual([]);
  });

  it("skips elements that never take keyboard focus", () => {
    expect(
      findHits(`const A = () => <div className="focus:tw-outline-none" />;`)
    ).toEqual([]);
    expect(
      findHits(
        `const A = () => <button tabIndex={-1} className="focus:tw-outline-none" />;`
      )
    ).toEqual([]);
    expect(
      findHits(
        `const A = () => <div tabIndex={0} className="focus:tw-outline-none" />;`
      )
    ).toHaveLength(1);
  });
});

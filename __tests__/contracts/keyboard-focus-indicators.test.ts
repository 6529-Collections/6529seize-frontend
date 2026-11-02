/**
 * `focus:tw-outline-none` and `focus-visible:tw-outline-none` remove the
 * browser focus ring. Every control that uses them must replace it with its own
 * visible indicator (WCAG 2.2 AA 2.4.7), and that indicator must reach 3:1
 * against the dark page surface (1.4.11).
 *
 * The scan covers all of `app/` and `components/`. It finds each class list
 * that removes the outline, gathers every class reachable from the same JSX
 * attribute or shared class constant (template parts, `clsx` arguments, and
 * same-file constants and helpers, including the elements that wear a constant),
 * and requires a focus or focus-visible ring, outline, shadow or border change.
 * Wrapping `focus-within:` and `has-[:focus-visible]:` rings and the
 * `group-focus-visible:` ring of a `tw-group` control's children count.
 * Plain containers that never take keyboard focus (no tabIndex, or
 * tabIndex={-1}) are skipped. Audited exceptions are pinned by literal hash.
 *
 * A second scan holds Headless UI active options to the same rule: a
 * `data-[focus]:` background tint needs a `data-[focus]:` ring or outline.
 *
 * Detection lives in `./support/keyboardFocusIndicators`.
 */
import {
  type AuditedException,
  type FocusIndicatorHit,
  exceptionFor,
  findHits,
  findOptionHighlightHits,
  literalHash,
  normalize,
  scanHits,
  scanOptionHighlightHits,
} from "./support/keyboardFocusIndicators";

const SCAN_ROOTS = ["app", "components"];

/** Literal-level exceptions; changing the class literal invalidates them. */
const OPTIONS_REASON =
  "Headless UI options container: focus stays on the container (or on the combobox input) while the active option draws its own data-[focus] ring, which the option highlight scan below enforces.";
const SCROLL_TARGET_REASON =
  "Hash-navigation scroll target (tabIndex -1 when it has an id): it receives focus programmatically and is neither a tab stop nor a control.";
const LIGHT_SURFACE_REASON =
  "Input on the white modal panel: the iron-950 ring measures about 18:1 against white, so the dark-surface model reports it incorrectly.";
const CHILD_RING_REASON =
  "Shared compact-action button class: every consumer renders COMPACT_ACTION_CONTENT_CLASS on the inner pill span, which draws the group-focus-visible outline. The scan cannot follow these imported constants across files; the native competition browser pack verifies the visible outline.";
const AUDITED_EXCEPTIONS: readonly AuditedException[] = [
  {
    file: "components/brain/my-stream/tabs/MyStreamWaveCreateActionsMenu.tsx",
    marker: "tw-ring-iron-700/80 focus:tw-outline-none",
    literalHash:
      "249ea0bf0f7dbc20147acacfaa7463e8c01b9f7fbb07bc2f7ce20e32ef0208ba",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/utils/button/compactActionButtonStyles.ts",
    marker: "tw-p-0 focus-visible:tw-outline-none",
    literalHash:
      "3b513201246dad340473ea8e111e20b694405777038994c0e2c68a5a97559fea",
    reason: CHILD_RING_REASON,
  },
  {
    file: "components/common/TabToggleWithOverflow.tsx",
    marker: "tw-shadow-lg tw-ring-1 focus:tw-outline-none",
    literalHash:
      "f4e4cbd54777b1e6872a0eaa61f6c0cfd07b9e59fb478187b3deb41d7db9e450",
    reason: OPTIONS_REASON,
  },
  {
    file: "components/waves/specs/wave-notification-settings/WaveNotificationPreferenceButtons.tsx",
    marker: "tw-ring-white/10 focus:tw-outline-none",
    literalHash:
      "a908df2dc19dfa7d6083f72e8f56f77ce69648e86ed5a5cb93d675cf2e0f429f",
    reason: OPTIONS_REASON,
  },
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
    file: "components/e2ee/conversation/E2eeMessageItem.tsx",
    marker: "tw-ring-iron-700/80 focus:tw-outline-none",
    literalHash:
      "1e441db33583131ce10a4ce24f5de2395ab46d8a8d1d6374e9e08ed489011ac1",
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
  const hits: FocusIndicatorHit[] = scanHits(SCAN_ROOTS);

  it("finds no unaudited outline removal without a 3:1 replacement", () => {
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

  it("holds focus-visible outline removal to the same rule", () => {
    expect(findHits(button("tw-p-2 focus-visible:tw-outline-none"))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
    expect(findHits(button("tw-p-2 focus-visible:!tw-outline-none"))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
    expect(
      findHits(
        button(
          "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("fails an explicit colour that the theme cannot resolve", () => {
    expect(
      findHits(
        button(
          "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red-300"
        )
      )
    ).toEqual([
      expect.objectContaining({ problem: expect.stringContaining("red-300") }),
    ]);
  });

  it("credits the group-focus-visible ring a child draws for a tw-group control", () => {
    const group = `const A = () => (
      <a className="tw-group tw-p-0 focus-visible:tw-outline-none">
        <span className="group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400">x</span>
      </a>
    );`;
    expect(findHits(group)).toEqual([]);
    expect(findHits(group.replace("tw-group ", ""))).toEqual([
      expect.objectContaining({ problem: "no focus indicator" }),
    ]);
  });

  it("credits an outline that a wrapper draws through a has-[…:focus-visible] selector", () => {
    const wrapped = `const A = () => (
      <div className="has-[[data-open]:focus-visible]:tw-outline has-[[data-open]:focus-visible]:tw-outline-2 has-[[data-open]:focus-visible]:tw-outline-white">
        <button data-open className="focus-visible:tw-outline-none" />
      </div>
    );`;
    expect(findHits(wrapped)).toEqual([]);
  });
});

describe("active option highlight", () => {
  const option = (classes: string) =>
    `const A = () => <li className="${classes}" />;`;

  it("flags an active option that only changes its background", () => {
    expect(
      findOptionHighlightHits(
        option("tw-rounded-md tw-px-3 data-[focus]:tw-bg-iron-800")
      )
    ).toEqual([
      expect.objectContaining({
        problem: expect.stringContaining("active option"),
      }),
    ]);
  });

  it("accepts a primary ring or outline on the active state", () => {
    expect(
      findOptionHighlightHits(
        option(
          "data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400"
        )
      )
    ).toEqual([]);
    expect(
      findOptionHighlightHits(
        option(
          "data-[focus]:tw-bg-iron-800 data-[focus]:tw-outline data-[focus]:tw-outline-2 data-[focus]:tw-outline-primary-400"
        )
      )
    ).toEqual([]);
  });

  it("does not count a faint ring or the real-focus ring of another state", () => {
    expect(
      findOptionHighlightHits(
        option(
          "data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-white/20"
        )
      )
    ).toHaveLength(1);
    expect(
      findOptionHighlightHits(
        option(
          "data-[focus]:tw-bg-iron-800 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        )
      )
    ).toHaveLength(1);
  });

  it("leaves class lists without an active-state tint alone", () => {
    expect(
      findOptionHighlightHits(option("tw-px-3 hover:tw-bg-iron-800"))
    ).toEqual([]);
  });

  it("finds no active option in app or components that relies on a tint alone", () => {
    const unaudited = scanOptionHighlightHits(SCAN_ROOTS).map(
      ({ file, problem, literal }) => ({
        file,
        problem,
        literal: normalize(literal),
      })
    );

    expect(unaudited).toEqual([]);
  });
});

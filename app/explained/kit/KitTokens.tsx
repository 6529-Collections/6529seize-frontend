import {
  EX_BUTTON,
  EX_ELEVATION,
  EX_HEX,
  EX_LAYOUT,
  EX_MOTION,
  EX_RADIUS,
  EX_SPACE,
  EX_TEXT,
} from "@/components/explained/tokens";
import { KitSection, Row, Specimen } from "./KitSection";

/** The tokens, as specimens: type, colour roles, spacing, grid, radius, elevation, motion. */
const TYPE: readonly {
  role: keyof typeof EX_TEXT;
  sample: string;
  size: string;
}[] = [
  { role: "display", sample: "Total Days Held", size: "84/88 · phone 44/48" },
  { role: "displayHub", sample: "How 6529 works", size: "80/84 · phone 42/46" },
  {
    role: "opener",
    sample: "Who checks the day.",
    size: "72/76 · phone 40/44",
  },
  { role: "h1", sample: "How TDH is calculated", size: "64/68 · phone 38/43" },
  { role: "h1r", sample: "The daily check", size: "46/52 · phone 32/38" },
  {
    role: "stmt",
    sample: "A copy's TDH is an area.",
    size: "44/50 · phone 29/35",
  },
  { role: "h2", sample: "Is my number right?", size: "32/40 · phone 25/32" },
  { role: "h3", sample: "The rule", size: "21/28" },
  {
    role: "lensQ",
    sample: "When does a copy start to count?",
    size: "24/32 · phone 20/27",
  },
  {
    role: "lede",
    sample: "Every card you hold adds its rate for each whole day held.",
    size: "22/34 · phone 18/28",
  },
  {
    role: "body",
    sample:
      "TDH is not money. You cannot send it or spend it, and voting does not use it up.",
    size: "18/29 · phone 16/26",
  },
  {
    role: "small",
    sample: "Rep and NIC are ratings collectors give each other.",
    size: "15/24",
  },
  { role: "cap", sample: "Real editions from 6529.io.", size: "15/23" },
  { role: "meta", sample: "next result about 00:50 UTC", size: "13/20" },
  { role: "label", sample: "Today on the network", size: "12/16" },
  { role: "numL", sample: "2,082,190,981", size: "40 · phone 30" },
  { role: "mono", sample: "0x43717ba9…79d299ec", size: "14/21 · phone 13/20" },
  {
    role: "candour",
    sample: "A green day is a strong check, not a proof.",
    size: "24/34 · phone 20/29",
  },
];

const ROLES: readonly {
  role: string;
  hex: string;
  token: string;
  text: boolean;
}[] = [
  {
    role: "surface",
    hex: EX_HEX.surface,
    token: "ABOUT_CONTENT_SURFACE",
    text: false,
  },
  { role: "panel", hex: EX_HEX.panel, token: "iron-950", text: false },
  { role: "raised", hex: EX_HEX.raised, token: "iron-900", text: false },
  { role: "line", hex: EX_HEX.line, token: "iron-800", text: false },
  { role: "line 2", hex: EX_HEX.line2, token: "iron-700", text: false },
  { role: "ink-1", hex: EX_HEX.ink1, token: "iron-50", text: true },
  { role: "ink-2", hex: EX_HEX.ink2, token: "iron-300", text: true },
  { role: "ink-3", hex: EX_HEX.ink3, token: "iron-400", text: true },
  {
    role: "ink-4 · never text",
    hex: EX_HEX.ink4,
    token: "iron-600",
    text: false,
  },
  { role: "you", hex: EX_HEX.you, token: "primary-400", text: false },
  { role: "you ink", hex: EX_HEX.youInk, token: "primary-300", text: true },
  { role: "holds", hex: EX_HEX.holds, token: "green", text: true },
  { role: "fails", hex: EX_HEX.fails, token: "error", text: true },
  { role: "CTA", hex: EX_HEX.cta, token: "iron-200", text: false },
];

export default function KitTokens() {
  return (
    <KitSection
      id="tokens"
      title="Tokens"
      lede="Every colour is a 6529.io token; no new colour. Type, spacing, grid, radius, elevation and motion as EXPLAINED.md §5 sets them, phone first."
    >
      <Specimen name="type scale" wide>
        <div className="tw-grid tw-gap-6">
          {TYPE.map((entry) => (
            <div
              key={entry.role}
              className="tw-grid tw-grid-cols-1 tw-gap-1 lg:tw-grid-cols-[192px_minmax(0,1fr)] lg:tw-gap-8"
            >
              <span className="tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-400">
                {entry.role} · {entry.size}
              </span>
              <span
                className={`tw-block tw-min-w-0 tw-break-words ${EX_TEXT[entry.role]}`}
              >
                {entry.sample}
              </span>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen name="colour roles" wide>
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0 md:tw-grid-cols-4 lg:tw-grid-cols-7">
          {ROLES.map((entry) => (
            <li
              key={entry.role}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-2.5"
            >
              <span
                className="tw-block tw-h-10 tw-rounded-md tw-border tw-border-solid tw-border-iron-700"
                style={{ background: entry.hex }}
              />
              <span className="tw-mt-2 tw-block tw-text-[13px] tw-font-semibold tw-text-iron-50">
                {entry.role}
              </span>
              <span className="tw-block tw-font-mono tw-text-xs tw-text-iron-400">
                {entry.token} · {entry.hex}
              </span>
              {entry.text && (
                <span
                  className="tw-mt-1 tw-block tw-text-[13px] tw-font-semibold"
                  style={{ color: entry.hex }}
                >
                  Text
                </span>
              )}
            </li>
          ))}
        </ul>
      </Specimen>
      <Specimen name="spacing" state="4 px base">
        <div className="tw-grid tw-gap-1.5">
          {EX_SPACE.map((step) => (
            <div key={step} className="tw-flex tw-items-center tw-gap-3">
              <span className="tw-w-10 tw-text-right tw-font-mono tw-text-xs tw-text-iron-400">
                {step}
              </span>
              <span
                className="tw-block tw-h-3 tw-rounded-sm tw-bg-primary-400/50"
                style={{ width: step * 2 }}
              />
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen
        name="grid"
        state="ed: label 192 · text 660 · margin 236 · gutters 32"
        wide
      >
        <div className={EX_LAYOUT.ed}>
          <div className="tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-p-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
            Label
          </div>
          <div className="tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-p-3 tw-text-[15px] tw-text-iron-300">
            Text, 660 at most: the reading measure.
          </div>
          <div className="tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-p-3 tw-text-[15px] tw-text-iron-400">
            Margin
          </div>
        </div>
        <div className={`tw-mt-4 ${EX_LAYOUT.stmt}`}>
          <div className="tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-p-3 tw-text-[15px] tw-text-iron-300">
            Statement heading, 5
          </div>
          <div className="tw-rounded-md tw-border tw-border-dashed tw-border-iron-700 tw-p-3 tw-text-[15px] tw-text-iron-300">
            Prose, 6, 64 px apart
          </div>
        </div>
      </Specimen>
      <Specimen name="radius, elevation, buttons">
        <Row>
          {(
            Object.entries(EX_RADIUS) as [keyof typeof EX_RADIUS, string][]
          ).map(([name, cls]) => (
            <span
              key={name}
              className={`tw-inline-grid tw-size-16 tw-place-items-center tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-text-xs tw-text-iron-400 ${cls}`}
            >
              {name}
            </span>
          ))}
          <span
            className={`tw-inline-grid tw-h-16 tw-w-28 tw-place-items-center tw-rounded-xl tw-bg-iron-950 tw-text-xs tw-text-iron-400 ${EX_ELEVATION.menu}`}
          >
            menu
          </span>
          <span
            className={`tw-inline-grid tw-h-16 tw-w-28 tw-place-items-center tw-rounded-md tw-bg-iron-900 tw-text-xs tw-text-iron-400 ${EX_ELEVATION.art}`}
          >
            art
          </span>
        </Row>
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2.5">
          <a className={EX_BUTTON.cta} href="#tokens">
            Explain my TDH
          </a>
          <a className={EX_BUTTON.secondary} href="#tokens">
            How it is calculated
          </a>
          <a className={EX_BUTTON.link} href="#tokens">
            The daily check
          </a>
        </div>
      </Specimen>
      <Specimen name="motion" state="reduced motion: instant">
        <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          Easing {EX_MOTION.ease}; a model&apos;s change {EX_MOTION.modelMs} ms;
          a live number {EX_MOTION.liveMs} ms. No ambient motion; the live pulse
          is a static ring.
        </p>
      </Specimen>
    </KitSection>
  );
}

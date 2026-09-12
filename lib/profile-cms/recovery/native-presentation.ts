import type { CmsBlockV1, CmsPackageV1 } from "../protocol/v1";

const DESIGNS = [
  "personal-v2",
  "artist-v2",
  "collector-v2",
  "meme-v2",
  "organization-v2",
  "fund-v2",
] as const;
type NativeDesign = (typeof DESIGNS)[number];
const VARIANTS = [
  "hero",
  "intro",
  "feature",
  "artwork",
  "gallery",
  "cards",
  "stats",
  "schedule",
  "timeline",
  "people",
  "contact",
  "ledger",
  "note",
  "project",
  "poster",
  "biography",
  "list",
] as const;

export function recoveredNativeDesign(
  cmsPackage: CmsPackageV1
): NativeDesign | null {
  const tokens = cmsPackage.site.theme.tokens;
  if (tokens?.["studio_revision"] !== 1) return null;
  return DESIGNS.find((design) => design === tokens["studio_design"]) ?? null;
}

export function recoveredBlockPresentation(block: CmsBlockV1) {
  const value: unknown = (block as CmsBlockV1 & Record<string, unknown>)[
    "presentation"
  ];
  const presentation =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    role: presentation["role"] === "card" ? "card" : "body",
    group:
      typeof presentation["group"] === "string" ? presentation["group"] : "",
    variant:
      VARIANTS.find((variant) => variant === presentation["variant"]) ?? "body",
    span:
      ["full", "half", "third", "two_thirds"].find(
        (span) => span === presentation["span"]
      ) ?? "full",
  };
}

/** Authored styles only: package strings never become selectors or declarations. */
export const RECOVERED_NATIVE_CSS = `
body.cms-native{box-sizing:border-box;max-width:1320px;padding:0 40px 40px;font:16px/1.75 Arial,sans-serif}
.cms-native *{box-sizing:border-box}.cms-native header{padding:30px 0 23px;border-bottom:1px solid currentColor}
.cms-native .cms-brand{font:500 30px/1.2 Georgia,serif;margin:0 0 18px}.cms-native nav ul{list-style:none;padding:0;gap:10px 24px}
.cms-native nav a{font-size:14px;color:inherit}.cms-native main{border:0;padding-top:38px}.cms-native main>h1{font:400 clamp(34px,5vw,64px)/1.08 Georgia,serif;letter-spacing:-.035em;margin:0 0 35px}
.cms-native .cms-profile{display:inline-block;font-size:12px;color:inherit;min-height:32px}.cms-native p{white-space:pre-line;margin:0 0 18px}
.cms-native h2{font:400 clamp(28px,3.6vw,45px)/1.15 Georgia,serif;letter-spacing:-.025em}.cms-native h3{font:500 21px/1.3 Georgia,serif}
.cms-native .cms-group{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:26px;margin:0 0 32px}
.cms-native .cms-block{min-width:0;margin:0;grid-column:span 12}.cms-native .cms-span-half{grid-column:span 6}.cms-native .cms-span-third{grid-column:span 4}.cms-native .cms-span-two_thirds{grid-column:span 8}
.cms-native .cms-variant-hero h2{font-size:clamp(40px,6vw,80px);max-width:15ch}.cms-native .cms-variant-intro{font-size:19px;line-height:1.75}
.cms-native .cms-variant-note{font-size:14px}.cms-native .cms-variant-poster{padding:28px;background:var(--cms-mat)}
.cms-native .cms-variant-feature img{width:100%;max-height:740px;object-fit:contain}.cms-native .cms-variant-artwork img{max-height:780px;margin:0 auto}
.cms-native figure{margin:0 0 20px}.cms-native figure img{width:100%;background:var(--cms-mat);padding:14px;object-fit:contain}.cms-native figcaption{padding:10px 0;font-size:13px;white-space:pre-line}
.cms-native .gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 24px}.cms-native .cms-gallery-item{min-width:0}.cms-native .cms-gallery-item img{height:310px;max-height:none}.cms-native .cms-gallery-item h3{font:500 16px/1.4 Arial,sans-serif;margin:12px 0 5px}.cms-native .cms-gallery-item p{font-size:13px;margin:0 0 5px}.cms-native .cms-gallery-item small{font-size:12px}
.cms-native .cms-gallery-item figure{margin:0}.cms-native .cms-gallery-item a{color:inherit}.cms-native .cms-pixel-art{image-rendering:pixelated}
.cms-native .cms-variant-stats,.cms-native .cms-variant-schedule,.cms-native .cms-variant-ledger,.cms-native .cms-variant-timeline{border-top:1px solid currentColor;padding-top:20px}
.cms-native dl{margin:18px 0}.cms-native dl>div{display:grid;grid-template-columns:minmax(95px,1fr) 2fr;gap:24px;padding:13px 0;border-top:1px solid color-mix(in srgb,currentColor 25%,transparent)}.cms-native dt{font-size:13px}.cms-native dd{margin:0;white-space:pre-line}
.cms-native .cms-variant-contact{padding:26px;background:var(--cms-mat)}.cms-native .cms-variant-people aside,.cms-native .cms-variant-cards aside{height:100%;border-top:1px solid currentColor;padding-top:20px}
.cms-native[data-design="collector-v2"]{background:#151719;color:#ecece7;--cms-mat:#232526}.cms-native[data-design="collector-v2"] h1,.cms-native[data-design="collector-v2"] h2{font-family:Arial,sans-serif;font-weight:500;letter-spacing:-.05em}
.cms-native[data-design="fund-v2"]{background:#f2f3eb;color:#17392a;--cms-mat:#e3e8dc}.cms-native[data-design="fund-v2"] header{margin:0 -40px;padding:30px 40px;background:#193e2c;color:#f2f3eb}.cms-native[data-design="fund-v2"] .cms-brand{font-size:46px}
.cms-native[data-design="artist-v2"]{background:#eeeae2;color:#27231f;--cms-mat:#e2ddd3}.cms-native[data-design="artist-v2"] .cms-brand{font-size:36px}
.cms-native[data-design="organization-v2"]{background:#f2efe7;color:#252621;--cms-mat:#e3e1d6}.cms-native[data-design="organization-v2"] h1{font-family:Arial,sans-serif;font-weight:600}
.cms-native[data-design="personal-v2"]{background:#edf0ec;color:#23362f;--cms-mat:#dfe5dd}.cms-native[data-design="meme-v2"]{background:#f2eacb;color:#292c21;--cms-mat:#e3d9b1}.cms-native[data-design="meme-v2"] h1{font-family:Arial,sans-serif;font-weight:700}
@media(max-width:760px){body.cms-native{padding:0 22px 30px}.cms-native .cms-span-half,.cms-native .cms-span-third,.cms-native .cms-span-two_thirds{grid-column:span 12}.cms-native .cms-group{gap:20px}.cms-native .gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:25px 16px}.cms-native .cms-gallery-item img{height:245px}.cms-native[data-design="fund-v2"] header{margin:0 -22px;padding:26px 22px}}
@media(max-width:420px){.cms-native .cms-gallery-item img{height:190px;padding:7px}.cms-native .cms-gallery-item h3{font-size:14px}.cms-native dl>div{grid-template-columns:90px 1fr;gap:14px}.cms-native .cms-variant-contact{padding:18px}}
`;

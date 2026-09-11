// Authored sample content, independent of the stable archive URL slugs.
const LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  signature: { about: "About", now: "Current projects" },
  chapters: { beginnings: "Early years", current: "Life today" },
  practice: { "common-index": "Common Index", approach: "Process" },
  "field-notes": { "public-notebook": "Canal route", reading: "Reading shelf" },
  citizen: { contributions: "Guide draft", conversations: "Newcomer links" },
  onchain: { research: "Reading list", principles: "Test notes" },
  atlas: {
    work: "Work",
    art: "Art",
    notes: "Notes",
    connections: "Useful links",
  },
  "memes-collection": { themes: "Selection", notes: "Collecting notes" },
  exhibition: {
    "first-movement": "Quiet Signal",
    "second-movement": "Afterimage & Night Grid",
    catalog: "Catalogue",
  },
  collection: {
    "lines-and-fields": "Lines and grids",
    statement: "Collecting notes",
  },
  cabinet: { "art-shelf": "Art shelf", "reading-shelf": "Reference shelf" },
  "artist-studio": { "quiet-structures": "Series", statement: "About Rae" },
  medium: { "image-study": "Afterimage", "medium-notes": "Process" },
  "process-journal": {
    "a-rule-with-room": "First entry",
    outcome: "References",
  },
  editions: {
    "quiet-signal": "Quiet Signal",
    "edition-notes": "Catalogue notes",
  },
  retrospective: {
    "early-studies": "Object studies",
    "later-structures": "Line studies",
    essay: "Project notes",
  },
  company: {
    services: "Services",
    "common-index": "Common Index",
    people: "Team",
  },
  foundation: { programs: "Programme plans", stewardship: "Documentation" },
  protocol: { "use-cases": "Use cases", resources: "References" },
  "nft-project": { series: "Series", story: "Project story", notes: "Credits" },
  "investment-fund": {
    approach: "Process",
    portfolio: "Project coverage",
    research: "Research",
  },
  "collecting-dao": {
    thesis: "Criteria",
    selection: "Selection",
    collective: "Roles",
  },
  "institutional-collection": {
    highlights: "Highlights",
    exhibition: "Exhibition",
    stewardship: "Preservation",
  },
  "meme-seizer": { interests: "Interests", "reading-room": "Reading list" },
  "meme-sovereign": { principles: "Choosing tools", essays: "Backup notes" },
  "meme-gm-journal": { archive: "Earlier entries", about: "About" },
  "meme-exit-signal": { selection: "Selection", "signal-log": "Notes" },
  "meme-good-morning": { favorites: "Favorites", mornings: "Morning posts" },
  "meme-quiet-growth": { library: "Library", marginalia: "Library notes" },
  "meme-after-hours": { works: "Studies", notebook: "Notebook" },
  "meme-open-horizon": { expedition: "Ridge project", process: "Field notes" },
  "meme-human-interface": { process: "Process", works: "References" },
  "meme-the-witness": {
    series: "Market project",
    "field-book": "Field notebook",
  },
  "meme-production": { manifesto: "How we work", projects: "Projects" },
  "meme-the-institution": {
    mandate: "Mandate",
    collection: "Selection",
    research: "Research",
  },
  "meme-squadron": { crew: "Team", "field-notes": "Updates" },
  "meme-the-workshop": { practice: "Services", projects: "Projects" },
  "meme-proof": { thesis: "Policy", evidence: "Research", members: "Members" },
  "meme-common-ground": { programme: "Programme", essays: "Articles" },
};

export function getCmsStudioTemplateNavigationLabel(
  templateId: string,
  slug: string
): string {
  if (slug === "studio") return "Home";
  const label = LABELS[templateId]?.[slug];
  if (label) return label;
  const words = slug.replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

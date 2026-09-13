import source from "./an-alteration-source.json";

export const AN_ALTERATION_TEXT = source.text;
export const AN_ALTERATION_IMAGE =
  "/artwork-documentation/examples/an-alteration.png";
export const AN_ALTERATION_EXAMPLE_PATH =
  "/artwork-documentation/example/an-alteration";

const lines = AN_ALTERATION_TEXT.split(/\r?\n/);
export const AN_ALTERATION_HEADER = lines.slice(0, 3);

function between(start: string, end: string): string {
  const from = lines.indexOf(start);
  const to = lines.indexOf(end, from + 1);
  return from < 0 || to < 0
    ? ""
    : lines
        .slice(from + 1, to)
        .join("\n")
        .trim();
}

function lineStarting(prefix: string): string {
  return (
    lines
      .find((line) => line.startsWith(prefix))
      ?.slice(prefix.length)
      .trim() ?? ""
  );
}

const HEADING_HOW_THE_WORK_WAS_MADE = "How the work was made";
const HEADING_MATERIAL_CHANGES = "Material changes";
const HEADING_REFERENCE_PRESENTATION = "Reference presentation";
const HEADING_PRINTER_AND_INK = "Printer and ink";
const HEADING_SCREEN_DISPLAY = "Screen display";
const HEADING_WHAT_NEEDS_TO_SURVIVE = "What needs to survive";
const HEADING_ACCEPTABLE_FUTURE_CHANGES = "Acceptable future changes";
const HEADING_CHANGES_TO_AVOID = "Changes to avoid";
const HEADING_EXISTING_EDITION_STATEMENT = "Existing edition statement";
const HEADING_VISUAL_DESCRIPTION = "Visual description";
const HEADING_SERIES_TITLE = "Series title";
const HEADING_RELATED_WORKS = "Related works";
const HEADING_FINAL_ARTWORK_FILE = "Final artwork file";
const HEADING_PIXEL_DIMENSIONS = "Pixel dimensions";
const HEADING_PRESERVATION_MASTER = "Preservation master";
const HEADING_ = "________________________________________";
const HEADING_ARTIST_STATEMENT = "Artist statement";
const HEADING_CIRCUMSTANCES_OF_MAKING = "Circumstances of making";
const HEADING_CONNECTION_TO_KEYS_AND_GATES = "Connection to Keys and Gates";
const HEADING_WHAT_VIEWERS_MIGHT_MISUNDERSTAND =
  "What viewers might misunderstand";
const HEADING_PUBLICATION_AND_EXHIBITION_HISTORY =
  "Publication and exhibition history";
const HEADING_PREVIOUS_MINT_HISTORY = "Previous mint history";
const HEADING_EDITING_TOOLS = "Editing tools";
const HEADING_COMPONENT_IMAGES_AND_SOURCES = "Component images and sources";
const HEADING_CONSTRUCTION_AND_STAGING = "Construction and staging";
const HEADING_CONTRIBUTORS = "Contributors";
const HEADING_ARTWORK_LICENSE = "Artwork license";
const HEADING_THIRD_PARTY_MATERIAL = "Third-party material";
const HEADING_PUBLIC_ATTRIBUTION_AND_CONTEXT_NOTES =
  "Public attribution and context notes";
const HEADING_COLOUR_AND_TONAL_BALANCE = "Colour and tonal balance";
const HEADING_RELATED_PHYSICAL_MATERIALS = "Related physical materials";

const ORIENTATION_HEADING = "Orientation, frame and cropping";
const excerpts: Readonly<Record<string, string>> = {
  "process.photography.capture_process": lineStarting("Capture method:"),
  "process.photography.editing": between(
    HEADING_HOW_THE_WORK_WAS_MADE,
    HEADING_MATERIAL_CHANGES
  ),
  "process.photography.print_instructions": between(
    HEADING_REFERENCE_PRESENTATION,
    HEADING_PRINTER_AND_INK
  ),
  "process.photography.crop_and_color_intent": between(
    ORIENTATION_HEADING,
    HEADING_SCREEN_DISPLAY
  ),
  "preservation.intent.account": between(
    HEADING_WHAT_NEEDS_TO_SURVIVE,
    ORIENTATION_HEADING
  ),
  "preservation.intent.change_policy": between(
    HEADING_ACCEPTABLE_FUTURE_CHANGES,
    HEADING_CHANGES_TO_AVOID
  ),
  "artwork.title": lineStarting("Title:"),
  "artwork.title_language": lineStarting("Title language:"),
  "artwork.capture_date": lineStarting("Capture date:"),
  "artwork.completion_date": lineStarting("Completion date:"),
  "artwork.location": lineStarting("Location:"),
  "artwork.places": lineStarting("Location:"),
  "artwork.medium": lineStarting("Medium:"),
  "artwork.edition_statement": between(
    HEADING_EXISTING_EDITION_STATEMENT,
    HEADING_VISUAL_DESCRIPTION
  ),
  "artwork.visual_description": between(
    HEADING_VISUAL_DESCRIPTION,
    HEADING_SERIES_TITLE
  ),
  "artwork.series_title": between(HEADING_SERIES_TITLE, HEADING_RELATED_WORKS),
  "artwork.work_relationships": between(
    HEADING_RELATED_WORKS,
    HEADING_FINAL_ARTWORK_FILE
  ),
  "artwork.relationships": between(
    HEADING_RELATED_WORKS,
    HEADING_FINAL_ARTWORK_FILE
  ),
  "artwork.canonical_asset_id": between(
    HEADING_FINAL_ARTWORK_FILE,
    HEADING_PIXEL_DIMENSIONS
  ),
  "artwork.declared_dimensions": between(
    HEADING_PIXEL_DIMENSIONS,
    HEADING_PRESERVATION_MASTER
  ),
  "artwork.measurements": between(HEADING_REFERENCE_PRESENTATION, "Paper"),
  "artwork.physical_objects": between(
    HEADING_EXISTING_EDITION_STATEMENT,
    HEADING_VISUAL_DESCRIPTION
  ),
  "files.master_availability": between(HEADING_PRESERVATION_MASTER, HEADING_),
  "files.source_availability": between(HEADING_PRESERVATION_MASTER, HEADING_),
  "context.caption": between("Caption", HEADING_ARTIST_STATEMENT),
  "context.artist_statement": between(
    HEADING_ARTIST_STATEMENT,
    HEADING_CIRCUMSTANCES_OF_MAKING
  ),
  "context.making_context": between(
    HEADING_CIRCUMSTANCES_OF_MAKING,
    HEADING_CONNECTION_TO_KEYS_AND_GATES
  ),
  "context.theme_connection": between(
    HEADING_CONNECTION_TO_KEYS_AND_GATES,
    HEADING_WHAT_VIEWERS_MIGHT_MISUNDERSTAND
  ),
  "context.misunderstandings": between(
    HEADING_WHAT_VIEWERS_MIGHT_MISUNDERSTAND,
    HEADING_PUBLICATION_AND_EXHIBITION_HISTORY
  ),
  "context.history": between(
    HEADING_PUBLICATION_AND_EXHIBITION_HISTORY,
    HEADING_PREVIOUS_MINT_HISTORY
  ),
  "context.prior_mint_status": between(
    HEADING_PREVIOUS_MINT_HISTORY,
    "References"
  ),
  "context.references": between("References", HEADING_),
  "process.capture_method": lineStarting("Capture method:"),
  "process.camera": lineStarting("Camera:"),
  "process.lens": lineStarting("Lens:"),
  "process.exposure_note": between("Exposure notes", "Techniques"),
  "process.techniques": between("Techniques", HEADING_EDITING_TOOLS),
  "process.editing_tools": between(
    HEADING_EDITING_TOOLS,
    HEADING_HOW_THE_WORK_WAS_MADE
  ),
  "process.process_description": between(
    HEADING_HOW_THE_WORK_WAS_MADE,
    HEADING_MATERIAL_CHANGES
  ),
  "process.material_changes": between(HEADING_MATERIAL_CHANGES, "AI use"),
  "process.ai_use": between("AI use", HEADING_COMPONENT_IMAGES_AND_SOURCES),
  "process.ingredients": between(
    HEADING_COMPONENT_IMAGES_AND_SOURCES,
    HEADING_CONSTRUCTION_AND_STAGING
  ),
  "process.construction_note": between(
    HEADING_CONSTRUCTION_AND_STAGING,
    HEADING_
  ),
  "identity.display_name": lineStarting("Artist name:"),
  "identity.preferred_credit": lineStarting("Preferred credit:"),
  "identity.biography": between("About the artist", "Artist links"),
  "identity.agents": between(HEADING_CONTRIBUTORS, HEADING_),
  "process.contributors": between(HEADING_CONTRIBUTORS, HEADING_),
  "rights.rights_basis": between(
    "Authorship and rights basis",
    HEADING_ARTWORK_LICENSE
  ),
  "rights.intended_license": between(
    HEADING_ARTWORK_LICENSE,
    HEADING_THIRD_PARTY_MATERIAL
  ),
  "rights.third_party_material": between(
    HEADING_THIRD_PARTY_MATERIAL,
    HEADING_PUBLIC_ATTRIBUTION_AND_CONTEXT_NOTES
  ),
  "rights.publication_notes": between(
    HEADING_PUBLIC_ATTRIBUTION_AND_CONTEXT_NOTES,
    HEADING_
  ),
  "preservation.significant_properties": between(
    HEADING_WHAT_NEEDS_TO_SURVIVE,
    ORIENTATION_HEADING
  ),
  "preservation.display_orientation_crop": between(
    ORIENTATION_HEADING,
    HEADING_COLOUR_AND_TONAL_BALANCE
  ),
  "preservation.color_and_tone": between(
    HEADING_COLOUR_AND_TONAL_BALANCE,
    HEADING_SCREEN_DISPLAY
  ),
  "preservation.screen_preferences": between(
    HEADING_SCREEN_DISPLAY,
    "Printing preferences and production instructions"
  ),
  "preservation.print_preferences": between(
    HEADING_REFERENCE_PRESENTATION,
    HEADING_PRINTER_AND_INK
  ),
  "preservation.acceptable_changes": between(
    HEADING_ACCEPTABLE_FUTURE_CHANGES,
    HEADING_CHANGES_TO_AVOID
  ),
  "preservation.avoid_changes": between(
    HEADING_CHANGES_TO_AVOID,
    HEADING_RELATED_PHYSICAL_MATERIALS
  ),
  "preservation.physical_materials": between(
    HEADING_RELATED_PHYSICAL_MATERIALS,
    HEADING_
  ),
  "interview.sessions": between("Interview supporting fields", HEADING_),
};

export function anAlterationExcerpt(
  moduleId: string,
  fieldId: string
): string | undefined {
  const excerpt = excerpts[`${moduleId}.${fieldId}`];
  return excerpt && excerpt.length > 0 ? excerpt : undefined;
}

const sectionMarkers = lines.flatMap((line, index) =>
  /^\d+\. /.test(line) ? [{ line, index }] : []
);

export const AN_ALTERATION_SUBHEADINGS: ReadonlySet<string> = new Set([
  HEADING_EXISTING_EDITION_STATEMENT,
  HEADING_VISUAL_DESCRIPTION,
  HEADING_SERIES_TITLE,
  HEADING_RELATED_WORKS,
  HEADING_FINAL_ARTWORK_FILE,
  HEADING_PIXEL_DIMENSIONS,
  HEADING_PRESERVATION_MASTER,
  "Caption",
  HEADING_ARTIST_STATEMENT,
  HEADING_CIRCUMSTANCES_OF_MAKING,
  HEADING_CONNECTION_TO_KEYS_AND_GATES,
  HEADING_WHAT_VIEWERS_MIGHT_MISUNDERSTAND,
  HEADING_PUBLICATION_AND_EXHIBITION_HISTORY,
  HEADING_PREVIOUS_MINT_HISTORY,
  "References",
  "Exposure notes",
  "Techniques",
  HEADING_EDITING_TOOLS,
  HEADING_HOW_THE_WORK_WAS_MADE,
  HEADING_MATERIAL_CHANGES,
  "AI use",
  HEADING_COMPONENT_IMAGES_AND_SOURCES,
  HEADING_CONSTRUCTION_AND_STAGING,
  "About the artist",
  "Artist links",
  HEADING_CONTRIBUTORS,
  "Authorship and rights basis",
  HEADING_ARTWORK_LICENSE,
  HEADING_THIRD_PARTY_MATERIAL,
  HEADING_PUBLIC_ATTRIBUTION_AND_CONTEXT_NOTES,
  HEADING_WHAT_NEEDS_TO_SURVIVE,
  "Orientation, frame and cropping",
  HEADING_COLOUR_AND_TONAL_BALANCE,
  HEADING_SCREEN_DISPLAY,
  "Printing preferences and production instructions",
  HEADING_REFERENCE_PRESENTATION,
  "Paper",
  HEADING_PRINTER_AND_INK,
  "Files and resolution",
  "Colour management",
  "Proofing approach",
  "Drying and handling",
  "Mounting and frame",
  "Exhibition lighting and placement",
  "Identification and retained print materials",
  HEADING_ACCEPTABLE_FUTURE_CHANGES,
  HEADING_CHANGES_TO_AVOID,
  HEADING_RELATED_PHYSICAL_MATERIALS,
  "Returning to the stair",
  "Making the picture",
  "Looking at the alteration",
  "The title and the series",
  "From file to print",
  "What happens afterwards",
  "Interview supporting fields",
]);

export const AN_ALTERATION_SECTIONS = sectionMarkers.map((section, index) => ({
  id: `example-chapter-${index + 1}`,
  title: section.line,
  paragraphs: lines
    .slice(section.index + 1, sectionMarkers[index + 1]?.index ?? lines.length)
    .filter((line) => line.trim().length > 0 && !/^_+$/.test(line.trim())),
}));

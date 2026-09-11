import {
  ART,
  ART_CAPTIONS,
  SOURCE_LINKS,
  card,
  defineTemplate,
  externalLink,
  gallery,
  heading,
  image,
  kicker,
  page,
  pageLink,
  quote,
  style,
  text,
} from "./template-recipes";
import { memeCredit, memeImage } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const ART_TEMPLATES: readonly CmsStudioTemplate[] = [
  defineTemplate({
    id: "memes-collection",
    name: "The Memes Collection",
    siteTitle: "Meme Notes",
    family: "collector",
    description:
      "A collector's reading of 6529 art, organized around ideas and recurring themes.",
    presentation: style("gallery", "night", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Messages worth returning to.",
        "A collector's notebook about images, ideas, and the conversations they make possible.",
        memeImage(8, "half"),
        heading("A way into the collection"),
        text(
          "I begin with the image, then read its title and context, then return to the image. Each pass changes what becomes visible."
        ),
        pageLink("Read the collecting notes", "notes"),
        pageLink("Explore the themes", "themes"),
        memeCredit(8),
        externalLink("Explore The Memes", SOURCE_LINKS.memes)
      ),
      page(
        "themes",
        "Images that carry an idea.",
        "A demonstration selection of credited CC0 works, without a claim of token ownership.",
        heading("Freedom to choose"),
        memeImage(4, "two_thirds"),
        text(
          "How does an image make an idea recognizable without closing down its possible meanings?",
          "third"
        ),
        memeCredit(4),
        heading("A shared visual language"),
        memeImage(37, "half"),
        memeImage(2, "half"),
        memeCredit(37),
        memeCredit(2),
        pageLink("Read why sequence matters", "notes")
      ),
      page(
        "notes",
        "Collecting as a form of reading.",
        "How images become a shared vocabulary, and why context stays with the work.",
        heading("A selection is an argument"),
        text(
          "Placing works together suggests a relationship. The interesting part is often where that relationship becomes unstable: a shared color, a different rhythm, a title that changes the reading."
        ),
        quote(
          "A collection can be a conversation rather than a checklist.",
          "From the collecting notebook"
        ),
        heading("Keeping the record clear"),
        text(
          "A personal response belongs beside accurate attribution. Ownership, edition, and capture dates should come from selected sources, not from the appearance of an image on a page."
        ),
        externalLink("Read about 6529", SOURCE_LINKS.about)
      ),
    ],
  }),
  defineTemplate({
    id: "exhibition",
    name: "Exhibition",
    siteTitle: "After the Signal",
    family: "artist",
    description:
      "A finite exhibition with an opening essay, an ordered art sequence, and a readable catalog.",
    presentation: style("gallery", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "After the signal.",
        "An example exhibition in three movements: a line becomes a field, a field leaves an impression, and an impression becomes a rhythm.",
        kicker("A digital exhibition · Three example works"),
        image(ART.signal, "01 / Quiet Signal — original example artwork."),
        text(
          "The sequence asks a simple question: what remains after the first impression has passed? Move through the works slowly, or open the catalog for a concise view of the whole exhibition."
        ),
        pageLink("Begin the sequence", "first-movement"),
        pageLink("Open the catalog", "catalog")
      ),
      page(
        "first-movement",
        "01 — A line becomes a field.",
        "Repetition gives the eye something to follow. A small interruption gives it a reason to stop.",
        image(ART.signal, ART_CAPTIONS.signal),
        text(
          "The first movement introduces a continuous gesture and the space around it. Look at the edges before returning to the center."
        ),
        pageLink("Next: an impression remains", "second-movement"),
        pageLink("Exhibition introduction", "studio")
      ),
      page(
        "second-movement",
        "02 — An impression remains.",
        "The second movement shifts attention from the signal itself to its afterimage.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        text(
          "Here, the pause becomes part of the composition. What seems quiet on first viewing may carry the memory of a stronger mark.",
          "third"
        ),
        image(ART.grid, "03 / Night Grid — original example artwork."),
        heading("03 — A rhythm returns"),
        text(
          "The final image gathers separate marks into a new rhythm. It closes the sequence without resolving every difference."
        ),
        pageLink("View all three works", "catalog")
      ),
      page(
        "catalog",
        "An exhibition in three works.",
        "A conventional catalog accompanies the sequence so the exhibition can be read, revisited, and shared without an immersive viewer.",
        gallery(
          "The sequence",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("Exhibition notes"),
        text(
          "Quiet Signal, Afterimage, and Night Grid are original example artworks generated for this template library. This demonstration has no claimed venue, sale, artist affiliation, or NFT ownership."
        ),
        pageLink("Return to the opening", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "collection",
    name: "Collection",
    siteTitle: "Rowan Collection",
    family: "collector",
    description:
      "Collection highlights, focused catalog pages, and a statement of collecting intent.",
    presentation: style("gallery", "stone", "sans", "compact"),
    pages: [
      page(
        "studio",
        "The Rowan collection.",
        "A fictional collection exploring systems, repetition, and the small gestures that unsettle them.",
        gallery("Selected example works", [
          ART.signal,
          ART.grid,
          ART.afterimage,
        ]),
        heading("Two paths through the collection"),
        card(
          "Lines and fields",
          "A focused selection about continuity, interruption, and movement."
        ),
        card(
          "The collecting notebook",
          "The questions behind the selection, recorded in plain language."
        ),
        pageLink("Explore lines and fields", "lines-and-fields"),
        pageLink("Read the collecting statement", "statement")
      ),
      page(
        "lines-and-fields",
        "Lines and fields.",
        "An example catalog group with deliberate sequence and room for each work.",
        image(ART.signal, "Quiet Signal — example work, no ownership claim."),
        heading("A continuous gesture"),
        text(
          "The image suggests a system that remains open to variation. Its interest lies as much in the space between marks as in the marks themselves."
        ),
        image(ART.grid, "Night Grid — example work, no ownership claim."),
        pageLink("Read the collecting statement", "statement")
      ),
      page(
        "statement",
        "A collection of questions.",
        "The fictional Rowan collection begins with attention rather than completion.",
        heading("What connects the works"),
        text(
          "A recurring interest in structure gives the collection a center. Contradictory works keep it from becoming an illustration of one fixed idea."
        ),
        heading("How the record is kept"),
        text(
          "Each actual catalog entry would distinguish artist attribution, source, relationship to the collection, and date of observation. A work can be studied or displayed without being owned."
        ),
        quote(
          "The best addition changes the works already here.",
          "Example collecting principle"
        ),
        pageLink("Return to highlights", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "cabinet",
    name: "Cabinet",
    siteTitle: "The Cabinet",
    family: "collector",
    description:
      "A personal cabinet of art, reading, objects, and links, each with a reason to be there.",
    presentation: style("signature", "stone", "serif", "balanced"),
    pages: [
      page(
        "studio",
        "Things worth keeping.",
        "A cabinet of images, ideas, and useful references. The connections are personal; the doors are open.",
        image(
          ART.afterimage,
          "An image for the art shelf — original example artwork.",
          "two_thirds"
        ),
        card(
          "A place for the unexpected",
          "A cabinet becomes interesting when something refuses to fit its categories.",
          "third"
        ),
        heading("Open a shelf"),
        pageLink("The art shelf", "art-shelf"),
        pageLink("The reading shelf", "reading-shelf"),
        quote(
          "Keep the thing, and keep a note about why it matters.",
          "Cabinet rule"
        )
      ),
      page(
        "art-shelf",
        "A shelf for looking.",
        "Three images arranged as a conversation about rhythm and pause.",
        image(ART.signal, ART_CAPTIONS.signal, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "The first image unfolds; the second gathers. Their difference makes each one easier to see."
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("Visit the reading shelf", "reading-shelf")
      ),
      page(
        "reading-shelf",
        "Useful things to return to.",
        "A short shelf of public sources, with an annotation instead of a star rating.",
        heading("The permission to share"),
        text(
          "Creative Commons explains a vocabulary for sharing work while making the conditions clear."
        ),
        externalLink("Creative Commons licenses", SOURCE_LINKS.licenses),
        heading("An open encyclopedia"),
        text(
          "Wikipedia is also a useful model of a record that can be revised, discussed, and traced back to sources."
        ),
        externalLink("Visit Wikipedia", SOURCE_LINKS.wikipedia),
        pageLink("Return to the cabinet", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "artist-studio",
    name: "Artist Studio",
    siteTitle: "Common Shapes",
    family: "artist",
    description:
      "An artist's home with selected works, a complete series, and a statement of practice.",
    presentation: style("gallery", "paper", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Common Shapes.",
        "A fictional visual practice working with repetition, material memory, and the point where a system becomes a gesture.",
        image(ART.signal, ART_CAPTIONS.signal),
        kicker("Selected series / Quiet structures"),
        text(
          "The work begins with a rule, then follows the places where that rule bends. An image may look settled while its parts remain in motion."
        ),
        pageLink("View Quiet structures", "quiet-structures"),
        pageLink("Read the artist statement", "statement")
      ),
      page(
        "quiet-structures",
        "Quiet structures.",
        "An example body of work considered as a sequence rather than a set of isolated images.",
        gallery(
          "Three studies",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("A working vocabulary"),
        text(
          "Line, interval, repetition, and interruption form a deliberately small vocabulary. Each study tests how much variation that vocabulary can hold."
        ),
        pageLink("Notes on the practice", "statement")
      ),
      page(
        "statement",
        "The rule and the gesture.",
        "An example artist statement for the fictional Common Shapes practice.",
        text(
          "I begin with repeated actions because they make small differences visible. The work follows what happens when a measured system encounters a less predictable hand.\n\nThe result is not a diagram of control. It is a record of negotiation between an intention and the marks that survive it."
        ),
        heading("About this example"),
        text(
          "Common Shapes is a fictional practice. The displayed works are original demonstration assets made for the 6529 template library; they are not attributed to an existing artist."
        ),
        heading("A place for the record"),
        text(
          "An actual studio can add a biography, exhibition history, CV, and contact destinations as those materials are supplied. This example does not invent credentials or exhibition venues."
        ),
        pageLink("Return to selected work", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "medium",
    name: "Medium",
    siteTitle: "Surface Studies",
    family: "artist",
    description:
      "A work-led portfolio with careful scale, alternate views, and context for the chosen medium.",
    presentation: style("gallery", "night", "sans", "airy"),
    pages: [
      page(
        "studio",
        "The surface, the interval.",
        "A fictional portfolio of digital image studies, presented at different scales without forcing them into one shape.",
        image(ART.afterimage, "Afterimage — original example digital artwork."),
        heading("Read the image at two speeds"),
        text(
          "A broad view establishes the composition. A focused study lets the eye return to edges, overlaps, and intervals."
        ),
        pageLink("Study the first work", "image-study"),
        pageLink("Read the medium notes", "medium-notes")
      ),
      page(
        "image-study",
        "Image study 01.",
        "A page for the complete work and the observations that accompany it.",
        image(
          ART.afterimage,
          "Complete example work; the image is shown without an imposed crop."
        ),
        text(
          "The broad shape reads quickly. The more interesting movement appears where neighboring forms nearly meet. A detail view can help with looking, but should always lead back to the complete work."
        ),
        image(
          ART.signal,
          "A companion image study — original example artwork.",
          "half"
        ),
        image(
          ART.grid,
          "A companion image study — original example artwork.",
          "half"
        ),
        pageLink("Read the medium notes", "medium-notes")
      ),
      page(
        "medium-notes",
        "Let the medium set the terms.",
        "A concise example note on presenting digital images with care.",
        heading("Scale and context"),
        text(
          "The display image describes one representation of a work. Physical dimensions, print processes, playback duration, and installation requirements belong in the record when they actually apply."
        ),
        heading("Multiple views"),
        text(
          "A second view should answer a different question. Use it to explain surface, scale, or installation rather than repeating the same image without context."
        ),
        quote(
          "Presentation should make the work easier to encounter.",
          "Example studio note"
        ),
        pageLink("Return to the portfolio", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "process-journal",
    name: "Process Journal",
    siteTitle: "Studio Notebook",
    family: "artist",
    description:
      "Studio experiments, observations, and finished outcomes connected through a reading sequence.",
    presentation: style("journal", "stone", "mono", "balanced"),
    pages: [
      page(
        "studio",
        "Work, before it settles.",
        "A fictional process journal about testing a small vocabulary of marks and noticing what changes.",
        kicker("Notebook entry 01"),
        heading("A rule with room in it"),
        text(
          "The first experiment uses one repeated gesture. The useful discoveries arrive when the gesture stops behaving exactly as expected."
        ),
        pageLink("Open the experiment", "a-rule-with-room"),
        kicker("Notebook entry 02"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "A later study changes the spacing rather than the mark. The entire image begins to behave differently.",
          "half"
        ),
        pageLink("See the outcome", "outcome")
      ),
      page(
        "a-rule-with-room",
        "A rule with room in it.",
        "Example process entry: repeated actions, observed differences, and a decision about what to keep.",
        heading("Starting condition"),
        text(
          "Repeat a line, then interrupt the sequence only once. Compare an interruption at the edge with one near the center."
        ),
        image(ART.signal, "Example image for the process note."),
        heading("Observation"),
        text(
          "The interruption changes how the surrounding marks are read. What looked uniform starts to reveal small differences."
        ),
        heading("Next test"),
        text(
          "Keep the marks and change the interval. Treat the new image as a separate experiment, not an improvement by default."
        ),
        pageLink("Follow the work to its outcome", "outcome")
      ),
      page(
        "outcome",
        "What the experiment leaves behind.",
        "A finished selection linked to the questions that produced it.",
        gallery("An example sequence", [ART.signal, ART.grid, ART.afterimage]),
        text(
          "The sequence preserves three different answers rather than choosing one winner. Looking at them together makes the decisions behind each image more visible."
        ),
        quote(
          "The process is useful when it helps someone see the work differently.",
          "Example notebook conclusion"
        ),
        pageLink("Return to the first experiment", "a-rule-with-room")
      ),
    ],
  }),
  defineTemplate({
    id: "editions",
    name: "Editions",
    siteTitle: "Common Shapes Editions",
    family: "artist",
    description:
      "Works and edition context, with clear provenance and only genuine external destinations.",
    presentation: style("gallery", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "A work, and its forms.",
        "An example edition catalog explaining the relationship between an image, its presentation, and its record.",
        image(
          ART.signal,
          "Quiet Signal — original example artwork; no edition is offered for sale."
        ),
        heading("Selected work"),
        text(
          "This demonstration shows how a work can have a dedicated record before any sale or mint destination is configured."
        ),
        pageLink("Open the work record", "quiet-signal"),
        pageLink("Read the edition notes", "edition-notes")
      ),
      page(
        "quiet-signal",
        "Quiet Signal.",
        "A complete example artwork record, separate from any marketplace listing or financial claim.",
        image(
          ART.signal,
          "Original example artwork generated for the 6529 template library."
        ),
        heading("Record"),
        card("Medium", "Digital example artwork."),
        card(
          "Edition status",
          "Demonstration only. No edition size, price, availability, or token contract is asserted."
        ),
        heading("About the image"),
        text(
          "A continuous form moves through a measured field. A brief change of color gives the eye a point of orientation."
        ),
        pageLink("How edition records are described", "edition-notes")
      ),
      page(
        "edition-notes",
        "Be precise about the edition.",
        "An edition page should make the actual relationship between work, artist, token, and destination understandable.",
        heading("A record before an action"),
        text(
          "Add supplied edition details and source links to the work record. If an authentic external destination is absent, omit the purchase action rather than substituting a generic marketplace."
        ),
        heading("Rights and attribution"),
        text(
          "Describe display permissions separately from ownership. An NFT or a downloaded file does not automatically grant copyright or reproduction rights."
        ),
        externalLink(
          "Learn about Creative Commons licenses",
          SOURCE_LINKS.licenses
        ),
        pageLink("Return to the work", "quiet-signal")
      ),
    ],
  }),
  defineTemplate({
    id: "retrospective",
    name: "Retrospective",
    siteTitle: "Common Shapes Archive",
    family: "artist",
    description:
      "A body of work organized into periods, series, and contextual essays.",
    presentation: style("editorial", "paper", "serif", "compact"),
    pages: [
      page(
        "studio",
        "A vocabulary, over time.",
        "A fictional retrospective organized by creative periods rather than invented dates or exhibition credentials.",
        heading("The early studies"),
        text("A period of isolated gestures and open space."),
        pageLink("View the early studies", "early-studies"),
        heading("The later structures"),
        text(
          "A shift toward repetition, accumulated marks, and denser fields."
        ),
        pageLink("View the later structures", "later-structures"),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("Read the retrospective essay", "essay")
      ),
      page(
        "early-studies",
        "An isolated gesture.",
        "The first period in this fictional archive gives each mark enough space to be seen on its own.",
        image(ART.afterimage, "Early study — original example artwork."),
        text(
          "The apparent simplicity creates a demanding kind of attention. Without a dense field to guide the eye, the position of each form becomes consequential."
        ),
        pageLink("Continue to later structures", "later-structures"),
        pageLink("Read the essay", "essay")
      ),
      page(
        "later-structures",
        "An accumulated rhythm.",
        "The later period returns to earlier gestures and places them in conversation.",
        image(ART.signal, "Later study — original example artwork.", "half"),
        image(ART.grid, "Later study — original example artwork.", "half"),
        text(
          "Repetition changes the unit of attention. The individual mark remains visible, but the relationships between marks become equally important."
        ),
        pageLink("Read the retrospective essay", "essay")
      ),
      page(
        "essay",
        "Change without a clean break.",
        "An example essay connecting the periods of a fictional body of work.",
        text(
          "A retrospective can make development look more orderly than it felt. The useful task is to preserve both the continuities and the unresolved questions.\n\nHere, an interest in intervals connects an open early image with a denser later one. The works do not need to look alike to share a concern."
        ),
        heading("Reading the archive"),
        text(
          "Periods are editorial groupings. Actual creation dates, exhibition history, and ownership should be recorded only when supplied, with undated work left honestly undated."
        ),
        pageLink("Return to the overview", "studio")
      ),
    ],
  }),
];

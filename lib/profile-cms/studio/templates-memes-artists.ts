import {
  ART,
  ART_CAPTIONS,
  card,
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
import { memeCredit, memeImage, memeTemplate } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const MEME_ARTIST_TEMPLATES: readonly CmsStudioTemplate[] = [
  memeTemplate(5, {
    id: "meme-after-hours",
    name: "After Hours",
    siteTitle: "After Hours Studio",
    family: "artist",
    description:
      "An energetic studio with a large visual reference, a work sequence, and short notes from the desk.",
    presentation: style("gallery", "night", "sans", "compact"),
    accent: "#ff8b70",
    pages: [
      page(
        "studio",
        "Still making, after hours.",
        "An example studio for experiments in color, repetition, and the feeling an image leaves behind.",
        kicker("Work / Play / Repeat"),
        memeImage(5, "two_thirds"),
        text(
          "The studio starts with a mark and follows the energy. Some days it becomes a finished work; on others, a page of studies is the whole point.",
          "third"
        ),
        pageLink("Selected experiments", "works"),
        pageLink("From the desk", "notebook"),
        memeCredit(5)
      ),
      page(
        "works",
        "Three experiments, one restless line.",
        "Original example assets arranged as a small studio portfolio.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        image(ART.signal, ART_CAPTIONS.signal),
        card(
          "Sequence note",
          "Warm reflection, compressed rhythm, then an open line. The order moves from intensity toward a longer breath."
        ),
        pageLink("How the sequence developed", "notebook")
      ),
      page(
        "notebook",
        "Keep the first attempt.",
        "A studio note about the useful part of a mistake.",
        kicker("Study 014 / A line that went elsewhere"),
        text(
          "I wanted a clean edge and found an interruption. The interruption changed the pace of the whole image, so I kept it and began another study around it."
        ),
        quote(
          "A study can succeed by asking a better question.",
          "Studio notebook"
        ),
        heading("Next on the desk"),
        text(
          "Repeat the form at a different scale. Remove a color. Put two versions beside each other and describe the difference before deciding which one works."
        ),
        pageLink("Return to the works", "works")
      ),
    ],
  }),
  memeTemplate(48, {
    id: "meme-open-horizon",
    name: "Open Horizon",
    siteTitle: "Open Horizon",
    family: "artist",
    description:
      "A cinematic photographic exhibition with spacious image-and-essay pages and a field process.",
    presentation: style("gallery", "night", "serif", "airy"),
    accent: "#7ccee1",
    pages: [
      page(
        "studio",
        "Beyond the familiar route.",
        "An exhibition-shaped site about landscape, attention, and the distance between an encounter and an image.",
        memeImage(48, "two_thirds"),
        text(
          "The route is part of the work: the waiting, the return, and the decision to keep looking after the first photograph. This site gives the image room, then follows it into the field notes.",
          "third"
        ),
        pageLink("Enter the expedition", "expedition"),
        pageLink("Read the process", "process"),
        memeCredit(48)
      ),
      page(
        "expedition",
        "A place, encountered twice.",
        "A sample exhibition essay built around a credited work from the cultural commons.",
        kicker("Room 01 / Looking outward"),
        memeImage(48),
        text(
          "Freedom to Explore by Cath Simard is the reference work for this composition. The surrounding writing is sample editorial context, not an account of the artist's journey or a claim to have made the image."
        ),
        heading("A slower second look"),
        text(
          "A landscape image can move between scale and detail. After the first impression, give the eye time to follow the smaller relationships within the frame."
        ),
        memeCredit(48),
        pageLink("From encounter to sequence", "process")
      ),
      page(
        "process",
        "What the final image leaves out.",
        "A process page for the observations, choices, and practical context behind a body of work.",
        card(
          "In the field",
          "Record location where appropriate, conditions, access considerations, and the questions that shaped the visit."
        ),
        card(
          "At the edit",
          "Keep contact sheets and describe the sequence. Explain how one image changes the reading of the next."
        ),
        card(
          "In the archive",
          "Keep original files, captions, credits, and edition details together. Distinguish the photographer's record from later interpretation."
        ),
        pageLink("Return to the exhibition", "expedition")
      ),
    ],
  }),
  memeTemplate(537, {
    id: "meme-human-interface",
    name: "Human Interface",
    siteTitle: "Human Interface",
    family: "artist",
    description:
      "An art-led charcoal studio for mixed media, unfinished processes, and a tightly edited body of work.",
    presentation: style("gallery", "ink", "mono", "balanced"),
    accent: "#d2bca6",
    pages: [
      page(
        "studio",
        "The hand remains in the system.",
        "A mixed-media studio for images that sit between a human gesture and a machine process.",
        kicker("Input / Interruption / Output"),
        memeImage(537, "half"),
        text(
          "The work begins where a process becomes visible: a repeated mark, an imperfect surface, a rule that almost holds. The studio keeps those traces in view.",
          "half"
        ),
        pageLink("Inside the process", "process"),
        pageLink("Selected studies", "works"),
        memeCredit(537)
      ),
      page(
        "process",
        "Leave a trace of the decision.",
        "Three stages in an example mixed-media process.",
        heading("Input"),
        text(
          "Begin with a small set of materials and a clear constraint. Record the source of each material before it becomes part of the composition."
        ),
        heading("Interruption"),
        text(
          "Introduce an action that changes the system: a cut, a shift in scale, an unexpected interval. Keep the earlier state beside the new one."
        ),
        heading("Output"),
        text(
          "Choose the form that lets the work be encountered on its own terms. A process note should add context without becoming a requirement for looking."
        ),
        pageLink("See the resulting studies", "works")
      ),
      page(
        "works",
        "Studies in surface and repetition.",
        "Three original example images showing how a simple rule can produce different rhythms.",
        gallery(
          "The study wall",
          [ART.grid, ART.signal, ART.afterimage],
          "editorial"
        ),
        card(
          "Surface",
          "A reflected shape changes as the eye moves across it."
        ),
        card(
          "Interval",
          "A repeated mark creates a pace, and a small interruption makes that pace visible."
        ),
        quote(
          "The method is a tool; the work has to stand on its own.",
          "Studio note"
        ),
        pageLink("Return to the process", "process")
      ),
    ],
  }),
  memeTemplate(540, {
    id: "meme-the-witness",
    name: "The Witness",
    siteTitle: "The Witness",
    family: "artist",
    description:
      "A monochrome photographic portfolio with a vertical feature, documentary series, and precise field notes.",
    presentation: style("gallery", "paper", "serif", "airy"),
    accent: "#3e3e3e",
    pages: [
      page(
        "studio",
        "Attend to what is there.",
        "A photographic portfolio shaped by patient observation, clear captions, and room around the image.",
        memeImage(540, "two_thirds"),
        text(
          "A photograph is an encounter and a choice. This portfolio keeps the image first, with a concise record of the context that helps a viewer return to it.",
          "third"
        ),
        pageLink("Open the series", "series"),
        pageLink("Read the field book", "field-book"),
        memeCredit(540)
      ),
      page(
        "series",
        "The distance between looking and knowing.",
        "A sample exhibition sequence centered on a credited photographic work.",
        kicker("Plate 01 / A reference image"),
        memeImage(540, "half"),
        text(
          "Tears of the Desert by Ebrahim_Elmi appears here as a CC0 reference. Its title and artist credit travel with the image; the template's surrounding prose is not a statement by the photographer.",
          "half"
        ),
        heading("Space for the next plate"),
        text(
          "A finished series can add related photographs, dates, captions, and a short sequence note. Keep each source attached, and let the visual relationship do some of the explaining."
        ),
        memeCredit(540),
        pageLink("Notes on documenting a series", "field-book")
      ),
      page(
        "field-book",
        "Describe carefully. Claim no more.",
        "A field-book format for the facts and decisions that belong beside a photographic practice.",
        card(
          "The encounter",
          "Record what you know directly, the date, and the relevant circumstances. Respect the people and places represented."
        ),
        card(
          "The caption",
          "Use plain language. Distinguish observation from inference, and check names and source details."
        ),
        card(
          "The sequence",
          "Explain why these images appear together, and preserve a record when the arrangement changes."
        ),
        pageLink("Return to the series", "series")
      ),
    ],
  }),
];

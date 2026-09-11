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
      "A dark artist portfolio for digital work, new experiments and short studio updates.",
    presentation: style("gallery", "night", "sans", "compact"),
    accent: "#ff8b70",
    pages: [
      page(
        "studio",
        "After Hours Studio",
        "Digital experiments made in the evenings and on weekends.",
        kicker("Digital art / Studies / Studio notes"),
        memeImage(5, "two_thirds"),
        text(
          "I draw, scan and edit images after my day job. I’m working on a set of small prints; this notebook brings the plans, studies and credited references together.",
          "third"
        ),
        pageLink("View the work", "works"),
        pageLink("Read studio notes", "notebook"),
        memeCredit(5)
      ),
      page(
        "works",
        "Studies and references",
        "Three references for the next set of prints: reflections, city lights and drawn lines.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        image(ART.signal, ART_CAPTIONS.signal),
        card(
          "The next three studies",
          "I’m planning a folded-paper study using Afterimage’s orange and silver, a drawing of street lights after Night Grid, and a blue ink study after Quiet Signal. The images above are the references I’m working from."
        ),
        pageLink("Read the studio notebook", "notebook")
      ),
      page(
        "notebook",
        "Studio notebook",
        "A short update from an evening at the desk.",
        kicker("Study 014 / Trying a different crop"),
        text(
          "I spent most of the evening moving the crop a few pixels at a time. I saved both versions so I can look again tomorrow."
        ),
        quote(
          "The first version might still be the better one.",
          "Studio notebook"
        ),
        heading("Next session"),
        text(
          "Try a smaller print, check the color in daylight and choose a version for the series."
        ),
        pageLink("Back to the work", "works")
      ),
    ],
  }),
  memeTemplate(48, {
    id: "meme-open-horizon",
    name: "Open Horizon",
    siteTitle: "Open Horizon",
    family: "artist",
    description:
      "A photography portfolio with large images, a project page and notes about your process.",
    presentation: style("gallery", "night", "serif", "airy"),
    accent: "#7ccee1",
    pages: [
      page(
        "studio",
        "Landscape photography",
        "Weekend walks with a camera, route notes and photographs I’m studying.",
        memeImage(48, "two_thirds"),
        text(
          "I’m planning a series along the ridge above my town, returning to the same route through the year. Cath Simard’s Freedom to Explore is a reference I’ve saved while preparing the project.",
          "third"
        ),
        pageLink("Read about the ridge project", "expedition"),
        pageLink("Open the field notes", "process"),
        memeCredit(48)
      ),
      page(
        "expedition",
        "The ridge project",
        "A planned series following one walking route through the year.",
        kicker("Reference / Freedom to Explore by Cath Simard"),
        memeImage(48),
        text(
          "Freedom to Explore by Cath Simard is pictured here as a reference. My own ridge project is still at the scouting stage; this photograph is not part of that series."
        ),
        heading("The first walk"),
        text(
          "I walked the route without a camera first and marked three places to return to: the bend above the trees, the old fence and the view from the last rise. I’ll begin with those rather than trying to photograph everything."
        ),
        memeCredit(48),
        pageLink("Read the field notes", "process")
      ),
      page(
        "process",
        "Field notes",
        "The ridge project: what I’ve checked and what I’m trying next.",
        card(
          "Route check",
          "The return walk took longer than I expected. I’ll leave enough daylight for the descent and take a smaller camera bag on the next visit."
        ),
        card(
          "First contact sheet",
          "I want to compare the same three viewpoints before changing the route. The first edit will have one frame from each stop, with the date beside it."
        ),
        card(
          "Print plan",
          "I’m planning small unframed proofs to pin above the desk. Once I have a few visits to compare, I’ll decide which photographs belong together."
        ),
        pageLink("Back to the ridge project", "expedition")
      ),
    ],
  }),
  memeTemplate(537, {
    id: "meme-human-interface",
    name: "Human Interface",
    siteTitle: "Human Interface",
    family: "artist",
    description:
      "A dark portfolio for mixed-media artwork, with a gallery and a step-by-step process page.",
    presentation: style("gallery", "ink", "mono", "balanced"),
    accent: "#d2bca6",
    pages: [
      page(
        "studio",
        "Drawing, scanning and starting again",
        "Paper drawings, scanned textures and a new set of small prints.",
        kicker("Drawings / Digital work / Process"),
        memeImage(537, "half"),
        text(
          "I work with pencil, ink and cut paper before moving to the screen. At the moment I’m testing how much of a hand-drawn line survives scanning and printing. The credited works here are references for that project.",
          "half"
        ),
        pageLink("See the process", "process"),
        pageLink("Browse the work", "works"),
        memeCredit(537)
      ),
      page(
        "process",
        "From sketch to finished image",
        "Notes from the first round of ink drawings and print tests.",
        heading("On paper"),
        text(
          "I make a page of small drawings with ink and pencil. I scan the whole sheet before choosing which parts to use."
        ),
        heading("On screen"),
        text(
          "I cut out a few shapes, move them around and save several arrangements. Keeping the versions makes it easier to compare them later."
        ),
        heading("In print"),
        text(
          "I print a small proof before settling on the final file. Some marks that look good on a screen disappear on paper."
        ),
        pageLink("See the project references", "works")
      ),
      page(
        "works",
        "Studies and references",
        "The images on my reference board while I plan the next print tests.",
        gallery(
          "Project reference board",
          [ART.grid, ART.signal, ART.afterimage],
          "editorial"
        ),
        card(
          "Materials on the desk",
          "Blue drawing ink, soft pencils, cream paper and a small flatbed scanner. I’m testing narrow lines first, then adding denser areas to see where the scan loses detail."
        ),
        card(
          "Next print test",
          "Two A5 proofs of the same drawing: one on smooth paper and one on a rougher stock. I’ll compare the fine lines before choosing paper for the full set."
        ),
        quote(
          "I’m keeping the paper originals alongside the final files.",
          "Print notebook"
        ),
        pageLink("Back to the process", "process")
      ),
    ],
  }),
  memeTemplate(540, {
    id: "meme-the-witness",
    name: "The Witness",
    siteTitle: "The Witness",
    family: "artist",
    description:
      "A light photography portfolio with a featured image, a series page and a field notebook.",
    presentation: style("gallery", "paper", "serif", "airy"),
    accent: "#3e3e3e",
    pages: [
      page(
        "studio",
        "Photographs and field notes",
        "A new street photography project, with a notebook from the early visits.",
        memeImage(540, "two_thirds"),
        text(
          "I’m starting a series about the market before it opens: stalls going up, empty tables and deliveries arriving. Tears of the Desert by Ebrahim_Elmi is a photograph I’ve saved as a reference while I plan the work.",
          "third"
        ),
        pageLink("Read about the market project", "series"),
        pageLink("Open the field notebook", "field-book"),
        memeCredit(540)
      ),
      page(
        "series",
        "Before the market opens",
        "Notes for a series about the hour before the first customers arrive.",
        kicker("Reference / Tears of the Desert by Ebrahim_Elmi"),
        memeImage(540, "half"),
        text(
          "Tears of the Desert by Ebrahim_Elmi is the credited reference shown here. My market photographs are a separate project that is still in progress.",
          "half"
        ),
        heading("What I’m photographing"),
        text(
          "For the first visits, I’m concentrating on stalls and equipment: folded tables, stacked crates and the gaps left for delivery vans. I’ll speak to traders about portraits once I know the routine."
        ),
        memeCredit(540),
        pageLink("See the field notebook", "field-book")
      ),
      page(
        "field-book",
        "Field notebook",
        "Notes from the first two visits to the market.",
        card(
          "First visit / Too late",
          "By the time I arrived, most of the stalls were ready. I stayed to watch the deliveries and wrote down when the last vans left."
        ),
        card(
          "Second visit / Earlier start",
          "I came back an hour earlier and stayed near the same row of stalls. This time I could follow the setup from empty pavement to a row of tables."
        ),
        card(
          "The first edit",
          "I’m choosing a short sequence that follows the setup in order. Several frames repeat the same view; I’ll keep one from each stage for the next edit."
        ),
        pageLink("Back to the market project", "series")
      ),
    ],
  }),
];

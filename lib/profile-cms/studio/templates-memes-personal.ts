import {
  ART,
  ART_CAPTIONS,
  SOURCE_LINKS,
  card,
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
import { memeCredit, memeImage, memeTemplate } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const MEME_PERSONAL_TEMPLATES: readonly CmsStudioTemplate[] = [
  memeTemplate(1, {
    id: "meme-seizer",
    name: "Seizer",
    siteTitle: "Mira",
    family: "personal",
    description:
      "A compact personal identity, a wall of interests, and a reading room framed by pixel geometry.",
    presentation: style("signature", "stone", "mono", "compact"),
    accent: "#147d80",
    pages: [
      page(
        "studio",
        "A small place. A wide world.",
        "Mira's home for independent projects, digital culture, and ideas worth keeping.",
        kicker("Person / Practice / Curiosity"),
        memeImage(1, "third"),
        text(
          "I make notes, build small tools, and collect questions. This site gives each of those things a place to grow beyond the speed of a feed.",
          "two_thirds"
        ),
        card(
          "Currently making",
          "A public notebook about how open networks change creative work.",
          "third"
        ),
        card(
          "Currently noticing",
          "The shapes, symbols, and rituals people use to find one another.",
          "third"
        ),
        card(
          "Currently reading",
          "Essays about cities, public space, and the early web.",
          "third"
        ),
        pageLink("Follow my interests", "interests"),
        memeCredit(1)
      ),
      page(
        "interests",
        "Three circles of attention.",
        "Some interests become projects. Others make the projects better.",
        heading("Culture, tools, common space"),
        text(
          "A work of digital art is both an image and a meeting point. I follow the conversations around it as closely as the object itself.",
          "half"
        ),
        text(
          "Useful software has a similar quality: it creates a little more room for people to act on their own terms.",
          "half"
        ),
        card(
          "A current experiment",
          "Turn a month of reading notes into a small map of ideas, with a source for every connection."
        ),
        pageLink("Enter the reading room", "reading-room")
      ),
      page(
        "reading-room",
        "Keep the source close.",
        "An annotated shelf of places to begin, with room for disagreement.",
        card(
          "Open networks",
          "A starting point for understanding Ethereum's architecture and the choices behind it."
        ),
        externalLink("Read Ethereum documentation", SOURCE_LINKS.ethereum),
        card(
          "Digital cultural commons",
          "The Memes is one way to explore how a shared visual vocabulary travels between communities."
        ),
        externalLink("Explore The Memes", SOURCE_LINKS.memes),
        pageLink("Back to the introduction", "studio")
      ),
    ],
  }),
  memeTemplate(4, {
    id: "meme-sovereign",
    name: "Sovereign",
    siteTitle: "Sovereign Notebook",
    family: "personal",
    description:
      "A warm editorial home for personal principles, crypto interests, and considered essays.",
    presentation: style("editorial", "paper", "serif", "airy"),
    accent: "#b84a15",
    pages: [
      page(
        "studio",
        "Room to choose.",
        "Notes on open systems, patient work, and the tools that make independence practical.",
        kicker("The Sovereign Notebook"),
        memeImage(4, "half"),
        text(
          "Independence is easier to admire than to practice. I am interested in its ordinary details: knowing where a file lives, understanding a tool, and keeping a way to leave.",
          "half"
        ),
        quote(
          "A useful principle should change a small decision today.",
          "From the notebook"
        ),
        pageLink("The working principles", "principles"),
        pageLink("Read the essays", "essays"),
        memeCredit(4)
      ),
      page(
        "principles",
        "Principles with consequences.",
        "A short framework for deciding what deserves time and trust.",
        card(
          "Keep an exit",
          "Choose formats and systems that let the work travel. A good archive can be read without its original interface.",
          "third"
        ),
        card(
          "Understand the dependency",
          "Ask who controls a service, what can change, and what remains if it disappears.",
          "third"
        ),
        card(
          "Share the useful part",
          "Write down the method, cite the source, and leave enough context for another person to continue.",
          "third"
        ),
        heading("In practice"),
        text(
          "The notebook keeps source links beside claims and separates a working hypothesis from a conclusion. It is allowed to change its mind."
        ),
        pageLink("A longer argument", "essays")
      ),
      page(
        "essays",
        "The archive should outlive the interface.",
        "A first essay about portability, memory, and the quiet value of ordinary files.",
        heading("What survives a redesign?"),
        text(
          "An interface helps us enter the work. An archive helps us return. Titles, dates, captions, and source links are modest things, but they give a future reader a way through."
        ),
        text(
          "Portability starts with small habits: keep the original, describe what changed, and make the result legible outside the tool that produced it."
        ),
        externalLink("A technical introduction to IPFS", SOURCE_LINKS.ipfs),
        pageLink("Return to the principles", "principles")
      ),
    ],
  }),
  memeTemplate(8, {
    id: "meme-gm-journal",
    name: "GM Journal",
    siteTitle: "Mira's Mornings",
    family: "personal",
    description:
      "A deliberately quiet black journal: one greeting, a dated thought, and an archive.",
    presentation: style("journal", "ink", "sans", "airy"),
    accent: "#d0d0d0",
    pages: [
      page(
        "studio",
        "Good morning, again.",
        "A notebook for showing up, paying attention, and leaving a small trace.",
        kicker("Notebook 001 / A beginning"),
        text(
          "This morning I walked without headphones. There was a delivery bicycle, a window being painted, and a conversation I could not quite hear. None of it was remarkable. All of it was enough."
        ),
        pageLink("Earlier entries", "archive"),
        heading("A reference from the commons"),
        memeImage(8, "half"),
        memeCredit(8)
      ),
      page(
        "archive",
        "A few mornings, kept.",
        "Short entries, without the pressure to turn every observation into a lesson.",
        card(
          "003 / The long way home",
          "An extra street, a different view of the river, and a reminder that routines can have side doors."
        ),
        card(
          "002 / A useful conversation",
          "We spent an hour discussing the name of a project and discovered we had not agreed on what it should do."
        ),
        card(
          "001 / A beginning",
          "A walk without headphones. An ordinary morning worth keeping."
        ),
        pageLink("Why this notebook exists", "about")
      ),
      page(
        "about",
        "A smaller publishing habit.",
        "The journal belongs to Mira, a fictional sample voice with a preference for short notes and long walks.",
        text(
          "There is no schedule here. A note earns its place by being specific: a thing seen, a question asked, a link that opened another door."
        ),
        quote("Leave enough space for the next thought.", "A notebook rule"),
        text(
          "The credited FirstGM card is a cultural reference, separate from the journal's author and entries."
        ),
        pageLink("Read the latest note", "studio")
      ),
    ],
  }),
  memeTemplate(47, {
    id: "meme-exit-signal",
    name: "Exit Signal",
    siteTitle: "Exit Signal",
    family: "collector",
    description:
      "A compact digital-art contact sheet with hard cuts, careful credits, and a collector's signal log.",
    presentation: style("gallery", "night", "mono", "compact"),
    accent: "#eb7ca8",
    pages: [
      page(
        "studio",
        "Stay with the signal.",
        "A selection of digital works and the notes that make them matter.",
        kicker("Selection / Context / Afterimage"),
        memeImage(47, "two_thirds"),
        text(
          "A collection can be a form of editing. Put two works beside one another and something happens in the gap: an echo, an argument, a change of pace.",
          "third"
        ),
        pageLink("Open the contact sheet", "selection"),
        pageLink("Read the signal log", "signal-log"),
        memeCredit(47)
      ),
      page(
        "selection",
        "Three ways an image persists.",
        "Original example works arranged as an exercise in rhythm, surface, and memory.",
        image(ART.grid, ART_CAPTIONS.grid, "third"),
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        image(ART.signal, ART_CAPTIONS.signal, "half"),
        card(
          "The edit",
          "Begin with the smallest marks, move toward the reflective surface, and finish with the slower line. These are example assets, not a claimed wallet inventory."
        ),
        pageLink("Why this arrangement?", "signal-log")
      ),
      page(
        "signal-log",
        "An image after it leaves the screen.",
        "A collector's note about what remains after the first impression.",
        kicker("Entry 01 / Looking twice"),
        text(
          "The first encounter is often loud. A later one can be more useful. At a distance I remember a color; returning to the work, I notice the interval between repeated shapes."
        ),
        quote(
          "The selection is a question, not a verdict.",
          "Collection notebook"
        ),
        text(
          "Source pages and artist names stay with each work. A display reference is different from evidence of ownership."
        ),
        pageLink("Return to the selection", "selection")
      ),
    ],
  }),
  memeTemplate(59, {
    id: "meme-good-morning",
    name: "Good Morning",
    siteTitle: "Morning Cabinet",
    family: "collector",
    description:
      "A playful home for favorite works, daily rituals, and a small cabinet of curiosities.",
    presentation: style("signature", "ink", "sans", "balanced"),
    accent: "#9bdb63",
    pages: [
      page(
        "studio",
        "Curiosity before the inbox.",
        "A morning ritual, a favorite image, and a little room for the unexpected.",
        memeImage(59, "half"),
        text(
          "Coffee first. One work looked at carefully. Then a note about whatever caught my attention: an odd detail, a good joke, a color that followed me into the day.",
          "half"
        ),
        card(
          "Today's question",
          "What would you keep if your collection had room for only one mood?"
        ),
        pageLink("A few favorites", "favorites"),
        pageLink("The morning notebook", "mornings"),
        memeCredit(59)
      ),
      page(
        "favorites",
        "A cabinet with no straight line.",
        "The pleasure of collecting is sometimes the connection you did not plan.",
        gallery("Color, reflection, rhythm", [
          ART.afterimage,
          ART.grid,
          ART.signal,
        ]),
        card(
          "Color",
          "A warm surface makes the room around a work feel different.",
          "third"
        ),
        card(
          "Reflection",
          "A shape that appears to move even when the image is still.",
          "third"
        ),
        card(
          "Rhythm",
          "Little marks that invite another pass across the screen.",
          "third"
        ),
        pageLink("How the habit started", "mornings")
      ),
      page(
        "mornings",
        "Look first. Explain later.",
        "A short record of attention, before the day fills up.",
        kicker("Monday / A single detail"),
        text(
          "I spent ten minutes with the corner of an image. It was enough to discover a second rhythm beneath the first one."
        ),
        kicker("Wednesday / A useful detour"),
        text(
          "Following an artist's source link led to a process note, then another work. The route was more interesting than the recommendation."
        ),
        pageLink("Back to the cabinet", "favorites")
      ),
    ],
  }),
  memeTemplate(375, {
    id: "meme-quiet-growth",
    name: "Quiet Growth",
    siteTitle: "Quiet Growth Library",
    family: "collector",
    description:
      "A warm stone reading room for a thoughtful collection, a personal library, and marginal notes.",
    presentation: style("editorial", "stone", "serif", "airy"),
    accent: "#626b45",
    pages: [
      page(
        "studio",
        "A collection with room to grow.",
        "Images, books, and questions arranged for a slower kind of attention.",
        memeImage(375, "half"),
        text(
          "This is a reading room rather than a ranking. Works enter into conversation with notes, and the notes are allowed to remain unfinished.",
          "half"
        ),
        quote(
          "A shelf becomes interesting when its neighbors begin to speak.",
          "From the marginalia"
        ),
        pageLink("Browse the library", "library"),
        pageLink("Open the margins", "marginalia"),
        memeCredit(375)
      ),
      page(
        "library",
        "Arrange by the question.",
        "A small library organized around memory, systems, and the natural world.",
        card(
          "Memory",
          "How an object holds a time, and how a repeated encounter changes that time.",
          "third"
        ),
        card(
          "Systems",
          "Rules that create surprising results, from a generative image to a public institution.",
          "third"
        ),
        card(
          "The living world",
          "Growth, weather, attention, and the limits of a human point of view.",
          "third"
        ),
        image(ART.signal, ART_CAPTIONS.signal),
        pageLink("Notes from the reading desk", "marginalia")
      ),
      page(
        "marginalia",
        "The unfinished part belongs here.",
        "A notebook for questions that need company before they need answers.",
        heading("On keeping a record"),
        text(
          "A collection record tells a future reader what an object is. A personal note can tell them why it stopped someone in their tracks. Both deserve care; neither can replace the other."
        ),
        heading("On changing the arrangement"),
        text(
          "Move a work from one sequence to another and its meaning shifts. The old arrangement is worth keeping as part of the collection's history."
        ),
        pageLink("Return to the library", "library")
      ),
    ],
  }),
];

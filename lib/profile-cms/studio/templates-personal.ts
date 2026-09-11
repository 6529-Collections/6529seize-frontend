import {
  ART,
  ART_CAPTIONS,
  SOURCE_LINKS,
  card,
  defineTemplate,
  externalLink,
  heading,
  image,
  kicker,
  page,
  pageLink,
  quote,
  style,
  text,
} from "./template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const PERSONAL_TEMPLATES: readonly CmsStudioTemplate[] = [
  defineTemplate({
    id: "signature",
    name: "Signature",
    siteTitle: "Mira",
    family: "personal",
    description:
      "A concise introduction, a few strong interests, and room for what comes next.",
    presentation: style("signature", "paper", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Mira, at the intersection.",
        "Researcher, collector, and habitual walker. I pay attention to the spaces where culture and open networks meet.",
        kicker("Independent notes · Small experiments · Open questions"),
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "This is my small corner of the internet: a place for ideas that need more space than a post, projects worth explaining, and works I keep returning to.",
          "third"
        ),
        pageLink("A little about me", "about"),
        pageLink("What I am doing now", "now")
      ),
      page(
        "about",
        "Attention is a practice.",
        "I like to turn complicated questions into clear notes, useful tools, and conversations people want to continue.",
        heading("Three things I return to"),
        card(
          "Cities on foot",
          "Walking is my way of thinking. I keep a notebook of ordinary details: a stair, a sign, a patch of afternoon light.",
          "third"
        ),
        card(
          "Digital culture",
          "I follow how people make meaning together, especially when the tools and rules are still being invented.",
          "third"
        ),
        card(
          "Collecting slowly",
          "A work stays with me when it changes after repeated looking. My notes matter as much as the selection.",
          "third"
        ),
        quote(
          "Make something small enough to finish and open enough to share.",
          "A note to myself"
        ),
        pageLink("Read my current chapter", "now")
      ),
      page(
        "now",
        "A quieter kind of progress.",
        "September notebook: fewer projects, more sustained attention.",
        heading("On the desk"),
        text(
          "I am sketching an illustrated guide to public digital spaces. The first draft is deliberately short: one question, one diagram, one invitation to respond."
        ),
        heading("Away from the desk"),
        text(
          "Long walks, a stack of essays, and learning to notice the same neighborhood in different weather."
        ),
        externalLink("Explore open digital culture", SOURCE_LINKS.about),
        pageLink("Back to the introduction", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "chapters",
    name: "Chapters",
    siteTitle: "Mira's Almanac",
    family: "personal",
    description:
      "A personal story told through places, turning points, and a current chapter.",
    presentation: style("editorial", "stone", "serif", "airy"),
    pages: [
      page(
        "studio",
        "A life in maps and music.",
        "Three chapters in an unfinished story about finding a way to work, make, and belong.",
        kicker("01 · Learning to look"),
        text(
          "My first maps were drawings of places I knew by sound: the station, the rehearsal room, the street outside our window."
        ),
        pageLink("Read the first chapter", "beginnings"),
        kicker("02 · Making with others"),
        text(
          "The most useful things I have made began as conversations. A good collaborator changes the question, not just the answer."
        ),
        pageLink("Read the current chapter", "current"),
        image(ART.afterimage, ART_CAPTIONS.afterimage)
      ),
      page(
        "beginnings",
        "Learning to look.",
        "Before I knew what I wanted to make, I learned to keep a record of what interested me.",
        heading("A pocket-sized archive"),
        text(
          "Ticket stubs, hand-drawn routes, and half-remembered melodies became a small archive. None of it was important alone. Together, it showed me what I noticed."
        ),
        quote(
          "A map can describe a route, or reveal a way of paying attention.",
          "From the example notebook"
        ),
        heading("What stayed"),
        text(
          "I still begin projects with observations rather than answers. The notebook is less a record of certainty than permission to ask a better question."
        ),
        pageLink("Continue to the present", "current")
      ),
      page(
        "current",
        "Making room for the next chapter.",
        "I am learning how to connect a private practice of noticing with a public practice of sharing.",
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "This chapter has no neat ending. I am building a small library of notes and diagrams, inviting collaborators into unfinished work, and leaving room to change direction.",
          "half"
        ),
        heading("Continuing threads"),
        card(
          "Music",
          "Listening closely remains a useful model for working with people."
        ),
        card(
          "Open networks",
          "I am interested in communities that make participation understandable."
        ),
        pageLink("Return to the chapters", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "practice",
    name: "Practice",
    siteTitle: "Northline",
    family: "personal",
    description:
      "Selected work presented through the problem, contribution, and decisions behind it.",
    presentation: style("editorial", "paper", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Clear work for complex questions.",
        "Northline is an independent design practice exploring useful tools, readable systems, and calmer digital spaces.",
        image(
          ART.grid,
          "A visual study for the fictional Common Index project."
        ),
        heading("Selected work"),
        card(
          "Common Index",
          "A research-library concept that makes sources and editorial choices visible."
        ),
        card(
          "A quieter interface",
          "An interface study focused on clear next steps and fewer competing demands."
        ),
        pageLink("Explore the case study", "common-index"),
        pageLink("How I work", "approach")
      ),
      page(
        "common-index",
        "Common Index.",
        "A fictional case study in making a shared research library easier to navigate and maintain.",
        kicker("Concept project · Research and product design"),
        heading("The question"),
        text(
          "How can a growing collection of links remain useful when its original organizer is no longer there to explain it?"
        ),
        image(ART.signal, "Example visual study; not a client deliverable."),
        heading("The contribution"),
        text(
          "The concept separates a source from the note explaining why it matters. A simple reading path helps new visitors, while a clear index supports returning readers."
        ),
        heading("What the study taught me"),
        text(
          "A smaller vocabulary made the interface easier to explain. The next step would be testing the language with actual readers before making claims about its effectiveness."
        ),
        pageLink("See the working approach", "approach")
      ),
      page(
        "approach",
        "Find the useful shape.",
        "I work through small, visible decisions rather than one large reveal.",
        heading("A working sequence"),
        card(
          "Understand",
          "Read the existing material and ask where people lose their way.",
          "third"
        ),
        card(
          "Make",
          "Build a small working example that exposes the difficult decisions.",
          "third"
        ),
        card(
          "Refine",
          "Review with the people who will use and maintain the result.",
          "third"
        ),
        heading("Working together"),
        text(
          "A useful brief describes a real problem, who it affects, and what would make the work worth doing. It does not need to prescribe the solution."
        ),
        pageLink("Return to selected work", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "field-notes",
    name: "Field Notes",
    siteTitle: "Signals & Walks",
    family: "personal",
    description:
      "An editorial home for essays, observations, and a deliberately small reading shelf.",
    presentation: style("journal", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Signals & walks.",
        "Notes on digital culture, ordinary places, and the habits that help us see both more clearly.",
        kicker("Featured essay"),
        heading("The value of a small public notebook"),
        text(
          "A notebook does not have to become a publication to be useful. Sharing a few considered observations can be enough to start a conversation."
        ),
        pageLink("Read the essay", "public-notebook"),
        heading("On the shelf"),
        card(
          "Public spaces",
          "How the shape of a place changes the conversations it permits."
        ),
        card(
          "Open tools",
          "Resources that let people build on each other's work."
        ),
        pageLink("Browse the reading shelf", "reading")
      ),
      page(
        "public-notebook",
        "The value of a small public notebook.",
        "An example essay about publishing observations before they become conclusions.",
        kicker("Field note 01 · Culture and attention"),
        text(
          "The blank page becomes less intimidating when its job is to hold one useful observation. A sketch, a source, and a question can form a complete entry.\n\nA public notebook also makes the limits of a thought visible. Readers can see where an idea began and what might change it."
        ),
        quote(
          "Leave enough context for someone else to continue the thought.",
          "Notebook principle"
        ),
        heading("A modest publishing rhythm"),
        text(
          "Choose a question worth revisiting. Keep the sources close. Return to older notes when a new observation changes their meaning."
        ),
        pageLink("Visit the reading shelf", "reading")
      ),
      page(
        "reading",
        "A shelf with room to grow.",
        "A few useful starting points, each with a reason to visit.",
        heading("Culture and common resources"),
        text(
          "Open licenses make it easier to understand how creative work may be shared and adapted. The details matter as much as the invitation."
        ),
        externalLink(
          "Read about Creative Commons licenses",
          SOURCE_LINKS.licenses
        ),
        heading("Open digital worlds"),
        text(
          "The 6529 introduction is a starting point for the ideas behind a decentralized digital culture. Read it as a source, then make your own notes."
        ),
        externalLink("Read the 6529 introduction", SOURCE_LINKS.about),
        pageLink("Return to the notebook", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "citizen",
    name: "Citizen",
    siteTitle: "Open Notebook",
    family: "personal",
    description:
      "Community contribution explained through chosen conversations, notes, and resources.",
    presentation: style("organization", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "A place to contribute.",
        "A community notebook about making ideas understandable and helping useful conversations continue.",
        heading("What I care about"),
        card(
          "Clear explanations",
          "Turning a long thread into a useful starting point without losing its context."
        ),
        card(
          "Shared memory",
          "Keeping references, decisions, and open questions easy to find."
        ),
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "This example shows how selected activity can become a coherent story. It contains no claims of actual participation or reputation.",
          "third"
        ),
        pageLink("Read the contribution notebook", "contributions"),
        pageLink("Find community starting points", "conversations")
      ),
      page(
        "contributions",
        "Work that leaves a trail.",
        "An example contribution record organized around context and useful outputs.",
        heading("A welcome guide, in outline"),
        text(
          "The idea is simple: give a newcomer three places to begin, explain what each place is for, and keep the original sources within reach."
        ),
        heading("Questions for a review"),
        card(
          "Is it understandable?",
          "A new reader should know why a link is here before opening it."
        ),
        card(
          "Can it stay current?",
          "Every guide needs a clear owner and a way to identify outdated material."
        ),
        pageLink("Open the source shelf", "conversations")
      ),
      page(
        "conversations",
        "Start with the source.",
        "A short directory of real public destinations for learning about 6529 and its art.",
        heading("The network"),
        text(
          "Begin with the public introduction and follow the parts that connect with your interests."
        ),
        externalLink("About 6529", SOURCE_LINKS.about),
        heading("The art"),
        text(
          "The Memes collection gives a concrete starting point for looking at the relationship between messages, images, and shared culture."
        ),
        externalLink("Explore The Memes", SOURCE_LINKS.memes),
        pageLink("Back to the community notebook", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "onchain",
    name: "Onchain",
    siteTitle: "Mira / Onchain",
    family: "personal",
    description:
      "Crypto interests and contributions presented with context instead of a balance dashboard.",
    presentation: style("journal", "night", "mono", "compact"),
    pages: [
      page(
        "studio",
        "Open systems, practical experiments.",
        "A research map for understanding how networks are built, governed, and used.",
        heading("Three questions"),
        card(
          "Can I verify it?",
          "Prefer primary documentation and explain which parts are directly observable.",
          "third"
        ),
        card(
          "Can I participate?",
          "Look for clear paths from reading to meaningful contribution.",
          "third"
        ),
        card(
          "Can I leave?",
          "Understand portability, dependencies, and the cost of changing tools.",
          "third"
        ),
        pageLink("Explore the research map", "research"),
        pageLink("Read the working principles", "principles")
      ),
      page(
        "research",
        "A map, not a recommendation list.",
        "Primary sources for learning about open networks. Inclusion does not imply investment, ownership, or endorsement.",
        heading("Ethereum"),
        text(
          "Start with the documentation to understand the platform's accounts, transactions, and application model."
        ),
        externalLink("Ethereum documentation", SOURCE_LINKS.ethereum),
        heading("Content addressing"),
        text(
          "IPFS documentation explains how content identifiers differ from conventional location-based links."
        ),
        externalLink("IPFS documentation", SOURCE_LINKS.ipfs),
        pageLink("Read the principles", "principles")
      ),
      page(
        "principles",
        "Keep the assumptions visible.",
        "A useful project note explains what is known, what was observed, and what still depends on someone else.",
        heading("Source and date"),
        text(
          "Record the source behind a technical claim and the time of observation. A snapshot is evidence of one moment, not a promise about the future."
        ),
        heading("Chosen disclosure"),
        text(
          "Public writing does not require public wallet balances. Keep personal addresses, valuations, and activity out of a page unless there is a clear reason to include them."
        ),
        quote(
          "Understanding a system starts with knowing where its claims come from.",
          "Example research principle"
        ),
        pageLink("Return to the overview", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "atlas",
    name: "Atlas",
    siteTitle: "Mira's Atlas",
    family: "personal",
    description:
      "A substantial personal home with separate destinations for work, art, notes, and community.",
    presentation: style("editorial", "stone", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "A corner of the internet, with room.",
        "Mira's atlas brings together a working practice, a growing collection of notes, and an interest in open culture.",
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        heading("Choose a direction"),
        card(
          "Work",
          "Small projects with a clear question and a visible process.",
          "third"
        ),
        card(
          "Art",
          "Selected images and notes about looking closely.",
          "third"
        ),
        card(
          "Notes",
          "Ideas about culture, community, and open tools.",
          "third"
        ),
        pageLink("Explore the work", "work"),
        pageLink("Visit the art room", "art"),
        pageLink("Read the notes", "notes"),
        pageLink("Community and open networks", "connections")
      ),
      page(
        "work",
        "Useful, considered, unfinished.",
        "A small portfolio of concept projects and the decisions behind them.",
        heading("The shared index"),
        text(
          "A concept for a research shelf that separates original sources from the annotations explaining their relevance."
        ),
        image(ART.grid, "Example visual study for the shared index.", "half"),
        text(
          "The design question is how to keep a collection understandable as it grows. The first experiment is an intentionally small vocabulary and a visible reading path.",
          "half"
        ),
        pageLink("Read related notes", "notes")
      ),
      page(
        "art",
        "Look once. Return later.",
        "An example selection with room for a personal response. These are template artworks, not a record of NFT ownership.",
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "I am drawn to the tension between a repeated system and an unexpected interruption. A small change can make an entire field feel different.",
          "third"
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        pageLink("Back to the atlas", "studio")
      ),
      page(
        "notes",
        "A notebook for connections.",
        "Short observations about making, collecting, and participating.",
        heading("Why keep a public note?"),
        text(
          "Writing down a source and a question creates a useful object for someone else to respond to. It does not need to claim the final word."
        ),
        heading("A collecting note"),
        text(
          "Sequence changes how an image is read. I like to compare a work alone with the same work placed between two others."
        ),
        pageLink("Explore community sources", "connections")
      ),
      page(
        "connections",
        "Follow the thread.",
        "A few real destinations connecting digital culture, art, and open systems.",
        heading("6529"),
        text(
          "Start with the network's public introduction and the art of The Memes."
        ),
        externalLink("About 6529", SOURCE_LINKS.about),
        externalLink("The Memes", SOURCE_LINKS.memes),
        heading("Open systems"),
        text(
          "Primary technical documentation is a useful companion to broader cultural writing."
        ),
        externalLink("Ethereum documentation", SOURCE_LINKS.ethereum),
        pageLink("Return home", "studio")
      ),
    ],
  }),
];

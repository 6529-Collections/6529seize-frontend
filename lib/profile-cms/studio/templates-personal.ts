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
      "An introduction, a short biography and a page for current projects.",
    presentation: style("signature", "paper", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Hi, I'm Mira.",
        "I design research tools, collect digital art and spend most weekends walking around the city.",
        kicker("Product designer · Art collector · Weekend walker"),
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "I work on search and reading tools for small research teams. This site has a little about my background, the projects on my desk and the things I do outside work.",
          "third"
        ),
        pageLink("About me", "about"),
        pageLink("Current projects", "now")
      ),
      page(
        "about",
        "About Mira",
        "I'm a product designer with a background in library cataloguing. I like working on search, filters and the details that make a large collection easier to use.",
        heading("Outside work"),
        card(
          "Walking routes",
          "I keep a list of routes with good crossings, public toilets and somewhere to stop for coffee. My favourite is the long way home along the canal.",
          "third"
        ),
        card(
          "Digital art",
          "I follow artists who work with grids, type and repeated lines. I save exhibition links and write down what caught my eye.",
          "third"
        ),
        card(
          "My collection",
          "I buy occasionally and keep a note for each work: where I first saw it, why I wanted it and where to find the artist's other work.",
          "third"
        ),
        quote(
          "This month's job: finish the route map before starting another one.",
          "Mira's September task list"
        ),
        pageLink("See what I'm working on", "now")
      ),
      page(
        "now",
        "September projects",
        "A reading-list prototype, a canal route map and a new set of art notes.",
        heading("At my desk"),
        text(
          "I'm building a shared reading list with a title, source link and short note for each entry. This week I'm checking whether the topic filters still make sense when someone else adds an article."
        ),
        heading("At the weekend"),
        text(
          "I'm walking the canal route in both directions to check the crossings and bench locations. I also need to return two library books before I borrow any more."
        ),
        externalLink("Read about 6529", SOURCE_LINKS.about),
        pageLink("Back to my introduction", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "chapters",
    name: "Chapters",
    siteTitle: "Mira's Almanac",
    family: "personal",
    description:
      "A personal biography with separate pages for early interests and life today.",
    presentation: style("editorial", "stone", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Maps, music and the work in between",
        "I started by drawing bus routes and playing in a rehearsal room above a shop. These days I design research tools and still make time for both.",
        kicker("01 · Bus maps and band practice"),
        text(
          "At school I drew maps showing which bus to catch after rehearsal. The first version left out the last bus home. That was a fairly effective lesson in checking the details."
        ),
        pageLink("Early years", "beginnings"),
        kicker("02 · Design and local projects"),
        text(
          "Now I work on catalogues and reading tools. Outside work, I help organise a small listening group and keep a map of walks that start near a bus stop."
        ),
        pageLink("Life today", "current"),
        image(ART.afterimage, ART_CAPTIONS.afterimage)
      ),
      page(
        "beginnings",
        "Bus maps and band practice",
        "My first design projects were rehearsal flyers, handwritten set lists and a map of the routes between our homes.",
        heading("The folder I kept"),
        text(
          "I still have a folder of flyers and route sketches. Some are hard to read, but they show the practical questions we were trying to answer: when to arrive, what to bring and how to get home."
        ),
        quote(
          "Put the date and the address on the flyer. The band name can be smaller.",
          "A reminder from our rehearsal notes"
        ),
        heading("What I took into work"),
        text(
          "I moved from cataloguing books to designing digital catalogues. I still start by listing the information a reader needs before deciding how the page should look."
        ),
        pageLink("Life today", "current")
      ),
      page(
        "current",
        "Design, records and weekend routes",
        "My week is split between product design, a listening group and walks around the city.",
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "At work I'm prototyping a shared reading list. At home I'm sorting records for our next listening evening. The route map is waiting for one more walk to check an awkward road crossing.",
          "half"
        ),
        heading("Regular commitments"),
        card(
          "Listening group",
          "Once a month, each person brings one record and gets ten minutes to explain their choice. We take turns hosting."
        ),
        card(
          "Open-source tools",
          "I use documentation and issue trackers to learn how the tools I rely on work. When a setup guide misses a step, I try to write it down."
        ),
        pageLink("Back to the chapters", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "practice",
    name: "Practice",
    siteTitle: "Northline",
    family: "personal",
    description:
      "A design portfolio with a project brief, case study and working process.",
    presentation: style("editorial", "paper", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Design for research tools",
        "Northline is an independent design practice working on catalogues, reading tools and small publishing sites.",
        image(
          ART.grid,
          "Night Grid — a dark grid with a bright diagonal strip."
        ),
        heading("Selected projects"),
        card(
          "Common Index",
          "A shared reading library with topic filters, source links and notes from the people who added them."
        ),
        card(
          "Reading view",
          "A companion screen that keeps the article title, original source and reading position easy to find."
        ),
        pageLink("View Common Index", "common-index"),
        pageLink("Working process", "approach")
      ),
      page(
        "common-index",
        "Common Index",
        "A self-directed design project for a team that collects articles across several shared documents.",
        kicker(
          "Concept project · Information architecture and interface design"
        ),
        heading("The brief"),
        text(
          "The same link was being saved under different titles, and new readers could not tell which articles to start with. The brief was to create one index without losing the notes beside each link."
        ),
        image(
          ART.signal,
          "Quiet Signal — overlapping blue lines on a cream background."
        ),
        heading("The design"),
        text(
          "Each entry has a title, original URL, topic, contributor and short note. Readers can filter by topic or choose a five-article introduction. Duplicate URLs are flagged before an entry is added."
        ),
        heading("Next round of testing"),
        text(
          "I want to ask three people to add an article and find a source they have not read before. The main questions are whether the topic names make sense and whether the duplicate warning is clear."
        ),
        pageLink("Working process", "approach")
      ),
      page(
        "approach",
        "From brief to working prototype",
        "I agree the task, make a small prototype and review it with the people who will use it.",
        heading("Project stages"),
        card(
          "Inventory",
          "Collect the existing screens, documents and recurring support questions. Identify the task that causes the most trouble.",
          "third"
        ),
        card(
          "Prototype",
          "Build the main task with realistic titles, long entries and empty states. Write down decisions that still need testing.",
          "third"
        ),
        card(
          "Review",
          "Watch people use the prototype, fix the main obstacles and hand over the designs with notes for the developer.",
          "third"
        ),
        heading("Starting a project"),
        text(
          "Send a description of the tool, who uses it and the task you want to improve. A few existing screens or documents are more useful than a long presentation."
        ),
        pageLink("Back to selected projects", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "field-notes",
    name: "Field Notes",
    siteTitle: "Signals & Walks",
    family: "personal",
    description:
      "An essay, a reading shelf and an index for a personal publication.",
    presentation: style("journal", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Signals & Walks",
        "Mira's notes on walking routes, maps and the digital tools used to record them.",
        kicker("Latest article"),
        heading("The missing crossing on my route map"),
        text(
          "A route that looked straightforward on screen needed a long detour on foot. Here is what I changed after walking it."
        ),
        pageLink("Read the article", "public-notebook"),
        heading("Reading topics"),
        card(
          "Streets and maps",
          "Crossings, entrances and small details that decide whether a walking route is usable."
        ),
        card(
          "Publishing resources",
          "Sources for checking image permissions and learning about open digital culture."
        ),
        pageLink("Browse the reading shelf", "reading")
      ),
      page(
        "public-notebook",
        "The missing crossing",
        "I walked my canal route from the station and found that the map sent me to the wrong side of a busy road.",
        kicker("Route note 01 · Canal walk"),
        text(
          "The path looked continuous on the map, but the entrance was behind a barrier. The nearest signal-controlled crossing was two streets back. I had to retrace the route before I could reach the canal.\n\nI moved the start point to the crossing and added a short direction: stay on the station side until the lights. The route is longer now, but it describes a walk someone can actually follow."
        ),
        quote(
          "Check the entrance from the street, not just the line on the map.",
          "Route checklist"
        ),
        heading("Before I publish the next route"),
        text(
          "Walk it in both directions. Check the entrances, note the steep sections and mark the last place to buy water. Put the date of the walk beside the map so readers know when it was checked."
        ),
        pageLink("Reading shelf", "reading")
      ),
      page(
        "reading",
        "Reading shelf",
        "Two sources I use when preparing a page with images and links.",
        heading("Image permissions"),
        text(
          "Before reusing an image, I check its license and attribution requirements. The Creative Commons guide explains the differences between its licenses."
        ),
        externalLink("Creative Commons license guide", SOURCE_LINKS.licenses),
        heading("Digital culture"),
        text(
          "The 6529 introduction explains the project's interest in open digital spaces. I keep it here alongside my notes about publishing and sharing creative work."
        ),
        externalLink("About 6529", SOURCE_LINKS.about),
        pageLink("Back to Signals & Walks", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "citizen",
    name: "Citizen",
    siteTitle: "Open Notebook",
    family: "personal",
    description:
      "A community profile with contribution notes and a newcomer resource page.",
    presentation: style("organization", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Community notes and guides",
        "I help turn recurring questions into short guides and keep a list of sources for people new to 6529.",
        heading("Current tasks"),
        card(
          "Newcomer questions",
          "Collect the questions that come up repeatedly and link each answer to the relevant source."
        ),
        card(
          "Guide maintenance",
          "Check page links, replace outdated screenshots and put a review date on each guide."
        ),
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "My current draft covers where to read about 6529, where to browse The Memes and how to find the original information behind an answer.",
          "third"
        ),
        pageLink("Guide draft", "contributions"),
        pageLink("Newcomer links", "conversations")
      ),
      page(
        "contributions",
        "Newcomer guide draft",
        "A short starting page for someone who has heard of 6529 but does not know where to begin.",
        heading("What the guide includes"),
        text(
          "Start with the 6529 introduction for the project background. Then browse The Memes to see the artwork. Keep the source links beside each explanation so readers can check details for themselves."
        ),
        heading("Review checklist"),
        card(
          "Clear link labels",
          "Say what the reader will find: project introduction, collection page or license information. Avoid labels such as 'click here'."
        ),
        card(
          "A maintenance note",
          "Record when each link was checked and which section needs another review. Remove a screenshot when it no longer matches the page."
        ),
        pageLink("Open the newcomer links", "conversations")
      ),
      page(
        "conversations",
        "Newcomer links",
        "The project introduction and the collection page are useful first stops.",
        heading("Project background"),
        text(
          "Read about 6529's aims and the ideas behind the network before following the more detailed links."
        ),
        externalLink("About 6529", SOURCE_LINKS.about),
        heading("The Memes collection"),
        text(
          "Browse the collection's images, titles and artist credits. Pick one card and follow the artist's work from there."
        ),
        externalLink("Browse The Memes", SOURCE_LINKS.memes),
        pageLink("Back to community notes", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "onchain",
    name: "Onchain",
    siteTitle: "Mira / Onchain",
    family: "personal",
    description:
      "A technical learning log with research topics and primary-source links.",
    presentation: style("journal", "night", "mono", "compact"),
    pages: [
      page(
        "studio",
        "Learning how Ethereum and IPFS work",
        "I'm working through accounts, transactions and content addressing. These pages collect the questions and sources for my next experiments.",
        heading("Current questions"),
        card(
          "Accounts",
          "What is the difference between an account controlled by a key and one controlled by a contract?",
          "third"
        ),
        card(
          "Transactions",
          "Which parts of a transaction can I inspect in a block explorer, and which depend on the application?",
          "third"
        ),
        card(
          "Files",
          "What changes an IPFS content identifier, and what is still needed to keep the file available?",
          "third"
        ),
        pageLink("Reading list", "research"),
        pageLink("Experiment notes", "principles")
      ),
      page(
        "research",
        "Technical reading list",
        "The documentation I use to check terms and plan small experiments.",
        heading("Ethereum accounts and transactions"),
        text(
          "I start with accounts, then follow a transaction from its signed fields to its receipt. I keep the relevant documentation beside my notes."
        ),
        externalLink("Ethereum developer documentation", SOURCE_LINKS.ethereum),
        heading("IPFS content identifiers"),
        text(
          "My next test is to add a text file, change one line and compare the identifiers. I also want to check what happens when the machine holding the file goes offline."
        ),
        externalLink("IPFS documentation", SOURCE_LINKS.ipfs),
        pageLink("Experiment notes", "principles")
      ),
      page(
        "principles",
        "How I record a test",
        "Each note includes the question, setup, result and a link to the source I used.",
        heading("Make it repeatable"),
        text(
          "Record the network, tool version and input. Separate the output I observed from an explanation I still need to check. A failed test is useful if I can reproduce it."
        ),
        heading("Keep private data out"),
        text(
          "Use test inputs in public notes. Never include seed phrases, signing keys or session tokens in a screenshot or example command."
        ),
        quote(
          "Next test: change one byte in a file and compare the content identifiers.",
          "Mira's test list"
        ),
        pageLink("Back to the overview", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "atlas",
    name: "Atlas",
    siteTitle: "Mira's Atlas",
    family: "personal",
    description:
      "A personal website with dedicated pages for work, art, writing and useful links.",
    presentation: style("editorial", "stone", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Mira's work, art and notes",
        "I'm a product designer interested in digital collections, city maps and tools for shared reading.",
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        heading("Around this site"),
        card(
          "Work",
          "A reading-library prototype and the decisions behind its search and topic filters.",
          "third"
        ),
        card(
          "Art",
          "Three images selected for their use of lines, reflections and light.",
          "third"
        ),
        card(
          "Notes",
          "Short entries about route maps, reading lists and arranging images.",
          "third"
        ),
        pageLink("View my work", "work"),
        pageLink("View the art selection", "art"),
        pageLink("Read my notes", "notes"),
        pageLink("Useful links", "connections")
      ),
      page(
        "work",
        "Design projects",
        "Common Index is a self-directed prototype for organising a team's shared reading list.",
        heading("Common Index"),
        text(
          "Each saved article has an original URL, topic and contributor note. A short introduction gives new readers a place to start without hiding the full catalogue."
        ),
        image(
          ART.grid,
          "Night Grid — dark cells crossed by a bright diagonal strip.",
          "half"
        ),
        text(
          "The first version has three topic filters and a duplicate-link check. The next step is to ask a few readers to add an entry and find an unfamiliar source without help.",
          "half"
        ),
        pageLink("Project notes", "notes")
      ),
      page(
        "art",
        "Art selection",
        "Three digital images with different kinds of detail: curved lines, a reflective loop and a field of lights.",
        image(ART.signal, ART_CAPTIONS.signal, "two_thirds"),
        text(
          "Quiet Signal uses repeated blue lines with a red cluster at one edge. Afterimage puts a reflective loop against orange. Night Grid is mostly dark, with a diagonal line of small lights. I like seeing them at both thumbnail size and full size.",
          "third"
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        pageLink("Back to the atlas", "studio")
      ),
      page(
        "notes",
        "Notes from my desk",
        "Recent entries about making a useful index and choosing an image order.",
        heading("A reading-list entry needs a reason"),
        text(
          "A title and URL tell me where an article is. A sentence from the person who saved it tells me why it belongs in the list. I keep those as separate fields."
        ),
        heading("Image order"),
        text(
          "I put the bright orange image between the blue line drawing and the dark grid. At thumbnail size it breaks up the grid; on its own page the reflection in the loop is easier to see."
        ),
        pageLink("Useful links", "connections")
      ),
      page(
        "connections",
        "Sources and references",
        "Public pages I use for digital art, open culture and technical documentation.",
        heading("6529 and The Memes"),
        text(
          "The introduction covers the project; the collection page is where I browse cards and follow artist credits."
        ),
        externalLink("About 6529", SOURCE_LINKS.about),
        externalLink("Browse The Memes", SOURCE_LINKS.memes),
        heading("Ethereum documentation"),
        text(
          "I use the developer documentation when a project note refers to accounts, transactions or contracts."
        ),
        externalLink("Ethereum developer documentation", SOURCE_LINKS.ethereum),
        pageLink("Home", "studio")
      ),
    ],
  }),
];

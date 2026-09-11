import {
  SOURCE_LINKS,
  card,
  externalLink,
  heading,
  kicker,
  page,
  pageLink,
  quote,
  style,
  text,
} from "./template-recipes";
import { memeCredit, memeImage, memeTemplate } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const MEME_ORGANIZATION_TEMPLATES: readonly CmsStudioTemplate[] = [
  memeTemplate(2, {
    id: "meme-production",
    name: "Production",
    siteTitle: "Common Press",
    family: "organization",
    description:
      "A poster-led creative organization with a public manifesto and a strong project index.",
    presentation: style("organization", "paper", "sans", "compact"),
    accent: "#bd3826",
    pages: [
      page(
        "studio",
        "Make the public thing.",
        "Common Press is an independent practice for visual ideas, shared tools, and cultural projects.",
        kicker("Ideas become useful when they leave the notebook."),
        memeImage(2, "third"),
        text(
          "We turn research into things people can encounter: a publication, an exhibition, a tool, a conversation. The work begins with a clear question and ends with something others can use.",
          "two_thirds"
        ),
        card("01 / Publish", "Give a good idea a legible form.", "third"),
        card(
          "02 / Gather",
          "Make room for different kinds of knowledge.",
          "third"
        ),
        card(
          "03 / Release",
          "Leave a clear route for the work to travel.",
          "third"
        ),
        pageLink("Read the manifesto", "manifesto"),
        pageLink("See the projects", "projects"),
        memeCredit(2)
      ),
      page(
        "manifesto",
        "An open brief.",
        "Five working commitments for making culture together.",
        heading("Begin with a real question"),
        text(
          "A strong project can explain who it is for, what it wants to discover, and what would make it useful."
        ),
        heading("Make the process legible"),
        text(
          "Share the sources and the decisions. Give collaborators the context to disagree well."
        ),
        heading("Credit the work"),
        text(
          "Keep names, sources, and permissions attached. Open materials still deserve careful description."
        ),
        card(
          "Leave something usable",
          "A project should leave more than a launch image: an archive, a method, or a tool that remains understandable."
        ),
        pageLink("The manifesto in practice", "projects")
      ),
      page(
        "projects",
        "A working index.",
        "Three projects at different scales, joined by an interest in the public life of ideas.",
        card(
          "The Common Reader",
          "A short publication pairing a cultural question with annotated primary sources."
        ),
        card(
          "Open Table",
          "A workshop format built around one object, several perspectives, and a shared set of notes."
        ),
        card(
          "A Useful Archive",
          "A collection of reusable documentation patterns for small cultural organizations."
        ),
        externalLink(
          "Explore the Creative Commons licenses",
          SOURCE_LINKS.licenses
        ),
        pageLink("Our working commitments", "manifesto")
      ),
    ],
  }),
  memeTemplate(9, {
    id: "meme-the-institution",
    name: "The Institution",
    siteTitle: "Meridian Studies",
    family: "fund",
    description:
      "A restrained editorial collecting vehicle with a mandate, a selection, and published research.",
    presentation: style("fund", "paper", "serif", "airy"),
    accent: "#a63d35",
    pages: [
      page(
        "studio",
        "Conviction, with a record.",
        "Meridian Studies is a fictional collecting practice focused on digital culture and the context around it.",
        kicker("Mandate / Collection / Research"),
        text(
          "A durable collection needs a clear purpose, a patient method, and records that remain useful after the first decision. This site brings those elements into one public reading room.",
          "two_thirds"
        ),
        memeImage(9, "third"),
        card(
          "The mandate",
          "Support a coherent long-term collection through research, documentation, and deliberate selection."
        ),
        pageLink("Read the mandate", "mandate"),
        pageLink("Browse the research", "research"),
        memeCredit(9)
      ),
      page(
        "mandate",
        "A purpose before a portfolio.",
        "The mandate defines the questions the collection should be able to explore.",
        heading("Cultural relevance"),
        text(
          "We look for work that makes a particular moment legible while continuing to reward attention outside that moment."
        ),
        heading("Documentation"),
        text(
          "A selection begins with primary sources, reliable attribution, and a clear account of what is known and what remains uncertain."
        ),
        card(
          "Scope of this example",
          "This is a content template, with no live fund, performance record, assets under management, or investment offer."
        ),
        pageLink("A reference selection", "collection")
      ),
      page(
        "collection",
        "A reference, carefully labeled.",
        "The collection view keeps a work, its creator, and its context together.",
        memeImage(9, "half"),
        text(
          "The Institutions Are Coming by 6529er is presented here as a CC0 cultural reference. Its inclusion demonstrates a collection record; it does not assert that the example practice owns a token.",
          "half"
        ),
        card(
          "Research questions",
          "What does the image say about institutions? How does its visual language carry the joke? What changes when a work moves from a community into a collection?"
        ),
        memeCredit(9),
        pageLink("A note on method", "research")
      ),
      page(
        "research",
        "Separate the claim from the evidence.",
        "A short method note for cultural due diligence.",
        card(
          "Primary record",
          "Begin with the artist's work, the collection's source page, and the original media."
        ),
        card(
          "Interpretation",
          "Record the argument in plain language and make room for competing readings."
        ),
        card(
          "Decision history",
          "Keep the date, rationale, and any later revision. An updated view should not erase the earlier one."
        ),
        pageLink("Return to the mandate", "mandate")
      ),
    ],
  }),
  memeTemplate(37, {
    id: "meme-squadron",
    name: "Squadron",
    siteTitle: "Field Unit",
    family: "organization",
    description:
      "A community project with a mission board, a crew directory, and dispatches from the field.",
    presentation: style("organization", "stone", "mono", "compact"),
    accent: "#78662a",
    pages: [
      page(
        "studio",
        "A small crew. A shared direction.",
        "Field Unit brings researchers, makers, and collectors together around practical cultural projects.",
        kicker("Mission board / Open notebook"),
        memeImage(37, "half"),
        text(
          "We work in short expeditions: agree on a question, gather the sources, make something clear, and share what we learned. The crew changes with the project; the record stays open.",
          "half"
        ),
        card(
          "Current mission",
          "Build a concise field guide to documenting a digital artwork from its original source."
        ),
        pageLink("Meet the example crew", "crew"),
        pageLink("Read the dispatches", "field-notes"),
        memeCredit(37)
      ),
      page(
        "crew",
        "Different skills. A common brief.",
        "A sample team structure that makes responsibilities visible.",
        card(
          "Research lead / Rowan",
          "Frames the question, checks primary sources, and records uncertainty.",
          "third"
        ),
        card(
          "Design lead / Mira",
          "Turns the findings into diagrams, pages, and useful reading sequences.",
          "third"
        ),
        card(
          "Archive lead / Ellis",
          "Keeps source files, credits, decisions, and release notes together.",
          "third"
        ),
        quote(
          "Leave the next crew a map, not a mystery.",
          "Field Unit working note"
        ),
        pageLink("Follow the current mission", "field-notes")
      ),
      page(
        "field-notes",
        "Dispatch 01: start with the original.",
        "A record of the first research expedition.",
        kicker("Question / Evidence / Next step"),
        text(
          "We began with a simple question: what information helps a future reader identify a digital work? The answer quickly expanded from a title and image to source links, artist credit, media details, and the history of changes."
        ),
        card(
          "Finding",
          "The most useful record separates observable facts from the writer's interpretation."
        ),
        card(
          "Next step",
          "Test the record against a work with several versions and write down where the format becomes ambiguous."
        ),
        externalLink("Explore the collection source pages", SOURCE_LINKS.memes)
      ),
    ],
  }),
  memeTemplate(52, {
    id: "meme-the-workshop",
    name: "The Workshop",
    siteTitle: "Northline Workshop",
    family: "organization",
    description:
      "A precise professional-practice site with a monumental image, service columns, and project studies.",
    presentation: style("organization", "paper", "sans", "airy"),
    accent: "#a33c32",
    pages: [
      page(
        "studio",
        "Structures for everyday culture.",
        "Northline Workshop is a fictional practice working across spaces, publications, and digital experiences.",
        kicker("Research / Design / Delivery"),
        memeImage(52, "two_thirds"),
        text(
          "We begin with the way a place or tool will be used. Then we work toward a form that feels inevitable: clear, proportionate, and generous with attention.",
          "third"
        ),
        pageLink("How the practice works", "practice"),
        pageLink("Selected project studies", "projects"),
        memeCredit(52)
      ),
      page(
        "practice",
        "A clear brief makes room for invention.",
        "Research and delivery belong to the same conversation.",
        card(
          "01 / Understand",
          "Map the people, constraints, and decisions that shape the project.",
          "third"
        ),
        card(
          "02 / Make",
          "Prototype the smallest useful version and test it in context.",
          "third"
        ),
        card(
          "03 / Hand over",
          "Deliver the work with the documentation needed to maintain it.",
          "third"
        ),
        heading("Services"),
        text(
          "Research and strategy; editorial and visual systems; digital experience design; project documentation. Each engagement begins with a scoped brief and a named point of contact."
        ),
        pageLink("See the method in a project", "projects")
      ),
      page(
        "projects",
        "Two studies in useful form.",
        "Sample project records that keep the challenge, approach, and result distinct.",
        heading("The reading room"),
        text(
          "Challenge: a small collection needed a way to welcome first-time visitors. Approach: build a short thematic route through the archive. Result: a sequence of object records, captions, and a portable guide."
        ),
        heading("The working handbook"),
        text(
          "Challenge: a growing team needed a common reference. Approach: turn recurring decisions into concise, illustrated patterns. Result: a handbook designed to be revised by its readers."
        ),
        card(
          "A complete project record",
          "Keep the date, scope, collaborators, images, and source material beside the narrative. Replace these sample studies with your own work."
        ),
        pageLink("Return to the practice", "practice")
      ),
    ],
  }),
  memeTemplate(103, {
    id: "meme-proof",
    name: "Proof",
    siteTitle: "Proof Circle",
    family: "fund",
    description:
      "A precise research and collecting-DAO site with an explicit thesis, an evidence register, and member roles.",
    presentation: style("dao", "paper", "mono", "compact"),
    accent: "#444444",
    pages: [
      page(
        "studio",
        "Show the working.",
        "Proof Circle is a fictional collecting collective with a public thesis and a habit of keeping evidence close.",
        kicker("Question 001 / What makes a collection coherent?"),
        text(
          "A shared wallet is not a shared understanding. We use written theses, source records, and review notes to make collective judgment legible.",
          "two_thirds"
        ),
        memeImage(103, "third"),
        card("Thesis", "What we are trying to understand.", "third"),
        card("Evidence", "What supports the current view.", "third"),
        card("Review", "What could change our minds.", "third"),
        pageLink("Read the thesis", "thesis"),
        pageLink("Inspect the evidence", "evidence"),
        memeCredit(103)
      ),
      page(
        "thesis",
        "Coherence is a relationship.",
        "A collection becomes useful when the connections between its works can be explained.",
        heading("Working view"),
        text(
          "We are interested in works that reveal how digital systems shape culture: their rules, interfaces, shared symbols, and unexpected outcomes."
        ),
        heading("Selection questions"),
        text(
          "What does this work add to the conversation? Which existing work does it complicate? Are we documenting a cultural argument or merely repeating a preference?"
        ),
        card(
          "Review condition",
          "Revisit the thesis when a new work exposes a blind spot. Record the change and keep the previous version available."
        ),
        pageLink("The evidence register", "evidence")
      ),
      page(
        "evidence",
        "A claim needs a trail.",
        "A simple source register for research that other people can inspect.",
        card(
          "Artwork record",
          "Artist, title, collection page, original media, and a distinction between display permission and token ownership."
        ),
        memeCredit(103),
        card(
          "Technical context",
          "Protocol documentation gives a more reliable foundation than a repeated explanation without a source."
        ),
        externalLink("Read Ethereum's documentation", SOURCE_LINKS.ethereum),
        card(
          "Interpretive note",
          "Our reading of a work is an argument. It remains separate from the artist's stated intention unless a primary source supports that connection."
        ),
        pageLink("Who maintains the record?", "members")
      ),
      page(
        "members",
        "Responsibility should be visible.",
        "A sample operating structure for a collecting group.",
        card(
          "Research stewards",
          "Maintain source records, prepare the reading notes, and record dissent."
        ),
        card(
          "Collection stewards",
          "Maintain the inventory and document the rationale for proposed changes."
        ),
        card(
          "Community stewards",
          "Keep meetings, discussions, and published decisions accessible to members."
        ),
        text(
          "This example publishes information only. It contains no live governance, voting, trading, or investment functionality."
        ),
        pageLink("Return to the shared thesis", "thesis")
      ),
    ],
  }),
  memeTemplate(118, {
    id: "meme-common-ground",
    name: "Common Ground",
    siteTitle: "Common Room",
    family: "organization",
    description:
      "An essay-led cultural organization with a considered programme and room for several voices.",
    presentation: style("editorial", "stone", "serif", "airy"),
    accent: "#735841",
    pages: [
      page(
        "studio",
        "Culture is a conversation in progress.",
        "Common Room is a fictional cultural programme bringing images, ideas, and people into the same space.",
        memeImage(118, "half"),
        text(
          "We build programmes around questions with more than one useful answer. An artwork becomes a starting point for reading, discussion, and the careful work of seeing differently.",
          "half"
        ),
        quote(
          "Begin with attention. Make room for another account.",
          "Common Room programme note"
        ),
        pageLink("Explore the programme", "programme"),
        pageLink("Read the essays", "essays"),
        memeCredit(118)
      ),
      page(
        "programme",
        "Three ways to gather.",
        "A sample programme that moves from a work to a wider conversation.",
        card(
          "Close Looking",
          "A facilitated encounter with one work. Participants begin by describing what they can see before moving to interpretation."
        ),
        card(
          "The Reading Table",
          "A short text, a primary source, and a conversation shaped by the questions readers bring."
        ),
        card(
          "Open Notes",
          "A public record of unfinished research, including the sources and disagreements that make it useful."
        ),
        heading("Access and context"),
        text(
          "A finished event page should include dates, location or access link, cost, access information, and the people responsible. These sample formats have no scheduled events."
        ),
        pageLink("A programme essay", "essays")
      ),
      page(
        "essays",
        "An image is not a single account.",
        "A note on looking together without insisting on the same conclusion.",
        heading("Description before interpretation"),
        text(
          "The first task is modest: describe the work closely enough that another person can recognize what you mean. This gives disagreement a useful starting place."
        ),
        heading("Context without closure"),
        text(
          "An artist's process, the work's source, and its wider history can deepen a reading. They need not settle every question the image raises."
        ),
        text(
          "A good public conversation leaves its sources available and its uncertainties visible. The record should help the next reader begin."
        ),
        pageLink("Return to the programme", "programme")
      ),
    ],
  }),
];

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
import type { CmsStudioTemplate } from "./template-types";

export const ORGANIZATION_TEMPLATES: readonly CmsStudioTemplate[] = [
  defineTemplate({
    id: "company",
    name: "Company / Professional Practice",
    siteTitle: "Northline Practice",
    family: "organization",
    description:
      "A company website with services, a project case study and team introductions.",
    presentation: style("organization", "paper", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Research, design and documentation",
        "Northline Practice helps small teams organise information and build tools their colleagues can use and maintain.",
        image(
          ART.grid,
          "Night Grid — a dark grid with a bright diagonal strip."
        ),
        heading("What we do"),
        card(
          "Research",
          "Interview the people using a tool, review the existing material and identify the tasks that need work.",
          "third"
        ),
        card(
          "Product design",
          "Design search, reading and editing screens, then test the main tasks in a working prototype.",
          "third"
        ),
        card(
          "Documentation",
          "Write setup guides, content rules and handover notes for the people who will look after the result.",
          "third"
        ),
        pageLink("Our services", "services"),
        pageLink("Common Index case study", "common-index"),
        pageLink("Meet the team", "people")
      ),
      page(
        "services",
        "Services and project stages",
        "We work on internal tools, digital catalogues and small publishing sites.",
        heading("Research and scope"),
        text(
          "We begin with the existing screens and documents, then talk to the people who use them. The first deliverable is a task list, a content inventory and an agreed problem to solve."
        ),
        heading("Design and testing"),
        text(
          "We build the main task using realistic content, including long titles, missing information and error states. We review the prototype with users before preparing detailed screens."
        ),
        heading("Documentation and handover"),
        text(
          "The handover includes component designs, content rules and a decision log. We walk through the unresolved questions with the developer and the person maintaining the tool."
        ),
        pageLink("View a project example", "common-index")
      ),
      page(
        "common-index",
        "Common Index",
        "A self-directed prototype for a research team whose reading list has outgrown several shared documents.",
        kicker("Concept project · Research, design and documentation"),
        heading("The brief"),
        text(
          "Create one searchable reading library while keeping the contributor notes that explain why each article was saved."
        ),
        image(
          ART.signal,
          "Quiet Signal — overlapping blue curves and a small red accent."
        ),
        heading("The design"),
        text(
          "An entry has a title, original URL, topic and contributor note. Readers can filter the library or start with a short introductory list. The editor flags duplicate URLs before they are added."
        ),
        heading("Next test"),
        text(
          "Ask a new reader to find an unfamiliar article and a regular contributor to add one. Check whether both can complete the task without someone explaining the topic labels."
        ),
        pageLink("Meet the team", "people")
      ),
      page(
        "people",
        "The Northline team",
        "Mira handles research and documentation. Rowan handles product design and prototypes.",
        heading("Roles"),
        card(
          "Mira — Research",
          "Plans interviews, maps the existing content and turns findings into a clear task list. Writes the guides that accompany the finished tool."
        ),
        card(
          "Rowan — Design",
          "Designs the screens and builds prototypes for review. Checks layout, interaction states and the details needed for development."
        ),
        heading("Before a first meeting"),
        text(
          "Prepare a few existing screens or documents, a description of who uses them and the task causing the most difficulty. Include any deadline or technical constraint we should know about."
        ),
        pageLink("Review the services", "services")
      ),
    ],
  }),
  defineTemplate({
    id: "foundation",
    name: "Foundation / Nonprofit",
    siteTitle: "Common Ground",
    family: "organization",
    description:
      "A foundation website with programme descriptions and public documentation.",
    presentation: style("organization", "stone", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Resources for local history groups",
        "Common Ground develops practical guides and workshops for volunteers who want to record and share the history of their neighbourhood.",
        heading("What the programme covers"),
        text(
          "We focus on the work a small volunteer group needs to do: organise photographs, record interviews, check permissions and publish a catalogue that other people can search."
        ),
        image(
          ART.afterimage,
          "Afterimage — a reflective loop on an orange background.",
          "two_thirds"
        ),
        card(
          "Who it is for",
          "Local history groups, volunteer archives and people starting a neighbourhood collection with limited time and equipment.",
          "third"
        ),
        pageLink("Programme plans", "programs"),
        pageLink("How we document the work", "stewardship")
      ),
      page(
        "programs",
        "Programme plans",
        "Three proposed activities for groups preparing their first public collection.",
        heading("Programme areas"),
        card(
          "Photo catalogue",
          "A workshop on file naming, captions and source records. Participants leave with a small catalogue they can continue to maintain.",
          "third"
        ),
        card(
          "Interview notes",
          "A session on preparing questions, recording consent and keeping transcripts with the original recording.",
          "third"
        ),
        card(
          "Publishing guide",
          "A step-by-step guide to choosing material for a public page, checking permissions and explaining how to request a correction.",
          "third"
        ),
        heading("Pilot preparation"),
        text(
          "The first pilot needs a sample collection, a facilitator and a review of the consent forms. Dates and registration will be published after those items are confirmed."
        ),
        pageLink("Documentation and participation", "stewardship")
      ),
      page(
        "stewardship",
        "How the programme is run",
        "Plans, permissions and review notes are kept with each programme record.",
        heading("Programme records"),
        text(
          "Each activity has an outline, a list of materials and a note of what changed after review. Reports distinguish planned sessions from sessions that have taken place."
        ),
        heading("Taking part"),
        text(
          "Each session description states the expected experience, equipment and time commitment. Participants can choose whether their material appears in the public catalogue."
        ),
        heading("Reuse permissions"),
        text(
          "Contributors choose what can be shared. The catalogue records the permission for each item and retains the original credit when it is reused."
        ),
        externalLink("Creative Commons license guide", SOURCE_LINKS.licenses),
        pageLink("Back to Common Ground", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "protocol",
    name: "Protocol / Crypto Organization",
    siteTitle: "Open Current",
    family: "organization",
    description:
      "A technical project website with use cases, design notes and documentation links.",
    presentation: style("organization", "night", "mono", "compact"),
    pages: [
      page(
        "studio",
        "Open Current",
        "A project to define an export format for shared reading lists and small digital catalogues.",
        kicker("Project proposal · Data format and import tools"),
        heading("Move a catalogue between tools"),
        text(
          "The proposal separates the catalogue data from the interface used to edit it. A contributor should be able to export entries, notes and source links without rebuilding the list by hand."
        ),
        heading("Design requirements"),
        card(
          "Documented fields",
          "Publish the field names, supported values and a complete example file so another tool can read the catalogue.",
          "third"
        ),
        card(
          "Contributor access",
          "Separate permission to read, add entries and edit other people's notes. Make the current permissions visible to the owner.",
          "third"
        ),
        card(
          "Import reports",
          "Report missing fields and unsupported values before an import changes the catalogue.",
          "third"
        ),
        pageLink("Use cases", "use-cases"),
        pageLink("Technical references", "resources")
      ),
      page(
        "use-cases",
        "Two catalogue use cases",
        "A shared research library and an artist's file index have similar data needs but different access rules.",
        heading("Research library"),
        text(
          "Store an article's title, URL, topics and contributor note. Export the entries with their stable identifiers so edits can be matched during a later import."
        ),
        heading("Artwork file index"),
        text(
          "Keep a work's title, image files, credits and permissions together. Let the owner choose which entries and fields appear in a public catalogue."
        ),
        heading("Current scope"),
        text(
          "The proposal covers the file format and validation rules. Hosting, storage availability and user authentication still need separate implementations."
        ),
        pageLink("Technical references", "resources")
      ),
      page(
        "resources",
        "Reading for the design",
        "Background documentation for accounts, permissions and content addressing.",
        heading("Accounts and applications"),
        externalLink("Ethereum developer documentation", SOURCE_LINKS.ethereum),
        text(
          "The account and transaction documentation is useful when considering who can authorise changes to a record."
        ),
        heading("Content identifiers"),
        externalLink("IPFS documentation", SOURCE_LINKS.ipfs),
        text(
          "Content identifiers can help distinguish one file version from another. Keeping the referenced file available is a separate requirement."
        ),
        heading("Next design review"),
        text(
          "Review a complete sample export, an invalid file and a changed entry. Decide how the importer should report each case before building the editing interface."
        ),
        pageLink("Back to Open Current", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "nft-project",
    name: "NFT Project",
    siteTitle: "Signal Garden",
    family: "organization",
    description:
      "A digital art project website with a series, project story and source notes.",
    presentation: style("gallery", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Signal Garden",
        "A digital image project organised around three settings: blue curves, an orange loop and a grid of lights.",
        image(ART.signal, "Quiet Signal — overlapping blue curves on cream."),
        heading("The first image set"),
        text(
          "The project starts with three images and a short note for each. The series page keeps them together; the project notes explain where the images came from."
        ),
        pageLink("View the series", "series"),
        pageLink("Project story", "story"),
        pageLink("Credits and project notes", "notes")
      ),
      page(
        "series",
        "The first three images",
        "Quiet Signal, Afterimage and Night Grid form the project's initial visual reference set.",
        gallery("Signal Garden image set", [
          ART.signal,
          ART.afterimage,
          ART.grid,
        ]),
        heading("How the set is arranged"),
        text(
          "Quiet Signal introduces the fine lines. Afterimage changes to a single reflective loop and a bright orange background. Night Grid closes the set with dark cells and small lights."
        ),
        pageLink("Project story", "story")
      ),
      page(
        "story",
        "Building Signal Garden",
        "The project uses three image settings as the basis for a small online art catalogue.",
        text(
          "Each setting gets an image, a title and a short description. The next set will develop the blue curves into a group of winding paths, using the same cream background across the series.\n\nBefore starting those images, I am preparing the individual reference records and comparing the three compositions side by side. There is no token release attached to this sample site."
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("Credits and project notes", "notes")
      ),
      page(
        "notes",
        "Credits and project notes",
        "Image sources and a collection reference used while planning the catalogue.",
        heading("Image sources"),
        text(
          "Quiet Signal, Afterimage and Night Grid were generated for the 6529 template library. The asset records retain their source and rights information."
        ),
        heading("Collection reference"),
        text(
          "The Memes is a separate collection with individual card pages and artist credits. It is a useful reference for presenting a series as both a whole and a set of individual works."
        ),
        externalLink("Browse The Memes", SOURCE_LINKS.memes),
        pageLink("Back to Signal Garden", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "investment-fund",
    name: "Investment Fund",
    siteTitle: "Meridian Research",
    family: "fund",
    description:
      "A fund website with a mandate, research process and clearly labelled project coverage.",
    presentation: style("fund", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Research on digital infrastructure",
        "Meridian Research studies software for storing, finding and publishing shared information.",
        kicker("Mandate · Research process · Project coverage"),
        heading("Research mandate"),
        text(
          "We focus on tools with a defined user need, understandable operating costs and a credible maintenance plan. Our reviews examine the product, its dependencies and how the team makes decisions."
        ),
        quote(
          "Every memo needs a section on what would make us stop pursuing the idea.",
          "Meridian research checklist"
        ),
        pageLink("Research process", "approach"),
        pageLink("Projects under review", "portfolio"),
        pageLink("Read the maintenance note", "research")
      ),
      page(
        "approach",
        "Research process",
        "The same review structure is used for each project: users, product, operating costs and risks.",
        heading("Understand the task"),
        text(
          "Identify who uses the product and what they would use without it. Test the main task and record which parts depend on another service."
        ),
        heading("Review the operating model"),
        text(
          "Check who pays for storage, support and ongoing development. Review how prices or usage could change those costs and who is responsible for responding."
        ),
        heading("Document the decision"),
        text(
          "Keep the sources, assumptions and unanswered questions with the memo. Record the review date and the conditions that would require a new assessment."
        ),
        pageLink("Read the maintenance note", "research")
      ),
      page(
        "portfolio",
        "Projects under review",
        "Two concept projects used to illustrate the research process. These entries are research subjects, not portfolio holdings.",
        heading("Current coverage"),
        card(
          "Common Index",
          "A shared reading-library concept. Review topic: duplicate entries, search quality and the work required to maintain the catalogue."
        ),
        card(
          "Open Current",
          "A catalogue export-format proposal. Review topic: whether a second tool can import the data without losing fields or source links."
        ),
        heading("Relationship labels"),
        text(
          "Project coverage is labelled separately from any investment or commercial relationship. A completed research memo does not establish either one."
        ),
        pageLink("Research process", "approach")
      ),
      page(
        "research",
        "Who maintains the service?",
        "A research note on the recurring work behind a shared digital catalogue.",
        kicker("Research note · Maintenance and dependencies"),
        text(
          "A catalogue needs more than storage. Someone must review duplicate entries, repair imports and respond when a source link stops working. Those tasks should appear in the operating plan.\n\nOur review asks for a named owner for each task, a way to restore the data and a record of the outside services involved. We also test whether an export can be opened without the original interface."
        ),
        heading("Questions for the next review"),
        text(
          "What is the cost per active catalogue? How is a failed import recovered? Can another operator restore the service from the documented files and instructions?"
        ),
        pageLink("Back to the mandate", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "collecting-dao",
    name: "Collecting DAO",
    siteTitle: "Afterlight Collective",
    family: "fund",
    description:
      "A collecting group website with a selection, collecting criteria and member roles.",
    presentation: style("dao", "stone", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Afterlight Collective",
        "A group that reviews digital art together and keeps a shared record of its selections and decisions.",
        image(ART.afterimage, "Afterimage — a reflective loop on orange."),
        heading("What we look at"),
        text(
          "Our first selection compares images built from repeated lines, a single large form and a grid of lights. Members prepare a short note before discussing an addition."
        ),
        pageLink("Collecting criteria", "thesis"),
        pageLink("View the selection", "selection"),
        pageLink("Roles and decisions", "collective")
      ),
      page(
        "thesis",
        "Collecting criteria",
        "We look at the work first, then check the artist or source record, file details and terms of any proposed acquisition.",
        heading("Reasons for a proposal"),
        text(
          "A member's note should explain what they see in the work and why it belongs beside the existing selection. A different medium or composition can be a reason to include it."
        ),
        heading("Acquisition records"),
        text(
          "A completed acquisition record needs the work identity, transaction or transfer reference, date and approved decision. Display selections are recorded separately from custody."
        ),
        quote(
          "Bring the original work link and a short written reason for the proposal.",
          "Member proposal checklist"
        ),
        pageLink("View the selection", "selection")
      ),
      page(
        "selection",
        "The current display selection",
        "Three images for discussion: Afterimage, Quiet Signal and Night Grid.",
        gallery(
          "Afterlight selection",
          [ART.afterimage, ART.signal, ART.grid],
          "editorial"
        ),
        heading("Notes on the order"),
        text(
          "Afterimage starts with a large reflective form. Quiet Signal follows with fine blue curves, then Night Grid adds small lights and dark rectangular gaps. The page keeps the different image shapes intact."
        ),
        pageLink("Roles and decisions", "collective")
      ),
      page(
        "collective",
        "How the group works",
        "Members divide proposal preparation, source checking and record keeping.",
        heading("Working roles"),
        card(
          "Selection review",
          "Prepare the work links and written reasons for a proposal. Collect questions before the discussion so members can check the same sources."
        ),
        card(
          "Record keeping",
          "Record the decision, relevant links and any follow-up task. Keep the display list separate from acquisition and custody records."
        ),
        heading("Decision records"),
        text(
          "A proposal needs a stated scope, the people responsible for reviewing it and a final decision record. A discussion page does not authorise a treasury transaction."
        ),
        heading("Public member details"),
        text(
          "Members choose whether their name and role appear on the public site. Meeting notes use role names when a member has not chosen public attribution."
        ),
        pageLink("Back to the collective", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "institutional-collection",
    name: "Institutional Collection",
    siteTitle: "Field Archive",
    family: "organization",
    description:
      "A collection website with highlights, an online exhibition and preservation notes.",
    presentation: style("editorial", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Field Archive",
        "A digital image catalogue with work descriptions, source records and notes on keeping the files accessible.",
        image(ART.signal, ART_CAPTIONS.signal),
        heading("Browse the images and their records"),
        text(
          "The archive has three sample images. Each entry keeps the full composition, a short description and the source information needed to identify the file."
        ),
        pageLink("Collection highlights", "highlights"),
        pageLink("Online exhibition", "exhibition"),
        pageLink("Preservation and research", "stewardship")
      ),
      page(
        "highlights",
        "Collection highlights",
        "Quiet Signal, Afterimage and Night Grid, with their titles and source records.",
        gallery(
          "Collection highlights",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("Quiet Signal: catalogue note"),
        text(
          "Quiet Signal is a landscape PNG showing fine blue curves on cream, with a red cluster at the lower-right edge. Its record links the displayed file to the original template-library asset and retains the file's dimensions, checksum and rights statement."
        ),
        pageLink("View the online exhibition", "exhibition")
      ),
      page(
        "exhibition",
        "Lines, loops and lights",
        "An online selection comparing fine curves, a reflective form and a dense grid.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        text(
          "Quiet Signal's blue lines overlap in broad bands. Afterimage has a large loop against orange. Night Grid uses a much darker field of small illuminated cells. The exhibition presents each at its original proportions.",
          "third"
        ),
        image(ART.grid, ART_CAPTIONS.grid),
        heading("About the selection"),
        text(
          "The grouping is based on visible differences between the three images. They were generated for the 6529 template library and are presented here as an online sample exhibition."
        ),
        pageLink("Preservation and research", "stewardship")
      ),
      page(
        "stewardship",
        "Keeping the catalogue usable",
        "The archive record includes the source file, its permissions and the information needed to check it later.",
        heading("Source records"),
        text(
          "Keep the original source link and a copy of the supplied description. Label editorial observations separately so they are not mistaken for the artist's words."
        ),
        heading("Files and permissions"),
        text(
          "Record the file type, dimensions and checksum for each representation. Keep the rights statement with the file so an exported catalogue does not lose it."
        ),
        heading("Availability checks"),
        text(
          "Check that the public file can still be retrieved and that its checksum matches the record. Keep a documented recovery copy rather than relying on one public URL."
        ),
        externalLink("Creative Commons license guide", SOURCE_LINKS.licenses),
        pageLink("Back to Field Archive", "studio")
      ),
    ],
  }),
];

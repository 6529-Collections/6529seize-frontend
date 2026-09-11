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
      "A creative organization site for publications, workshops and current projects.",
    presentation: style("organization", "paper", "sans", "compact"),
    accent: "#bd3826",
    pages: [
      page(
        "studio",
        "Common Press",
        "A publishing collective making zines, running workshops and sharing source files.",
        kicker("Publications / Workshops / Downloads"),
        memeImage(2, "third"),
        text(
          "We work on small publications about digital art and the people making it. Some projects become printed zines; others stay online as interviews, guides or workshop notes.",
          "two_thirds"
        ),
        card(
          "01 / Publish",
          "Artist interviews, short essays and illustrated guides.",
          "third"
        ),
        card(
          "02 / Meet",
          "Workshops where people can try making something together.",
          "third"
        ),
        card(
          "03 / Share",
          "Downloads of the files and notes used in each project.",
          "third"
        ),
        pageLink("How we work", "manifesto"),
        pageLink("Browse the projects", "projects"),
        memeCredit(2)
      ),
      page(
        "manifesto",
        "How we work",
        "Our guidelines for contributors, editing and sharing work.",
        heading("Start with the reader"),
        text(
          "Before we commission a piece, we decide who it is for and what they should get from reading it."
        ),
        heading("Work with the contributors"),
        text(
          "Contributors check the edited text and image choices before publication. We agree on payment and permissions at the start."
        ),
        heading("Give clear credit"),
        text(
          "Every piece includes the writer, artist and relevant source links. Reused material carries its credit too."
        ),
        card(
          "Keep downloads available",
          "Each project page holds the final publication and any files we have permission to share."
        ),
        pageLink("See the projects", "projects")
      ),
      page(
        "projects",
        "Projects",
        "A zine in development, a workshop plan and a set of printing resources.",
        card(
          "The Common Reader",
          "A zine in development, built around three artist interviews. We’re drafting the questions and testing an eight-page layout."
        ),
        card(
          "Open Table",
          "A workshop we’re preparing: bring a sketchbook, make a one-page zine and swap copies at the end. We’re testing the folding instructions before setting a date."
        ),
        card(
          "The Zine Folder",
          "A resource pack in progress with page sizes, folding instructions and a print checklist. The first task is checking the folds on an ordinary home printer."
        ),
        externalLink(
          "Read about Creative Commons licenses",
          SOURCE_LINKS.licenses
        ),
        pageLink("Back to how we work", "manifesto")
      ),
    ],
  }),
  memeTemplate(9, {
    id: "meme-the-institution",
    name: "The Institution",
    siteTitle: "Meridian Studies",
    family: "fund",
    description:
      "A collecting organization site with a mandate, featured artwork and research notes.",
    presentation: style("fund", "paper", "serif", "airy"),
    accent: "#a63d35",
    pages: [
      page(
        "studio",
        "Meridian Studies",
        "Research and collection planning for digital art.",
        kicker("Mandate / Collection / Research"),
        text(
          "We’re developing a collection around digital artwork and online communities. The first stage is research: setting the scope, recording sources and writing proposals before making any acquisitions.",
          "two_thirds"
        ),
        memeImage(9, "third"),
        card(
          "Collection focus",
          "Digital artwork, with an emphasis on artist-led projects and work made for online audiences."
        ),
        pageLink("Read the mandate", "mandate"),
        pageLink("Read the research notes", "research"),
        memeCredit(9)
      ),
      page(
        "mandate",
        "Collection mandate",
        "Our collection focus and the information required for a proposal.",
        heading("What we look at"),
        text(
          "We begin with the artist’s wider body of work, then look at how the proposed piece fits the collection."
        ),
        heading("What we record"),
        text(
          "Each review includes the title, artist, source files, edition information and a written reason for the proposed addition."
        ),
        card(
          "About this example",
          "Meridian Studies is fictional. These pages show a site format, with no actual holdings, fund performance or investment offer."
        ),
        pageLink("View the research selection", "collection")
      ),
      page(
        "collection",
        "Research selection",
        "The Institutions Are Coming by 6529er.",
        memeImage(9, "half"),
        text(
          "The Institutions Are Coming by 6529er is on our research list. It is shown as a credited CC0 reference, not a holding of Meridian Studies.",
          "half"
        ),
        card(
          "Review notes",
          "Our first note asks how this card fits alongside the earlier works by 6529er in The Memes. Next we’ll compare those cards and read the collection’s own introduction."
        ),
        memeCredit(9),
        pageLink("How we research a work", "research")
      ),
      page(
        "research",
        "Research notes",
        "The first research record, with follow-up tasks still open.",
        card(
          "Artwork details",
          "The Institutions Are Coming. Artist: 6529er. Collection: The Memes, card #9. The credited collection link is kept with the image."
        ),
        card(
          "Artist background",
          "Next task: compare card #9 with 6529er’s earlier Memes and look for the artist’s own notes about the work."
        ),
        card(
          "Decision record",
          "Status: research in progress. No acquisition proposed. The review stays open until the source notes are complete."
        ),
        pageLink("Back to the mandate", "mandate")
      ),
    ],
  }),
  memeTemplate(37, {
    id: "meme-squadron",
    name: "Squadron",
    siteTitle: "Field Unit",
    family: "organization",
    description:
      "A community project site with a team page, current tasks and progress updates.",
    presentation: style("organization", "stone", "mono", "compact"),
    accent: "#78662a",
    pages: [
      page(
        "studio",
        "Field Unit",
        "A volunteer group working on a guide to digital art.",
        kicker("Current project / Team / Updates"),
        memeImage(37, "half"),
        text(
          "We’re putting together a short guide for people who are new to collecting digital art. The first version will cover artist credits, collection pages and the information attached to a token.",
          "half"
        ),
        card(
          "This month’s task",
          "Write three example artwork records and check whether a new reader can follow the source links."
        ),
        pageLink("Meet the team", "crew"),
        pageLink("Read project updates", "field-notes"),
        memeCredit(37)
      ),
      page(
        "crew",
        "The team",
        "Who is working on the first edition of the guide.",
        card(
          "Rowan / Research",
          "Finds the source material and checks artwork details.",
          "third"
        ),
        card(
          "Mira / Design",
          "Lays out the guide and tests whether the pages are easy to read.",
          "third"
        ),
        card(
          "Ellis / Editing",
          "Edits the text and keeps track of corrections.",
          "third"
        ),
        quote(
          "Please put the source link beside the note so I can check it.",
          "Ellis, on the draft guide"
        ),
        pageLink("Read the latest update", "field-notes")
      ),
      page(
        "field-notes",
        "Update 01: the first draft",
        "What is drafted, what needs checking and what we’re doing next.",
        kicker("Drafted / To check / Next"),
        text(
          "The first artwork record is drafted. We have the title, artist and collection link. Next, someone who hasn’t worked on the guide will try to follow it and tell us what is missing."
        ),
        card(
          "To check",
          "Does the guide explain the difference between an artwork image and the token record?"
        ),
        card(
          "Next task",
          "Add a second example from a different collection and compare the information available."
        ),
        externalLink("Browse The Memes collection pages", SOURCE_LINKS.memes)
      ),
    ],
  }),
  memeTemplate(52, {
    id: "meme-the-workshop",
    name: "The Workshop",
    siteTitle: "Northline Workshop",
    family: "organization",
    description:
      "A professional studio site for services, working methods and project case studies.",
    presentation: style("organization", "paper", "sans", "airy"),
    accent: "#a33c32",
    pages: [
      page(
        "studio",
        "Northline Workshop",
        "Websites, publications and exhibition materials for small teams.",
        kicker("Websites / Publications / Exhibitions"),
        memeImage(52, "two_thirds"),
        text(
          "We help small teams put their work online and in print. A project might be a new website, an exhibition guide or a set of materials that need to work together.",
          "third"
        ),
        pageLink("How we work", "practice"),
        pageLink("View current projects", "projects"),
        memeCredit(52)
      ),
      page(
        "practice",
        "Working with us",
        "What a project looks like from the first conversation to handover.",
        card(
          "01 / Agree the brief",
          "We discuss the audience, required content, budget and schedule.",
          "third"
        ),
        card(
          "02 / Design and test",
          "We make a first version, review it with you and check it with the people who will use it.",
          "third"
        ),
        card(
          "03 / Hand over",
          "You receive the finished files and a guide to updating them.",
          "third"
        ),
        heading("Services"),
        text(
          "Website design, publication layout, exhibition graphics and project documentation. We agree the scope and a point of contact before work starts."
        ),
        pageLink("View current projects", "projects")
      ),
      page(
        "projects",
        "Projects in development",
        "An exhibition guide and a handbook, both at the first-draft stage.",
        heading("Exhibition guide"),
        text(
          "We’re developing a folded guide for a small exhibition: an introduction on the front, artwork captions inside and a map on the back. The first paper mockup is ready for a print test."
        ),
        heading("Team handbook"),
        text(
          "The handbook starts with the questions a new team member asks in their first week. We’ve drafted the team directory and file guide; the next section covers common production tasks."
        ),
        card(
          "This week in the studio",
          "Print the exhibition guide at its final size, check the captions and shorten the map labels. Then finish the handbook’s first-week checklist."
        ),
        pageLink("Back to our services", "practice")
      ),
    ],
  }),
  memeTemplate(103, {
    id: "meme-proof",
    name: "Proof",
    siteTitle: "Proof Circle",
    family: "fund",
    description:
      "A collecting DAO site for its collection policy, research records and member responsibilities.",
    presentation: style("dao", "paper", "mono", "compact"),
    accent: "#444444",
    pages: [
      page(
        "studio",
        "Proof Circle",
        "A collecting group developing its policy and first research list.",
        kicker("Collection policy / Research / Members"),
        text(
          "Members bring artwork suggestions to a shared research list. We’re starting with the collection policy and source records; acquisition decisions will come after that work is complete.",
          "two_thirds"
        ),
        memeImage(103, "third"),
        card(
          "Collection policy",
          "What the group is interested in collecting.",
          "third"
        ),
        card(
          "Research",
          "The artwork details and sources behind a proposal.",
          "third"
        ),
        card(
          "Member review",
          "Who checks the proposal and records the decision.",
          "third"
        ),
        pageLink("Read the collection policy", "thesis"),
        pageLink("Read the research notes", "evidence"),
        memeCredit(103)
      ),
      page(
        "thesis",
        "Collection policy",
        "What we want to collect and how a suggestion becomes a proposal.",
        heading("Areas of interest"),
        text(
          "Digital artwork, generative projects and images associated with online communities."
        ),
        heading("Before a proposal"),
        text(
          "The proposing member checks the artist, token and edition details, then writes a short account of what the work would add to the collection."
        ),
        card(
          "Changing the policy",
          "Members can propose a change in writing. The group keeps each agreed version with its effective date and the reason for the change."
        ),
        pageLink("Read the research notes", "evidence")
      ),
      page(
        "evidence",
        "Research records",
        "First reading note: Don’t Trust, Check. by Jack Butcher.",
        card(
          "Artwork details",
          "Don’t Trust, Check. by Jack Butcher. The Memes, card #103. A credited reference for this reading note; the group does not claim to own a token."
        ),
        memeCredit(103),
        card(
          "Technical details",
          "The next task is to read the token record alongside the collection page. We’re keeping technical questions in a separate note, with the Ethereum documentation linked below."
        ),
        externalLink("Read Ethereum documentation", SOURCE_LINKS.ethereum),
        card(
          "Next discussion",
          "We’ll discuss how members should check the information in a proposal before making a decision. This is a reading session, with no acquisition vote scheduled."
        ),
        pageLink("See member responsibilities", "members")
      ),
      page(
        "members",
        "Member responsibilities",
        "Who prepares the research, keeps the records and organizes discussions.",
        card(
          "Research",
          "Prepares artwork records and checks the source links before a proposal is discussed."
        ),
        card(
          "Collection records",
          "Keeps the inventory and adds the group’s decisions to each record."
        ),
        card(
          "Member coordination",
          "Schedules discussions, shares meeting notes and keeps members informed about decisions."
        ),
        text(
          "Proof Circle is fictional. This example has no treasury, live voting or investment activity."
        ),
        pageLink("Back to the collection policy", "thesis")
      ),
    ],
  }),
  memeTemplate(118, {
    id: "meme-common-ground",
    name: "Common Ground",
    siteTitle: "Common Room",
    family: "organization",
    description:
      "A cultural organization site for events, reading groups and short articles.",
    presentation: style("editorial", "stone", "serif", "airy"),
    accent: "#735841",
    pages: [
      page(
        "studio",
        "Common Room",
        "Small talks, reading sessions and workshops about art.",
        memeImage(118, "half"),
        text(
          "Our programme brings people together to look at art and discuss it. Sessions start with a work or a short text, so you can join without doing a week of preparation.",
          "half"
        ),
        quote(
          "You don’t need to have read everything to take part.",
          "The Common Room welcome"
        ),
        pageLink("View the programme", "programme"),
        pageLink("Read the articles", "essays"),
        memeCredit(118)
      ),
      page(
        "programme",
        "The programme",
        "Three sessions we’re preparing for the opening programme.",
        card(
          "One Artwork",
          "A short session about one work. The host introduces it, then opens the discussion to the group."
        ),
        card(
          "Reading Group",
          "One article shared in advance, with a few questions to get the discussion started."
        ),
        card(
          "Open Studio",
          "An artist shows work in progress and talks through the materials and decisions involved."
        ),
        heading("Planning a visit"),
        text(
          "We’re still arranging dates and a venue for these sessions. Booking is not open yet. We’ll post the schedule and access information here once those details are confirmed."
        ),
        pageLink("Read about our discussion format", "essays")
      ),
      page(
        "essays",
        "Talking about a work together",
        "How we plan to run the One Artwork sessions.",
        heading("Start with the image"),
        text(
          "We put the artwork where everyone can see it and give people a few minutes before the discussion starts. The first question is simply what they noticed."
        ),
        heading("Bring in the background"),
        text(
          "The host then shares the artist’s name, the work’s title and any project notes. These give the group more to discuss."
        ),
        text(
          "After the session, we share the artwork link and anything the group wanted to read next."
        ),
        pageLink("Back to the programme", "programme")
      ),
    ],
  }),
];

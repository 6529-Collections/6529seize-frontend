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
      "A service-oriented organization with selected work, a clear offer, and a human team.",
    presentation: style("organization", "paper", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Good questions. Useful outcomes.",
        "Northline Practice is a fictional independent team working across research, design, and clear communication.",
        image(
          ART.grid,
          "Original example visual study for the Northline Practice demonstration."
        ),
        heading("From an uncertain brief to a useful direction"),
        card(
          "Research",
          "Understand the people, material, and constraints around a real question.",
          "third"
        ),
        card(
          "Design",
          "Turn a direction into a concrete example that people can discuss and use.",
          "third"
        ),
        card(
          "Communication",
          "Make the result understandable to the people who need it.",
          "third"
        ),
        pageLink("Explore our services", "services"),
        pageLink("Read a case study", "common-index"),
        pageLink("Meet the example team", "people")
      ),
      page(
        "services",
        "A small team, a considered process.",
        "The demonstration practice offers a connected sequence of research, prototyping, and editorial work.",
        heading("Understanding the brief"),
        text(
          "We begin by reading what already exists and speaking with the people closest to the problem. The result is a clear question and a set of constraints worth testing."
        ),
        heading("Making the direction visible"),
        text(
          "A prototype, a draft narrative, or a small working system makes abstract disagreements easier to resolve. Review happens around something concrete."
        ),
        heading("Preparing the handover"),
        text(
          "The final work includes the context needed to maintain it: decisions, source material, and an understandable operating model."
        ),
        pageLink("See the approach in a case study", "common-index")
      ),
      page(
        "common-index",
        "Common Index: a shared reference shelf.",
        "A fictional concept project showing how the practice explains a problem, contribution, and outcome without invented client metrics.",
        kicker("Concept study · Research / Product / Editorial"),
        heading("The brief"),
        text(
          "Design a small research library that a new contributor can understand without an oral history of every link."
        ),
        image(ART.signal, "Original example artwork used as a visual study."),
        heading("The decision"),
        text(
          "Separate the source from the annotation. Give every item a reason for inclusion and a visible place in a short reading path."
        ),
        heading("The next step"),
        text(
          "Test the vocabulary with actual readers before making claims about adoption, time saved, or commercial outcomes."
        ),
        pageLink("Meet the team", "people")
      ),
      page(
        "people",
        "People make the practice.",
        "A fictional team used to demonstrate roles and collaboration without borrowing anyone's real biography.",
        heading("The example team"),
        card(
          "Mira — Research",
          "Connects close reading with practical questions and carefully documented sources."
        ),
        card(
          "Rowan — Design",
          "Turns a direction into clear visual systems and testable prototypes."
        ),
        heading("Starting a conversation"),
        text(
          "A useful project introduction describes the question, the people it affects, and the constraints. An actual organization can add its verified contact destination here."
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
      "A mission-led home for programs, people, public-interest work, and transparent documentation.",
    presentation: style("organization", "stone", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Common ground begins with access.",
        "Common Ground is a fictional foundation exploring how people can understand and contribute to shared cultural resources.",
        heading("A mission made concrete"),
        text(
          "A public resource becomes useful when someone can find it, understand it, and see how to participate. Our demonstration programs focus on those three steps."
        ),
        image(
          ART.afterimage,
          "Original example artwork for the foundation demonstration.",
          "two_thirds"
        ),
        card(
          "The starting point",
          "Clear context, accessible materials, and a realistic invitation to participate.",
          "third"
        ),
        pageLink("Explore the programs", "programs"),
        pageLink("Read the stewardship approach", "stewardship")
      ),
      page(
        "programs",
        "Three ways to make room.",
        "Illustrative program descriptions, without invented beneficiaries, funding totals, or impact statistics.",
        heading("Program areas"),
        card(
          "The open shelf",
          "A proposed reading space pairing primary sources with concise, accessible introductions.",
          "third"
        ),
        card(
          "Local notes",
          "A proposed workshop format for recording the knowledge people already hold about a place.",
          "third"
        ),
        card(
          "Shared tools",
          "A proposed guide to documenting and maintaining small public resources.",
          "third"
        ),
        heading("From intention to evidence"),
        text(
          "An actual program page can add supplied dates, partners, outcomes, and reports. Distinguish what is proposed from what has happened."
        ),
        pageLink("How the record is kept", "stewardship")
      ),
      page(
        "stewardship",
        "Be clear about the work.",
        "An example statement about public accountability and care for shared resources.",
        heading("Documentation"),
        text(
          "Keep decisions and source material close to the public explanation. A useful report makes the scope and limits of its claims understandable."
        ),
        heading("Participation"),
        text(
          "Describe who a program is for and what participation involves. Add a support or application link only when an authentic destination exists."
        ),
        heading("Shared permissions"),
        text(
          "Use explicit permissions for material intended to be reused, and retain attribution and context."
        ),
        externalLink(
          "Explore Creative Commons licensing",
          SOURCE_LINKS.licenses
        ),
        pageLink("Return to the mission", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "protocol",
    name: "Protocol / Crypto Organization",
    siteTitle: "Open Current",
    family: "organization",
    description:
      "An approachable technical home for use cases, ecosystem context, and primary documentation.",
    presentation: style("organization", "night", "mono", "compact"),
    pages: [
      page(
        "studio",
        "Open Current.",
        "A fictional infrastructure project exploring clear interfaces for shared digital resources.",
        kicker("An open-source concept · No deployed protocol claimed"),
        heading("Make the boundary understandable"),
        text(
          "A useful interface tells people what they can verify, what depends on a service, and how to carry their work elsewhere."
        ),
        heading("Project areas"),
        card(
          "Portable records",
          "Keep data formats documented and independent of one interface.",
          "third"
        ),
        card(
          "Clear permissions",
          "Make access and revocation understandable to the person granting them.",
          "third"
        ),
        card(
          "Public references",
          "Keep primary documentation alongside technical claims.",
          "third"
        ),
        pageLink("Explore the use cases", "use-cases"),
        pageLink("Open the documentation shelf", "resources")
      ),
      page(
        "use-cases",
        "Start with a real task.",
        "Illustrative use cases for the fictional Open Current project.",
        heading("A shared research collection"),
        text(
          "Contributors add sources and annotations while retaining the context that makes each item useful. The data can be exported in a documented format."
        ),
        heading("A portable creative record"),
        text(
          "A maker describes a work, its representations, and the permissions attached to each one. A public view selects only the material intended for disclosure."
        ),
        heading("Explicit limits"),
        text(
          "These are concept descriptions. No production uptime, audit, adoption, security guarantee, or integration partnership is claimed."
        ),
        pageLink("Read the source material", "resources")
      ),
      page(
        "resources",
        "Primary documentation first.",
        "Real public references behind the example's technical interests; these are not documentation for a deployed Open Current service.",
        heading("Applications and accounts"),
        externalLink("Ethereum developer documentation", SOURCE_LINKS.ethereum),
        text(
          "A starting point for understanding the network's application model."
        ),
        heading("Content addressing"),
        externalLink("IPFS documentation", SOURCE_LINKS.ipfs),
        text(
          "A starting point for understanding references based on content rather than one server location."
        ),
        heading("Project updates"),
        text(
          "An actual project can publish dated release notes and link its genuine repository, app, and governance destinations here."
        ),
        pageLink("Return to the project", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "nft-project",
    name: "NFT Project",
    siteTitle: "Signal Garden",
    family: "organization",
    description:
      "A creative world with series, contributor context, project notes, and honest external links.",
    presentation: style("gallery", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Signal Garden.",
        "A fictional digital art project about patterns that grow, repeat, and find their own interruptions.",
        image(
          ART.signal,
          "Original example artwork; no Signal Garden token is offered or asserted."
        ),
        heading("Enter the garden"),
        text(
          "Three image studies establish the project's visual vocabulary. A short story and a clear record give that vocabulary somewhere to grow."
        ),
        pageLink("View the example series", "series"),
        pageLink("Read the project story", "story"),
        pageLink("Project notes and sources", "notes")
      ),
      page(
        "series",
        "A small world in three images.",
        "Example collection imagery with no invented token contract, holder count, sale history, or utility.",
        gallery("Signal studies", [ART.signal, ART.afterimage, ART.grid]),
        heading("Series note"),
        text(
          "A line carries across the first image, becomes an impression in the second, and gathers into a rhythm in the third. The sequence is the beginning of a world, not a roadmap promise."
        ),
        pageLink("Read the story", "story")
      ),
      page(
        "story",
        "A garden is a system that changes.",
        "An example project narrative built around a small visual idea.",
        text(
          "Signal Garden begins with repeated forms and the variation that appears between them. Its fictional world is built through images and short notes rather than a list of promised utilities.\n\nA real project can add the people, source material, and decisions that explain how its world came into being."
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("Open the project notes", "notes")
      ),
      page(
        "notes",
        "Keep the context with the work.",
        "A place for actual contributor credits, collection references, and dated updates as they are supplied.",
        heading("Example asset credits"),
        text(
          "The imagery in this demonstration was generated for the 6529 template library. It is not a collection minted by the profile using this design."
        ),
        heading("A real collection to explore"),
        text(
          "The Memes is a separate existing collection on 6529. This reference is for discovery, not an affiliation claim."
        ),
        externalLink("Explore The Memes", SOURCE_LINKS.memes),
        pageLink("Return to Signal Garden", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "investment-fund",
    name: "Investment Fund",
    siteTitle: "Meridian Research",
    family: "fund",
    description:
      "A restrained mandate, considered approach, clearly described relationships, and readable research.",
    presentation: style("fund", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "A long view of open systems.",
        "Meridian Research Fund is a fictional organization used to demonstrate a clear mandate and a research-led public presence.",
        kicker("Mandate / Approach / Research"),
        heading("Understand what can endure"),
        text(
          "The example mandate focuses on the relationship between useful infrastructure, patient development, and the communities that maintain it."
        ),
        quote(
          "Clarity about a thesis includes clarity about what would change it.",
          "Example research principle"
        ),
        pageLink("Read the approach", "approach"),
        pageLink("View example relationships", "portfolio"),
        pageLink("Read the research note", "research")
      ),
      page(
        "approach",
        "A thesis with visible assumptions.",
        "An illustrative research approach, not a claim of fund performance, investment advice, or a solicitation.",
        heading("Understand the system"),
        text(
          "Begin with the underlying task, the participants, and the dependencies. Separate direct observations from interpretations."
        ),
        heading("Study the incentives"),
        text(
          "Ask who maintains the resource, who benefits from it, and how those relationships may change over time."
        ),
        heading("Keep a revisable record"),
        text(
          "A dated research note should preserve its assumptions and identify evidence that would require a different conclusion."
        ),
        pageLink("Read a complete example note", "research")
      ),
      page(
        "portfolio",
        "Relationships, described precisely.",
        "Fictional research subjects illustrating how an organization can distinguish investment, collaboration, and observation.",
        heading("Example research subjects"),
        card(
          "Common Index",
          "A fictional shared-reference tool. Illustrative relationship: research subject only; no investment is claimed."
        ),
        card(
          "Open Current",
          "A fictional infrastructure concept. Illustrative relationship: research subject only; no funding or endorsement is claimed."
        ),
        heading("The relationship belongs in the record"),
        text(
          "An actual portfolio page should state only supplied relationships and relevant dates. Logos, descriptions, and proximity do not establish investment or endorsement."
        ),
        pageLink("Read the approach", "approach")
      ),
      page(
        "research",
        "Infrastructure is also a maintenance question.",
        "An example research note about the work required to keep a shared resource useful.",
        kicker("Research notebook · Illustrative analysis"),
        text(
          "A technical design can be elegant and still depend on fragile maintenance. Useful analysis asks who updates the documentation, handles failures, and makes decisions when priorities conflict.\n\nThis shifts attention from launch narratives to the ongoing work of stewardship. The evidence may be ordinary: clear records, tested recovery paths, and understandable responsibilities."
        ),
        heading("Questions to carry forward"),
        text(
          "Which dependencies are replaceable? Which decisions are reversible? What information would an independent operator need to continue the work?"
        ),
        pageLink("Return to the mandate", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "collecting-dao",
    name: "Collecting DAO",
    siteTitle: "Afterlight Collective",
    family: "fund",
    description:
      "An art-led collective with a collecting thesis, public selections, and readable governance references.",
    presentation: style("dao", "stone", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Afterlight Collective.",
        "A fictional collecting group asking what art can make visible when people look together.",
        image(
          ART.afterimage,
          "Afterimage — original example artwork; no acquisition is claimed."
        ),
        heading("A shared reason to look"),
        text(
          "The example thesis brings together works concerned with repetition, memory, and the traces a system leaves behind. The group begins with conversation, not a price chart."
        ),
        pageLink("Read the collecting thesis", "thesis"),
        pageLink("Visit the selection", "selection"),
        pageLink("People and decisions", "collective")
      ),
      page(
        "thesis",
        "Collecting as a shared practice.",
        "An example thesis for a fictional collective, distinct from a financial fund mandate.",
        heading("What connects the selection"),
        text(
          "We are interested in works that reveal how patterns accumulate and change. A strong addition should deepen a conversation among the works already present."
        ),
        heading("How to describe an acquisition"),
        text(
          "An actual record would include the supplied work identity, source, relationship, date, and decision context. An image in an exhibition is not proof of custody."
        ),
        quote(
          "The collection is a reason to keep talking, looking, and learning.",
          "Example collective principle"
        ),
        pageLink("See the example selection", "selection")
      ),
      page(
        "selection",
        "A conversation in three works.",
        "An example public selection without claims of token ownership, treasury activity, or completed acquisition.",
        gallery(
          "Afterlight selection",
          [ART.afterimage, ART.signal, ART.grid],
          "editorial"
        ),
        heading("Curatorial note"),
        text(
          "The order moves from a quiet impression to a continuous gesture and finally a denser rhythm. Each image changes the pace at which the next is encountered."
        ),
        pageLink("Read how the collective works", "collective")
      ),
      page(
        "collective",
        "People, decisions, and context.",
        "A fictional collective's public explanation of its working model.",
        heading("Working roles"),
        card(
          "Curation",
          "Members propose a selection and explain the relationship among the works."
        ),
        card(
          "Documentation",
          "Members keep supplied sources and decision context connected to the public record."
        ),
        heading("Governance references"),
        text(
          "An actual collective can link genuine proposals and decisions here. A public reference is not a voting interface or permission to execute a treasury action."
        ),
        heading("Public participation"),
        text(
          "Only members who choose public visibility should appear on this page. Add an authentic community destination when one is configured."
        ),
        pageLink("Return to the collective", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "institutional-collection",
    name: "Institutional Collection",
    siteTitle: "Field Archive",
    family: "organization",
    description:
      "A public collection presented through highlights, exhibition context, research, and stewardship.",
    presentation: style("editorial", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "Field Archive.",
        "A fictional collection devoted to the relationship between an artwork and the record that helps future visitors understand it.",
        image(ART.signal, ART_CAPTIONS.signal),
        heading("Encounter the work. Keep the context."),
        text(
          "The demonstration archive pairs spacious artwork views with readable interpretation and a clear statement of stewardship."
        ),
        pageLink("Collection highlights", "highlights"),
        pageLink("An example exhibition", "exhibition"),
        pageLink("Stewardship and research", "stewardship")
      ),
      page(
        "highlights",
        "A record open to looking.",
        "Three example works demonstrating collection presentation without asserting custody, donation, or acquisition history.",
        gallery(
          "Collection highlights",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("Reading a catalog entry"),
        text(
          "An actual entry should distinguish the work from its display image, identify supplied attribution, and explain the institution's relationship to it. Unknown information should remain unknown."
        ),
        pageLink("See the exhibition context", "exhibition")
      ),
      page(
        "exhibition",
        "Intervals: an example exhibition.",
        "A fictional digital presentation about the space between repeated forms.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        text(
          "The selection invites visitors to follow a changing interval through three different visual rhythms. There is no claimed physical venue or historical exhibition date.",
          "third"
        ),
        image(ART.grid, ART_CAPTIONS.grid),
        heading("Exhibition context"),
        text(
          "A real exhibition page can add supplied dates, venue, curatorial credits, installation views, and a catalog. This example demonstrates the composition without inventing that history."
        ),
        pageLink("Read the stewardship statement", "stewardship")
      ),
      page(
        "stewardship",
        "Care includes the record.",
        "An example statement about documentation, public interpretation, and long-term access.",
        heading("Sources and uncertainty"),
        text(
          "Keep original sources alongside interpretation. Describe uncertainty in the record rather than converting an assumption into a fact through repetition."
        ),
        heading("Representations and rights"),
        text(
          "An image, a digital file, and a physical work may have different permissions and preservation needs. Record those relationships explicitly."
        ),
        heading("Access over time"),
        text(
          "A durable reference should be accompanied by a realistic preservation plan. A public URL alone is not evidence of a permanent archive."
        ),
        externalLink("Read about shared licensing", SOURCE_LINKS.licenses),
        pageLink("Return to Field Archive", "studio")
      ),
    ],
  }),
];
